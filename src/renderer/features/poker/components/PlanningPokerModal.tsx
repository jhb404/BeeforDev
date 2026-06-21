import { useEffect, useRef, useState } from 'react';
import { useIpc } from '../../../services/ipc';
import { ModalShell } from '../../../components/ui/ModalShell';
import { Check, Copy, Eye, RotateCcw, Spade } from '../../../components/common/Icons';
import { playUiSound } from '../../../utils/alarm';
import {
  usePokerRoom,
  type ConnState,
  type LiveReaction,
  type RoundRecord,
  type PokerRole,
} from '../usePokerRoom';
import { cardTier, pokerAsset } from '../cardTier';
import { PokerDogTable } from './PokerDogTable';
import { DECKS, DEFAULT_DECK_ID, getDeck, type DeckId } from '../../../../shared/poker/decks';

const EMOJI_REACTIONS = ['🔥', '👏', '😂', '👍', '❤️', '🤔'];
const SOUND_REACTIONS: { emoji: string; label: string; sound: string }[] = [
  { emoji: '🐶', label: 'Latido', sound: 'dog-bark' },
  { emoji: '👏', label: 'Aplauso', sound: 'clap' },
  { emoji: '👎', label: 'Vaia', sound: 'boo' },
  { emoji: '🥁', label: 'Suspense', sound: 'drumroll' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  /** convite vindo de deep link beefor://join?ws=…&room=… — auto-entra na sala */
  initialInvite?: { wsUrl: string; roomId: string } | null;
}

/**
 * Monta o convite = 1 link https clicável (Discord/Slack/WhatsApp linkam sozinho):
 *   https://<tunnel>/join?room=<CODE>
 * A página /join (servida pelo host via túnel) redireciona pro beefor://join.
 * wsUrl é wss://<tunnel> → troca pro https equivalente.
 */
function buildInviteLink(wsUrl: string, roomId: string): string {
  const httpOrigin = wsUrl.replace(/^ws/i, 'http').replace(/\/+$/, '');
  return `${httpOrigin}/join?room=${encodeURIComponent(roomId)}`;
}

const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function genRoomCode(): string {
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)];
  }
  return code;
}

function parseInvite(raw: string): { wsUrl: string; roomId: string } | null {
  const trimmed = raw.trim();

  // 1) deep link beefor://join?ws=<enc>&room=<CODE> (pode vir no meio de um texto)
  const deep = trimmed.match(/beefor:\/\/join\?[^\s]+/i);
  if (deep) {
    try {
      const u = new URL(deep[0]);
      const ws = u.searchParams.get('ws');
      const room = u.searchParams.get('room');
      if (ws && room) {
        const url = /^wss?:\/\//i.test(ws) ? ws : `ws://${ws}`;
        return { wsUrl: url, roomId: room.toUpperCase() };
      }
    } catch {
      /* cai pro formato antigo abaixo */
    }
  }

  // 2) link https clicável https://<tunnel>/join?room=<CODE> — host vem da origin
  const httpJoin = trimmed.match(/https?:\/\/[^\s]+\/join\?[^\s]+/i);
  if (httpJoin) {
    try {
      const u = new URL(httpJoin[0]);
      const room = u.searchParams.get('room');
      if (room) {
        return { wsUrl: u.origin.replace(/^http/i, 'ws'), roomId: room.toUpperCase() };
      }
    } catch {
      /* cai pro formato antigo abaixo */
    }
  }

  // 3) formato antigo wsUrl|ROOM (ou host:porta|ROOM)
  const m = trimmed.match(/(wss?:\/\/[^\s|]+|[\w.-]+:\d+)\s*\|\s*([A-Za-z0-9]+)/i);
  if (!m) return null;
  let url = m[1];
  if (!/^wss?:\/\//i.test(url)) url = `ws://${url}`;
  return { wsUrl: url, roomId: m[2].toUpperCase() };
}

const CONN_LABEL: Record<ConnState, string> = {
  connecting: 'Conectando…',
  connected: 'Conectado',
  reconnecting: 'Reconectando…',
  closed: 'Desconectado',
};

export function PlanningPokerModal({ open, onClose, initialInvite }: Props) {
  const { system } = useIpc();

  const [name, setName] = useState('');
  const [inviteInput, setInviteInput] = useState('');
  const [entryError, setEntryError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // host escolhe o dog na entrada; convidado escolhe na sala (modal)
  const [dogId, setDogId] = useState(1);

  const [wsUrl, setWsUrl] = useState<string | null>(null);
  // URL pública (tunnel) — só usada pro convite. O host conecta via ws://localhost
  // pra não depender de DNS do *.trycloudflare.com propagar antes do WebSocket abrir.
  const [publicInviteUrl, setPublicInviteUrl] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState<'link' | 'direct' | null>(null);

  // papel inicial definido NA AÇÃO (criar=seated, entrar=spectator), não derivado
  // de isHost no meio do render — senão race com o setIsHost batched manda spectator.
  const [initialRole, setInitialRole] = useState<PokerRole>('seated');

  // deck escolhido pelo host na tela de entrada (ignorado quando entra como guest).
  const [deckChoice, setDeckChoice] = useState<DeckId>(DEFAULT_DECK_ID);

  const {
    room,
    conn,
    reactions,
    history,
    selfId,
    vote,
    reveal,
    reset,
    sendReaction,
    rename,
    changeDog,
    sit,
    spectate,
  } = usePokerRoom({
    wsUrl,
    roomId,
    name,
    dogId,
    initialRole,
    // só envia deckId quando o host está criando — guests recebem do servidor.
    deckId: isHost ? deckChoice : undefined,
  });

  const revealWithSound = () => {
    playUiSound('poker-reveal');
    reveal();
  };

  useEffect(() => {
    if (open) return;
    if (isHost) void system.pokerStopTunnel();
    setWsUrl(null);
    setPublicInviteUrl(null);
    setRoomId(null);
    setIsHost(false);
    setInviteInput('');
    setEntryError(null);
    setCreating(false);
    setCopied(null);
  }, [open, isHost, system]);

  // convite via deep link: ao abrir, entra direto na sala como convidado
  useEffect(() => {
    if (!open || !initialInvite) return;
    setInitialRole('spectator');
    setIsHost(false);
    setWsUrl(initialInvite.wsUrl);
    setRoomId(initialInvite.roomId);
  }, [open, initialInvite]);

  // convite usa SEMPRE a URL pública do túnel (única que convidados conseguem alcançar);
  // o host conecta via ws://localhost (wsUrl) — ver createRoom.
  const inviteSourceUrl = publicInviteUrl ?? wsUrl;
  const inviteLink = inviteSourceUrl && roomId ? buildInviteLink(inviteSourceUrl, roomId) : null;
  const inviteText = inviteSourceUrl && roomId ? `${inviteSourceUrl}|${roomId}` : null;

  const createRoom = async () => {
    if (!name.trim()) return setEntryError('Digite seu nome.');
    setEntryError(null);
    setCreating(true);
    const [tunnelRes, port] = await Promise.all([system.pokerStartTunnel(), system.pokerGetPort()]);
    setCreating(false);
    if (!tunnelRes.ok || !tunnelRes.data) {
      setEntryError('Não foi possível abrir o túnel. Tente de novo.');
      return;
    }
    const tunnelWs = tunnelRes.data.replace(/^https:/i, 'wss:');
    setInitialRole('seated'); // host senta direto
    setIsHost(true);
    setPublicInviteUrl(tunnelWs);
    // host conecta direto no servidor local — não passa pelo edge da Cloudflare,
    // evita ERR_NAME_NOT_RESOLVED enquanto o DNS do subdomínio propaga.
    setWsUrl(`ws://localhost:${port}`);
    setRoomId(genRoomCode());
  };

  const joinRoom = () => {
    // nome NÃO é obrigatório pra entrar — se vazio, a sala pede o nome lá dentro.
    const parsed = parseInvite(inviteInput);
    if (!parsed) return setEntryError('Convite inválido. Cole o convite que o host enviou.');
    setEntryError(null);
    setInitialRole('spectator'); // convidado escolhe dog na sala antes de sentar
    setIsHost(false);
    setWsUrl(parsed.wsUrl);
    setRoomId(parsed.roomId);
  };

  const copyToClipboard = async (text: string) => {
    const res = await system.clipboardWrite(text);
    if (!res.ok) {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        /* fallback silencioso */
      }
    }
  };

  // 1) link clicável (Discord/Slack) — https://<tunnel>/join?room=… abre o app
  const copyLink = async () => {
    const text = inviteLink ?? inviteText;
    if (!text) return;
    await copyToClipboard(text);
    setCopied('link');
    setTimeout(() => setCopied(null), 1500);
  };

  // 2) convite direto — fallback: cola no campo "cole o convite" se o link falhar
  const copyDirect = async () => {
    if (!inviteText) return;
    await copyToClipboard(inviteText);
    setCopied('direct');
    setTimeout(() => setCopied(null), 1500);
  };

  const leaveRoom = () => {
    if (isHost) void system.pokerStopTunnel();
    setWsUrl(null);
    setRoomId(null);
    setIsHost(false);
  };

  const inRoom = wsUrl !== null && roomId !== null;

  return (
    <ModalShell open={open} onClose={onClose} className="poker-modal" labelledBy="poker-title">
      <div className="modal-head">
        <div>
          <p className="eyebrow">Time</p>
          <h2 id="poker-title">
            <Spade size={18} /> Planning Poker
          </h2>
        </div>
        <button className="secondary compact" onClick={onClose} data-sound="close">
          Fechar
        </button>
      </div>

      {!inRoom ? (
        <EntryScreen
          name={name}
          setName={setName}
          dogId={dogId}
          setDogId={setDogId}
          inviteInput={inviteInput}
          setInviteInput={setInviteInput}
          creating={creating}
          error={entryError}
          deckChoice={deckChoice}
          setDeckChoice={setDeckChoice}
          onCreate={() => void createRoom()}
          onJoin={joinRoom}
        />
      ) : (
        <RoomScreen
          roomId={roomId!}
          conn={conn}
          room={room}
          isHost={isHost}
          copied={copied}
          reactions={reactions}
          history={history}
          selfId={selfId}
          dogId={dogId}
          myName={name}
          onCopyLink={copyLink}
          onCopyDirect={copyDirect}
          onVote={vote}
          onReveal={revealWithSound}
          onReset={reset}
          onLeave={leaveRoom}
          onReact={sendReaction}
          onRename={(n) => {
            setName(n);
            rename(n);
          }}
          onChangeDog={(id) => {
            setDogId(id);
            changeDog(id);
          }}
          onSit={(id) => {
            if (id) setDogId(id);
            sit(id);
          }}
          onSpectate={spectate}
        />
      )}
    </ModalShell>
  );
}

/* ---------- tela de entrada (host escolhe dog aqui) ---------- */

function EntryScreen({
  name,
  setName,
  dogId,
  setDogId,
  inviteInput,
  setInviteInput,
  creating,
  error,
  deckChoice,
  setDeckChoice,
  onCreate,
  onJoin,
}: {
  name: string;
  setName: (v: string) => void;
  dogId: number;
  setDogId: (v: number) => void;
  inviteInput: string;
  setInviteInput: (v: string) => void;
  creating: boolean;
  error: string | null;
  deckChoice: DeckId;
  setDeckChoice: (v: DeckId) => void;
  onCreate: () => void;
  onJoin: () => void;
}) {
  const dogs = Array.from({ length: 14 }, (_, i) => i + 1);
  return (
    <div className="poker-entry">
      <div className="poker-entry__card">
        {/* hero: mascote escolhido + título */}
        <div className="poker-entry__hero">
          <div className="poker-entry__hero-dog">
            <img src={pokerAsset(`dog-${dogId}.png`)} alt="Seu personagem" />
          </div>
          <div className="poker-entry__hero-text">
            <h3>Bora pontuar?</h3>
            <p>Crie uma mesa e chame o time, ou entre com um convite.</p>
          </div>
        </div>

        <label className="poker-field">
          <span>Seu nome</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: João"
            maxLength={40}
            autoFocus
          />
        </label>

        <div className="poker-field poker-field--grow">
          <span>Seu personagem</span>
          <div className="poker-charpick poker-charpick--entry">
            {dogs.map((d) => (
              <button
                key={d}
                type="button"
                className={`poker-charpick__opt${dogId === d ? ' is-active' : ''}`}
                onClick={() => setDogId(d)}
                title={`Cachorro ${d}`}
              >
                <img src={pokerAsset(`dog-${d}.png`)} alt={`Cachorro ${d}`} />
              </button>
            ))}
          </div>
        </div>

        <label className="poker-field">
          <span>Baralho de votação</span>
          <select
            className="poker-select"
            value={deckChoice}
            onChange={(e) => setDeckChoice(e.target.value as DeckId)}
          >
            {DECKS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label} —{' '}
                {d.cards
                  .filter((c) => c !== '?' && c !== '☕')
                  .slice(0, 5)
                  .join(', ')}
                {d.cards.filter((c) => c !== '?' && c !== '☕').length > 5 ? '…' : ''}
              </option>
            ))}
          </select>
          <small className="poker-field__hint">{getDeck(deckChoice).description}</small>
        </label>

        <button className="warm poker-entry__create" onClick={onCreate} disabled={creating}>
          <img className="poker-entry__create-icon" src={pokerAsset('card-back.png')} alt="" />
          {creating ? 'Abrindo link…' : 'Criar nova mesa'}
        </button>

        <div className="poker-entry__or">
          <span>ou entre com um convite</span>
        </div>

        <div className="poker-entry__join">
          <input
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onJoin();
            }}
            placeholder="cole o convite aqui"
          />
          <button className="secondary" onClick={onJoin} disabled={creating}>
            Entrar
          </button>
        </div>

        {error && <p className="poker-error">{error}</p>}
      </div>
    </div>
  );
}

/* ---------- tela da sala ---------- */

function RoomScreen({
  roomId,
  conn,
  room,
  isHost,
  copied,
  reactions,
  history,
  selfId,
  dogId,
  myName,
  onCopyLink,
  onCopyDirect,
  onVote,
  onReveal,
  onReset,
  onLeave,
  onReact,
  onRename,
  onChangeDog,
  onSit,
  onSpectate,
}: {
  roomId: string;
  conn: ConnState;
  room: ReturnType<typeof usePokerRoom>['room'];
  isHost: boolean;
  copied: 'link' | 'direct' | null;
  reactions: LiveReaction[];
  history: RoundRecord[];
  selfId: string | null;
  dogId: number;
  myName: string;
  onCopyLink: () => void;
  onCopyDirect: () => void;
  onVote: (v: string) => void;
  onReveal: () => void;
  onReset: () => void;
  onLeave: () => void;
  onReact: (emoji: string, sound?: string) => void;
  onRename: (name: string) => void;
  onChangeDog: (id: number) => void;
  onSit: (id?: number) => void;
  onSpectate: () => void;
}) {
  // wrappers locais pra controlar a overlay de escolha junto com o WS
  const [selected, setSelected] = useState<string | null>(null);
  // convidado clicou "Só assistir" — já entra como spectator no server, então
  // não dá pra inferir pelo role; guardamos a escolha local pra fechar a overlay.
  const [choseSpectate, setChoseSpectate] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [reactOpen, setReactOpen] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [dogPickOpen, setDogPickOpen] = useState(false);
  const reactMenuRef = useRef<HTMLDivElement>(null);
  const histRef = useRef<HTMLDivElement>(null);
  const dogPickRef = useRef<HTMLDivElement>(null);

  // fecha menus ao clicar fora
  useEffect(() => {
    if (!reactOpen && !histOpen && !dogPickOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (reactOpen && reactMenuRef.current && !reactMenuRef.current.contains(t))
        setReactOpen(false);
      if (histOpen && histRef.current && !histRef.current.contains(t)) setHistOpen(false);
      if (dogPickOpen && dogPickRef.current && !dogPickRef.current.contains(t))
        setDogPickOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [reactOpen, histOpen, dogPickOpen]);

  // limpa seleção no reset
  useEffect(() => {
    if (room && !room.revealed && room.participants.every((p) => !p.voted)) {
      setSelected(null);
    }
  }, [room]);

  // reação automática ao resultado no reveal
  const prevRevealedRef = useRef(false);
  useEffect(() => {
    const nowRevealed = room?.revealed ?? false;
    if (!prevRevealedRef.current && nowRevealed && room) {
      const voters = room.participants.filter((p) => p.role !== 'spectator');
      const allSame =
        voters.length > 1 && voters.every((p) => p.vote === voters[0].vote && p.vote !== null);
      if (allSame) {
        onReact('🎉');
      } else {
        const votes = voters.map((p) => Number(p.vote)).filter((n) => !Number.isNaN(n));
        if (votes.length > 1 && Math.max(...votes) - Math.min(...votes) >= 8) onReact('😱');
      }
    }
    prevRevealedRef.current = nowRevealed;
  }, [room, onReact]);

  const pick = (card: string) => {
    setSelected(card);
    onVote(card);
  };

  const handleSit = (id?: number) => {
    setChoseSpectate(false);
    onSit(id);
  };
  const handleSpectate = () => {
    setChoseSpectate(true);
    setSelected(null); // espectador não tem voto — limpa a carta marcada
    onSpectate();
  };

  const revealed = room?.revealed ?? false;
  const participants = room?.participants ?? [];
  const seated = participants.filter((p) => p.role === 'seated');
  const bench = participants.filter((p) => p.role === 'bench');
  const me = selfId ? participants.find((p) => p.id === selfId) : undefined;
  const myRole = me?.role ?? 'spectator';
  const amSpectator = myRole === 'spectator';
  const seatsTaken = room?.seatsTaken ?? seated.length;
  const maxSeats = room?.maxSeats ?? 7;
  const seatsFull = seatsTaken >= maxSeats;

  const loading = (conn === 'connecting' || conn === 'reconnecting') && !room;
  const takenDogs = room?.takenDogs ?? [];
  const dogs = Array.from({ length: 14 }, (_, i) => i + 1);

  // entrou sem nome → pede o nome antes de qualquer coisa
  const needName = !loading && room !== null && !myName.trim();

  // precisa escolher personagem? (convidado que entrou como espectador e ainda
  // não sentou nem optou explicitamente por assistir) — só depois do nome
  const needPick =
    !needName &&
    !loading &&
    room !== null &&
    amSpectator &&
    !isHost &&
    !seatsFull &&
    !choseSpectate;

  const submitName = () => {
    const n = nameDraft.trim();
    if (n) onRename(n);
  };

  return (
    <div className="poker-room">
      <div className="poker-room__bar">
        {/* cluster 1: identidade da sala */}
        <div className="poker-room__cluster poker-room__cluster--id">
          <span className="poker-room__code">
            <span className="poker-room__code-label">Sala</span>
            <strong>{roomId}</strong>
          </span>
          <span className={`poker-conn poker-conn--${conn}`} title={CONN_LABEL[conn]}>
            <span className="poker-conn__dot" aria-hidden="true" />
            {CONN_LABEL[conn]}
          </span>
        </div>

        {/* cluster 2: convite — ação principal + fallback direto */}
        <div className="poker-invite" role="group" aria-label="Convidar time">
          <button
            type="button"
            className="poker-invite__main"
            onClick={onCopyLink}
            title="Copia o link clicável — mande no Discord/Slack/WhatsApp, é só clicar pra entrar"
          >
            {copied === 'link' ? <Check size={15} /> : <Copy size={15} />}
            {copied === 'link' ? 'Convite copiado!' : 'Copiar convite'}
          </button>
          <button
            type="button"
            className="poker-invite__alt"
            onClick={onCopyDirect}
            title="Convite direto — se o link não abrir no chat, cole isto no campo 'cole o convite' do app"
          >
            {copied === 'direct' ? <Check size={13} /> : <Copy size={13} />}
            {copied === 'direct' ? 'ok' : 'direto'}
          </button>
        </div>

        {/* cluster 3: ações do participante */}
        <div className="poker-room__cluster poker-room__cluster--actions">
          {amSpectator ? (
            <button
              className="secondary compact"
              onClick={() => handleSit()}
              title={
                seatsFull ? 'Mesa cheia — você entra no banco (vota igual)' : 'Entrar para votar'
              }
            >
              🎮 {seatsFull ? 'Banco' : 'Jogar'}
            </button>
          ) : (
            <button className="secondary compact" onClick={handleSpectate} title="Só assistir">
              👀 Assistir
            </button>
          )}

          {history.length > 0 && (
            <div className="poker-histmenu" ref={histRef}>
              <button
                className={`secondary compact poker-histmenu__toggle${histOpen ? ' is-open' : ''}`}
                onClick={() => setHistOpen((v) => !v)}
                title="Histórico de rounds"
              >
                📋 Histórico
              </button>
              {histOpen && (
                <div className="poker-histmenu__panel">
                  <p className="poker-histmenu__title">Rounds anteriores</p>
                  {history
                    .slice()
                    .reverse()
                    .map((r) => {
                      const label =
                        r.average !== null
                          ? `Média ${r.average}`
                          : r.results?.mode
                            ? `Mais votado: ${r.results.mode}`
                            : 'Sem voto';
                      return (
                        <div key={r.roundIndex} className="poker-histmenu__round">
                          <div className="poker-histmenu__round-head">
                            <span>Round {r.roundIndex + 1}</span>
                            <strong>{label}</strong>
                          </div>
                          <div className="poker-histmenu__votes">
                            {r.votes.map((v, i) => (
                              <span key={i} className="poker-histmenu__vote">
                                <span>{v.name}</span>
                                <strong>{v.vote ?? '—'}</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          <button className="secondary compact poker-room__leave" onClick={onLeave}>
            {isHost ? 'Encerrar' : 'Sair'}
          </button>
        </div>
      </div>

      <div className="poker-table-wrap">
        {/* menu de reações */}
        <div className="poker-reactmenu" ref={reactMenuRef}>
          <button
            className={`poker-reactmenu__toggle${reactOpen ? ' is-open' : ''}`}
            onClick={() => setReactOpen((v) => !v)}
            title="Reagir"
          >
            😀
          </button>
          {reactOpen && (
            <div className="poker-reactmenu__panel">
              <div className="poker-reactmenu__group">
                {EMOJI_REACTIONS.map((e) => (
                  <button key={e} className="poker-reactmenu__emoji" onClick={() => onReact(e)}>
                    {e}
                  </button>
                ))}
              </div>
              <div className="poker-reactmenu__divider" />
              <div className="poker-reactmenu__sounds">
                {SOUND_REACTIONS.map((s) => (
                  <button
                    key={s.sound}
                    className="poker-reactmenu__sound"
                    onClick={() => onReact(s.emoji, s.sound)}
                  >
                    <span>{s.emoji}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* trocar personagem (só quem já está sentado) */}
        {!amSpectator && !needPick && (
          <div className="poker-dogpick" ref={dogPickRef}>
            <button
              className={`poker-dogpick__toggle${dogPickOpen ? ' is-open' : ''}`}
              onClick={() => setDogPickOpen((v) => !v)}
              title="Trocar personagem"
            >
              <img src={pokerAsset(`dog-${dogId}.png`)} alt="Meu personagem" />
            </button>
            {dogPickOpen && (
              <div className="poker-dogpick__panel">
                <p className="poker-dogpick__label">Trocar personagem</p>
                <div className="poker-charpick poker-charpick--sm">
                  {dogs.map((d) => {
                    const taken = takenDogs.includes(d) && d !== dogId;
                    return (
                      <button
                        key={d}
                        type="button"
                        className={`poker-charpick__opt${dogId === d ? ' is-active' : ''}${taken ? ' is-taken' : ''}`}
                        onClick={() => {
                          if (taken) return;
                          onChangeDog(d);
                          setDogPickOpen(false);
                        }}
                        title={taken ? `Cachorro ${d} — já escolhido` : `Cachorro ${d}`}
                      >
                        <img src={pokerAsset(`dog-${d}.png`)} alt={`Cachorro ${d}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="poker-loader">
            <div className="poker-loader__spinner" />
            <span>{CONN_LABEL[conn]}</span>
          </div>
        ) : (
          <PokerDogTable
            participants={seated}
            bench={bench}
            revealed={revealed}
            results={room?.results ?? null}
            deckId={room?.deckId}
            reactions={reactions}
            maxSeats={maxSeats}
          />
        )}

        {/* pede o nome se entrou sem preencher */}
        {needName && (
          <div className="poker-pickover">
            <div className="poker-pickover__card poker-pickover__card--name">
              <p className="poker-pickover__title">Como te chamamos?</p>
              <p className="poker-pickover__hint">Seu nome aparece pro time na mesa.</p>
              <input
                className="poker-nameinput"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitName();
                }}
                placeholder="Ex: João"
                maxLength={40}
                autoFocus
              />
              <button className="warm" onClick={submitName} disabled={!nameDraft.trim()}>
                Entrar
              </button>
            </div>
          </div>
        )}

        {/* modal de escolha de personagem ao entrar */}
        {needPick && (
          <div className="poker-pickover">
            <div className="poker-pickover__card">
              <p className="poker-pickover__title">Escolha seu personagem</p>
              <p className="poker-pickover__hint">Personagens em cinza já foram escolhidos.</p>
              <div className="poker-charpick">
                {dogs.map((d) => {
                  const taken = takenDogs.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      className={`poker-charpick__opt${taken ? ' is-taken' : ''}`}
                      onClick={() => {
                        if (taken) return;
                        handleSit(d);
                      }}
                      title={taken ? `Cachorro ${d} — já escolhido` : `Sentar como cachorro ${d}`}
                    >
                      <img src={pokerAsset(`dog-${d}.png`)} alt={`Cachorro ${d}`} />
                    </button>
                  );
                })}
              </div>
              <button className="secondary compact poker-pickover__spec" onClick={handleSpectate}>
                👀 Só assistir
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="poker-dock">
        <div className="poker-dock__cards-wrap">
          <span className="poker-dock__label">
            {amSpectator
              ? 'Você está assistindo'
              : revealed
                ? 'Votos revelados'
                : 'Escolha sua carta'}
          </span>
          <div className="poker-dock__cards">
            {getDeck(room?.deckId).cards.map((card) => (
              <button
                key={card}
                className={`poker-card ${cardTier(card)}${selected === card ? ' is-selected' : ''}`}
                onClick={() => pick(card)}
                disabled={revealed || amSpectator}
              >
                <span className="poker-card__corner poker-card__corner--tl">{card}</span>
                <span className="poker-card__value">{card}</span>
                <span className="poker-card__corner poker-card__corner--br">{card}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="poker-dock__row">
          <div className="poker-room__spacer" />

          {isHost ? (
            !revealed ? (
              <button className="warm poker-dock__action" onClick={onReveal}>
                <Eye size={16} /> Revelar
              </button>
            ) : (
              <button className="warm poker-dock__action" onClick={onReset}>
                <RotateCcw size={16} /> Novo round
              </button>
            )
          ) : revealed ? (
            <span className="poker-dock__hint">Aguardando novo round…</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
