import { useEffect, useMemo, useRef } from 'react';
import { playUiSound, type UiSoundKind } from '../../../utils/alarm';
import { cardTier, pokerAsset } from '../cardTier';
import type { LiveReaction, PokerParticipant } from '../usePokerRoom';

/**
 * Modo PokerDog: mesa pixel-art transparente no centro, 7 cães em volta.
 * Cada participante recebe um cão (sprite isolado) sorteado sem repetir.
 * Assento vazio = placa "vazio". Interativo:
 *  - cão pula ao votar
 *  - cão "dorme" (zzz, dessaturado) enquanto não vota
 *  - carta dá flip 3D no reveal (verso → frente com o valor)
 *  - consenso (verde) vs outlier (vermelho) destacados
 */

const NON_NUMERIC = new Set(['?', '☕']);

/* ════════════════════════════════════════════════════════════════════
 * AJUSTE VISUAL — mexa aqui pra posicionar/dimensionar.
 * ════════════════════════════════════════════════════════════════════ */

/** Posição de cada cão, em % do container quadrado (x = horizontal, y = vertical). */
const SEATS = [
  { x: 30, y: 17 }, // 1 topo-esq
  { x: 50, y: 15 }, // 2 topo-meio
  { x: 70, y: 17 }, // 3 topo-dir
  { x: 14, y: 45 }, // 4 meio-esq
  { x: 86, y: 45 }, // 5 meio-dir
  { x: 33, y: 70 }, // 6 base-esq
  { x: 67, y: 70 }, // 7 base-dir
];

/** Tamanho do sprite do cão (px). */
const DOG_SIZE = 84;

/** Tamanho da carta de voto (px). */
const CARD_W = 32;
const CARD_H = 44;

/**
 * Deslocamento da CARTA em relação ao centro do cão (px).
 * x negativo = esquerda, y negativo = pra cima.
 * Mexa aqui pra alinhar a carta do seu jeito.
 */
// const CARD_OFFSET = { x: 0, y: -78 };
const CARD_OFFSET = { x: 0, y: 3 };

/** Deslocamento da PLACA DE NOME em relação ao cão (px). y positivo = pra baixo. */
const NAME_OFFSET = { x: 0, y: 46 };

/* ════════════════════════════════════════════════════════════════════ */

interface Props {
  /** participantes sentados na mesa (até maxSeats). */
  participants: PokerParticipant[];
  /** participantes no banco de reserva (votam mas não sentam). */
  bench?: PokerParticipant[];
  revealed: boolean;
  average: number | null;
  reactions: LiveReaction[];
  maxSeats?: number;
}

export function PokerDogTable({ participants, bench = [], revealed, average, reactions }: Props) {
  // reações agrupadas por participante (pra flutuar sobre o cão certo)
  const reactionsBySeat = useMemo(() => {
    const map: Record<string, LiveReaction[]> = {};
    for (const r of reactions) {
      (map[r.fromId] ??= []).push(r);
    }
    return map;
  }, [reactions]);

  // toca o som de cada reação nova que chega (uma vez por key)
  const playedSounds = useRef(new Set<number>());
  useEffect(() => {
    for (const r of reactions) {
      if (r.sound && !playedSounds.current.has(r.key)) {
        playedSounds.current.add(r.key);
        playUiSound(r.sound as UiSoundKind);
      }
    }
  }, [reactions]);

  // voto majoritário (consenso) pra destacar verde vs outlier vermelho
  const consensus = useMemo(() => {
    if (!revealed) return null;
    const counts = new Map<string, number>();
    for (const p of participants) {
      if (p.vote && !NON_NUMERIC.has(p.vote)) {
        counts.set(p.vote, (counts.get(p.vote) ?? 0) + 1);
      }
    }
    let best: string | null = null;
    let max = 0;
    for (const [v, c] of counts) {
      if (c > max) {
        max = c;
        best = v;
      }
    }
    return max >= 2 ? best : null;
  }, [participants, revealed]);

  // votação conta mesa + banco (espectadores não entram)
  const voters = [...participants, ...bench];
  const pending = voters.filter((p) => !p.voted).length;

  return (
    <div className="pdog">
      <img className="pdog__table" src={pokerAsset('table.png')} alt="" aria-hidden="true" />

      {SEATS.map((seat, i) => {
        const p = participants[i];
        const style = { left: `${seat.x}%`, top: `${seat.y}%` };

        if (!p) {
          return (
            <div key={i} className="pdog__seat is-empty" style={style}>
              <span className="pdog__name is-empty">vazio</span>
            </div>
          );
        }

        const notVoted = !revealed && !p.voted;
        const isNum = p.vote && !NON_NUMERIC.has(p.vote);
        const isConsensus = revealed && consensus !== null && p.vote === consensus;
        const isOutlier = revealed && consensus !== null && isNum && p.vote !== consensus;
        // fallback: se o servidor ainda não manda dogId, deriva pelo assento
        const dogId = p.dogId && p.dogId >= 1 && p.dogId <= 14 ? p.dogId : (i % 14) + 1;

        const seatClass = [
          'pdog__seat',
          p.voted && !revealed ? 'just-voted' : '',
          p.voted ? 'has-voted' : '',
        ]
          .filter(Boolean)
          .join(' ');

        const dogClass = [
          'pdog__dog',
          isConsensus ? 'is-consensus' : '',
          isOutlier ? 'is-outlier' : '',
        ]
          .filter(Boolean)
          .join(' ');

        // carta: brilho dourado se votou mas ainda não revelou
        const cardClass = [
          'pdog__card',
          revealed ? 'is-flipped' : '',
          p.voted && !revealed ? 'is-held' : '',
          isConsensus ? 'is-consensus' : '',
          isOutlier ? 'is-outlier' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div key={p.id} className={seatClass} style={style}>
            <img
              className={dogClass}
              src={pokerAsset(`dog-${dogId}.png`)}
              alt={p.name}
              style={{ width: `${DOG_SIZE}px` }}
              onDoubleClick={() => playUiSound('dog-bark')}
            />
            {notVoted && <span className="pdog__think">💭</span>}

            {(reactionsBySeat[p.id] ?? []).map((r) => (
              <span key={r.key} className="pdog__reaction">
                {r.emoji}
              </span>
            ))}

            <span
              className="pdog__name"
              style={{
                transform: `translate(calc(-50% + ${NAME_OFFSET.x}px), ${NAME_OFFSET.y}px)`,
              }}
            >
              {p.name}
            </span>

            {(revealed || p.voted) && (
              <span
                className={cardClass}
                style={{
                  width: `${CARD_W}px`,
                  height: `${CARD_H}px`,
                  transform: `translate(calc(-50% + ${CARD_OFFSET.x}px), ${CARD_OFFSET.y}px)`,
                }}
              >
                <span className="pdog__card-inner">
                  <img
                    className="pdog__card-face pdog__card-back"
                    src={pokerAsset('card-back.png')}
                    alt=""
                  />
                  <span className={`pdog__card-face pdog__card-front ${cardTier(p.vote)}`}>
                    {p.vote ?? '—'}
                  </span>
                </span>
              </span>
            )}
          </div>
        );
      })}

      <div className="pdog__center">
        {revealed && average !== null ? (
          <div className="pdog__avg">
            <span>Média</span>
            <strong>{average}</strong>
            {consensus && <em>🎉 consenso em {consensus}</em>}
          </div>
        ) : (
          <div className="pdog__status">
            <span className="pdog__status-text">
              <span className="pdog__paw">🐾</span>
              {voters.length === 0
                ? 'sala vazia'
                : pending > 0
                  ? 'Aguardando todos votarem…'
                  : 'Todos votaram!'}
            </span>
            {voters.length > 0 && (
              <span className="pdog__dots">
                <span className="pdog__dots-count">
                  {voters.length - pending}/{voters.length}
                </span>
                {voters.map((p) => (
                  <span
                    key={p.id}
                    className={`pdog__dot${p.voted ? ' is-on' : ''}`}
                    title={p.name}
                  />
                ))}
              </span>
            )}
          </div>
        )}
      </div>

      {/* banco de reserva — quem passou de 7 lugares (vota mas não senta) */}
      {bench.length > 0 && (
        <div className="pdog__bench">
          <span className="pdog__bench-label">🪑 Banco</span>
          {bench.map((p) => (
            <span
              key={p.id}
              className={`pdog__bench-item${p.voted || revealed ? ' has-voted' : ''}`}
              title={p.name}
            >
              <img src={pokerAsset(`dog-${p.dogId}.png`)} alt="" />
              <span className="pdog__bench-name">{p.name}</span>
              <span className="pdog__bench-status">
                {revealed ? (p.vote ?? '—') : p.voted ? '✓' : '💭'}
              </span>
              {(reactionsBySeat[p.id] ?? []).map((r) => (
                <span key={r.key} className="pdog__reaction pdog__reaction--bench">
                  {r.emoji}
                </span>
              ))}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
