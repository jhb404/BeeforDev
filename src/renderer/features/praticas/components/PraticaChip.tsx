import type { BoxResumo, TeamMoodGrafico } from '@shared/types/index';
import { usePraticaCard } from '../hooks/usePraticasData';

const SENTIMENTO_EMOJI: Record<number, string> = { 1: '😄', 2: '🙂', 3: '😐', 4: '😟', 5: '🚫' };
const SENTIMENTO_LABEL: Record<number, string> = {
  1: 'Feliz',
  2: 'Bom',
  3: 'Neutro',
  4: 'Triste',
  5: 'Ausência',
};

type Visual = 'battery' | 'mood' | 'gauge' | 'number';

interface ChipDef {
  chave: string;
  nome: string;
  sub: string;
  visual: Visual;
  kind: 'box' | 'mood';
}

/** Bateria SVG (Capacity) — nível 0..1. */
function Battery({ nivel }: { nivel: number }) {
  const fill = Math.max(0, Math.min(1, nivel));
  const cor = fill > 0.66 ? 'var(--warm)' : fill > 0.33 ? '#f2c037' : '#e5484d';
  return (
    <svg viewBox="0 0 44 24" width="44" height="24" aria-hidden>
      <rect
        x="1"
        y="3"
        width="38"
        height="18"
        rx="3"
        fill="none"
        stroke="var(--border,#444)"
        strokeWidth="2"
      />
      <rect x="40" y="9" width="3" height="6" rx="1" fill="var(--border,#444)" />
      <rect x="4" y="6" width={Math.round(32 * fill)} height="12" rx="1.5" fill={cor} />
    </svg>
  );
}

/** Gauge mini (Indicador). */
function MiniGauge({ pct }: { pct: number }) {
  const f = Math.max(0, Math.min(100, pct)) / 100;
  const r = 16;
  const circ = Math.PI * r;
  return (
    <svg viewBox="0 0 40 24" width="40" height="24" aria-hidden>
      <path
        d="M 4 22 A 16 16 0 0 1 36 22"
        fill="none"
        stroke="var(--border,#444)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M 4 22 A 16 16 0 0 1 36 22"
        fill="none"
        stroke="var(--warm)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${f * circ} ${circ}`}
      />
    </svg>
  );
}

/**
 * Mini-card de resumo no topo (Capacity, Niko Calendar, Indicador).
 * Sotaque laranja Beefor. Click → modal config (placeholder).
 */
export function PraticaChip({
  def,
  idTime,
  onOpen,
}: {
  def: ChipDef;
  idTime: string;
  onOpen: (titulo: string, valor: string) => void;
}) {
  const isMood = def.kind === 'mood';
  const box = usePraticaCard<BoxResumo>(isMood ? '' : def.chave, isMood ? null : idTime);
  const mood = usePraticaCard<TeamMoodGrafico>(isMood ? def.chave : '', isMood ? idTime : null);

  const valorTexto = isMood
    ? mood.data?.sentimento
      ? SENTIMENTO_LABEL[mood.data.sentimento]
      : '—'
    : (box.data?.valorPrincipal ?? '—');
  const loading = isMood ? mood.loading : box.loading;

  const renderVisual = () => {
    if (loading) return <span className="praticas-chip-skel" />;
    switch (def.visual) {
      case 'battery': {
        const n = parseFloat(String(box.data?.valorPrincipal ?? '0').replace(',', '.'));
        // valor pode ser absoluto; normaliza p/ 0..1 contra valorSecundario se houver
        const max = parseFloat(String(box.data?.valorSecundario ?? '')) || Math.max(n, 1);
        return <Battery nivel={max ? n / max : 0} />;
      }
      case 'mood':
        return (
          <span className="praticas-chip-emoji">
            {mood.data?.sentimento ? SENTIMENTO_EMOJI[mood.data.sentimento] : '—'}
          </span>
        );
      case 'gauge': {
        const n = parseFloat(String(box.data?.valorPrincipal ?? '0').replace(',', '.'));
        return <MiniGauge pct={Number.isFinite(n) ? n : 0} />;
      }
      default:
        return <span className="praticas-chip-num">{valorTexto}</span>;
    }
  };

  return (
    <button
      type="button"
      className="praticas-minicard"
      onClick={() => onOpen(def.nome, valorTexto)}
      title={`${def.nome} — clique para configurar`}
    >
      <div className="praticas-minicard-top">
        <span className="praticas-minicard-nome">{def.nome}</span>
        <span className="praticas-minicard-cfg">⚙</span>
      </div>
      <div className="praticas-minicard-body">{renderVisual()}</div>
      <span className="praticas-minicard-sub">{box.data?.sub || def.sub || valorTexto}</span>
    </button>
  );
}

export const CHIPS: ChipDef[] = [
  { chave: 'CPCTY', nome: 'Capacity', sub: 'Capacidade atual', visual: 'battery', kind: 'box' },
  { chave: 'TM_NC', nome: 'Niko Calendar', sub: 'Humor do time', visual: 'mood', kind: 'mood' },
  { chave: 'INDCDR', nome: 'Indicador', sub: 'Média SP', visual: 'gauge', kind: 'box' },
];
