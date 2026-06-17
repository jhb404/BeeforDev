import { useEffect, useState } from 'react';
import { useIpc } from '../../../services/ipc';
import { ModalShell } from '../../../components/ui/ModalShell';
import { Check, Clock, Copy, Eye, RotateCcw, Spade } from '../../../components/common/Icons';
import { usePokerRoom, type ConnState } from '../usePokerRoom';

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

  const { room, conn, vote, reveal, reset } = usePokerRoom({ wsUrl, roomId, name });

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
          inviteText={inviteText}
          copied={copied}
          onCopy={copyInvite}
          onVote={vote}
          onReveal={reveal}
          onReset={reset}
          onLeave={leaveRoom}
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
  inviteText,
  copied,
  onCopy,
  onVote,
  onReveal,
  onReset,
  onLeave,
}: {
  roomId: string;
  conn: ConnState;
  room: ReturnType<typeof usePokerRoom>['room'];
  isHost: boolean;
  inviteText: string | null;
  copied: boolean;
  onCopy: () => void;
  onVote: (v: string) => void;
  onReveal: () => void;
  onReset: () => void;
  onLeave: () => void;
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

  return (
    <div className="poker-room">
      <div className="poker-room__bar">
        <div className="poker-room__room">
          Sala <strong>{roomId}</strong>
        </div>
        <span className={`poker-conn poker-conn--${conn}`}>{CONN_LABEL[conn]}</span>
      </div>

      {inviteText && (
        <div className="poker-invite">
          <input
            className="poker-invite__field"
            value={inviteText}
            readOnly
            onFocus={(e) => e.currentTarget.select()}
            onClick={(e) => e.currentTarget.select()}
          />
          <button className="secondary compact" onClick={onCopy}>
            <Copy size={14} /> {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      )}

      <div className="poker-cards">
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

      <div className="poker-people">
        {(room?.participants ?? []).map((p) => (
          <div key={p.id} className="poker-person">
            <span className="poker-person__name">{p.name}</span>
            {revealed ? (
              <span className="poker-person__vote">{p.vote ?? '—'}</span>
            ) : p.voted ? (
              <span className="poker-badge poker-badge--ok">
                <Check size={13} /> votou
              </span>
            ) : (
              <span className="poker-badge poker-badge--wait">
                <Clock size={13} /> aguardando
              </span>
            )}
          </div>
        ))}
        {(room?.participants?.length ?? 0) === 0 && (
          <p className="poker-hint">Ninguém na sala ainda.</p>
        )}
      </div>

      <footer className="poker-room__actions modal-actions">
        {revealed && room?.average !== null && room?.average !== undefined && (
          <span className="poker-avg">Média: {room.average}</span>
        )}
        <div className="poker-room__spacer" />
        <button className="secondary" onClick={onLeave}>
          {isHost ? 'Encerrar sala' : 'Sair'}
        </button>
        {!revealed ? (
          <button className="warm" onClick={onReveal}>
            <Eye size={15} /> Revelar
          </button>
        ) : (
          <button className="warm" onClick={onReset}>
            <RotateCcw size={15} /> Novo round
          </button>
        )}
      </footer>
    </div>
  );
}
