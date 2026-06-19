import { useEffect, useState } from 'react';
import { useIpc } from '../../../services/ipc';
import { ModalShell } from '../../../components/ui/ModalShell';
import { Copy, Eye, RotateCcw, Spade } from '../../../components/common/Icons';
import { playUiSound } from '../../../utils/alarm';
import { usePokerRoom, type ConnState, type LiveReaction } from '../usePokerRoom';
import { PokerDogTable } from './PokerDogTable';

/** Emojis de reação rápida (repassados a todos via servidor). */
const REACTIONS = ['🔥', '👏', '😂', '👍', '❤️', '🤔'];

interface Props {
  open: boolean;
  onClose: () => void;
}

const CARDS = ['1', '2', '3', '5', '8', '13', '21', '?', '☕'];
const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function genRoomCode(): string {
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)];
  }
  return code;
}

/**
 * Convite copiável: "wss://abc.trycloudflare.com|HZZPU".
 * Aceita também ws:// e host:porta cru (rede local / fallback).
 */
function parseInvite(raw: string): { wsUrl: string; roomId: string } | null {
  const m = raw.trim().match(/(wss?:\/\/[^\s|]+|[\w.-]+:\d+)\s*\|\s*([A-Za-z0-9]+)/i);
  if (!m) return null;
  let url = m[1];
  if (!/^wss?:\/\//i.test(url)) url = `ws://${url}`; // host:porta → ws://
  return { wsUrl: url, roomId: m[2].toUpperCase() };
}

const CONN_LABEL: Record<ConnState, string> = {
  connecting: 'Conectando…',
  connected: 'Conectado',
  reconnecting: 'Reconectando…',
  closed: 'Desconectado',
};

export function PlanningPokerModal({ open, onClose }: Props) {
  const { system } = useIpc();

  // tela de entrada
  const [name, setName] = useState('');
  const [inviteInput, setInviteInput] = useState('');
  const [entryError, setEntryError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // sessão ativa
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);

  const { room, conn, reactions, vote, reveal, reset, sendReaction } = usePokerRoom({
    wsUrl,
    roomId,
    name,
  });

  const revealWithSound = () => {
    playUiSound('poker-reveal');
    reveal();
  };

  // reseta ao fechar
  useEffect(() => {
    if (open) return;
    if (isHost) void system.pokerStopTunnel();
    setWsUrl(null);
    setRoomId(null);
    setIsHost(false);
    setInviteInput('');
    setEntryError(null);
    setCreating(false);
    setCopied(false);
  }, [open, isHost, system]);

  const inviteText = wsUrl && roomId ? `${wsUrl}|${roomId}` : null;

  const createRoom = async () => {
    if (!name.trim()) return setEntryError('Digite seu nome.');
    setEntryError(null);
    setCreating(true);
    const res = await system.pokerStartTunnel();
    setCreating(false);
    if (!res.ok || !res.data) {
      setEntryError('Não foi possível abrir o túnel. Tente de novo.');
      return;
    }
    // https://...trycloudflare.com → wss://...
    const url = res.data.replace(/^https:/i, 'wss:');
    setWsUrl(url);
    setRoomId(genRoomCode());
    setIsHost(true);
  };

  const joinRoom = () => {
    if (!name.trim()) return setEntryError('Digite seu nome.');
    const parsed = parseInvite(inviteInput);
    if (!parsed) return setEntryError('Convite inválido. Cole o convite que o host enviou.');
    setEntryError(null);
    setWsUrl(parsed.wsUrl);
    setRoomId(parsed.roomId);
    setIsHost(false);
  };

  const copyInvite = async () => {
    if (!inviteText) return;
    // Electron clipboard nativo (navigator.clipboard falha em file://).
    const res = await system.clipboardWrite(inviteText);
    if (!res.ok) {
      try {
        await navigator.clipboard.writeText(inviteText);
      } catch {
        /* último fallback: usuário copia do input visível */
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
      <header className="modal-head">
        <h2 id="poker-title">
          <Spade size={18} /> Planning Poker
        </h2>
        <button className="secondary compact" onClick={onClose}>
          Fechar
        </button>
      </header>

      {!inRoom ? (
        <EntryScreen
          name={name}
          setName={setName}
          inviteInput={inviteInput}
          setInviteInput={setInviteInput}
          creating={creating}
          error={entryError}
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
          onCopy={copyInvite}
          onVote={vote}
          onReveal={revealWithSound}
          onReset={reset}
          onLeave={leaveRoom}
          onReact={sendReaction}
        />
      )}
    </ModalShell>
  );
}

/* ---------- tela de entrada ---------- */

function EntryScreen({
  name,
  setName,
  inviteInput,
  setInviteInput,
  creating,
  error,
  onCreate,
  onJoin,
}: {
  name: string;
  setName: (v: string) => void;
  inviteInput: string;
  setInviteInput: (v: string) => void;
  creating: boolean;
  error: string | null;
  onCreate: () => void;
  onJoin: () => void;
}) {
  return (
    <div className="poker-entry">
      <label className="poker-field">
        <span>Seu nome</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: João"
          maxLength={40}
        />
      </label>

      <div className="poker-entry__split">
        <div className="poker-entry__col">
          <h3>Criar sala</h3>
          <p className="poker-hint">
            Você vira o host. O app abre um link público (Cloudflare) — a squad entra de qualquer
            lugar, sem instalar nada.
          </p>
          <button className="warm" onClick={onCreate} disabled={creating}>
            {creating ? 'Abrindo link…' : 'Criar sala'}
          </button>
        </div>

        <div className="poker-entry__divider" />

        <div className="poker-entry__col">
          <h3>Entrar numa sala</h3>
          <label className="poker-field">
            <span>Convite</span>
            <input
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              placeholder="cole o convite aqui"
            />
          </label>
          <button className="secondary" onClick={onJoin} disabled={creating}>
            Entrar na sala
          </button>
        </div>
      </div>

      {error && <p className="poker-error">{error}</p>}
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
  onCopy,
  onVote,
  onReveal,
  onReset,
  onLeave,
  onReact,
}: {
  roomId: string;
  conn: ConnState;
  room: ReturnType<typeof usePokerRoom>['room'];
  isHost: boolean;
  copied: boolean;
  reactions: LiveReaction[];
  onCopy: () => void;
  onVote: (v: string) => void;
  onReveal: () => void;
  onReset: () => void;
  onLeave: () => void;
  onReact: (emoji: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  // limpa seleção local quando a sala é resetada
  useEffect(() => {
    if (room && !room.revealed && room.participants.every((p) => !p.voted)) {
      setSelected(null);
    }
  }, [room]);

  const pick = (card: string) => {
    setSelected(card);
    onVote(card);
  };

  const revealed = room?.revealed ?? false;
  const participants = room?.participants ?? [];

  return (
    <div className="poker-room">
      <div className="poker-room__bar">
        <button className="poker-room__code" onClick={onCopy} title="Copiar convite da sala">
          <span className="poker-room__code-label">Sala</span>
          <Copy size={14} />
          <strong>{roomId}</strong>
          {copied && <span className="poker-room__copied">copiado!</span>}
        </button>
        <span className={`poker-conn poker-conn--${conn}`}>{CONN_LABEL[conn]}</span>
        <div className="poker-room__spacer" />
        <button className="secondary compact" onClick={onLeave}>
          {isHost ? 'Encerrar sala' : 'Sair'}
        </button>
      </div>

      <PokerDogTable
        participants={participants}
        revealed={revealed}
        average={room?.average ?? null}
        reactions={reactions}
      />

      <div className="poker-dock">
        <div className="poker-dock__cards-wrap">
          <span className="poker-dock__label">
            {revealed ? 'Votos revelados' : 'Escolha sua carta'}
          </span>
          <div className="poker-dock__cards">
            {CARDS.map((card) => (
              <button
                key={card}
                className={`poker-card${selected === card ? ' is-selected' : ''}`}
                onClick={() => pick(card)}
                disabled={revealed}
              >
                {card}
              </button>
            ))}
          </div>
        </div>

        <div className="poker-dock__row">
          <div className="poker-reactions">
            {REACTIONS.map((e) => (
              <button
                key={e}
                className="poker-reactions__btn"
                onClick={() => onReact(e)}
                title="Reagir"
              >
                {e}
              </button>
            ))}
          </div>

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
          ) : (
            <span className="poker-dock__hint">
              {revealed ? 'Aguardando novo round…' : 'O host revela os votos'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
