import { useEffect, useState } from 'react';
import type { TermometroGrafico } from '@shared/types/index';
import { CardShell } from '../CardShell';
import type { CardProps } from './registry';

const NIVEIS = [
  { min: 9, label: 'Fervendo', color: 'var(--temp-5)', emoji: '🔥' },
  { min: 7, label: 'Quente', color: 'var(--temp-4)', emoji: '☀️' },
  { min: 5, label: 'Morno', color: 'var(--temp-3)', emoji: '⛅' },
  { min: 3, label: 'Frio', color: 'var(--temp-2)', emoji: '🌬️' },
  { min: 0, label: 'Congelado', color: 'var(--temp-1)', emoji: '❄️' },
];
const nivel = (p: number) => NIVEIS.find((n) => p >= n.min) ?? NIVEIS[NIVEIS.length - 1];

// Geometria (viewBox): coluna de y=15 (topo) a y=225 (base), altura 210.
const ALTURA = 210;
const SEG = ALTURA / NIVEIS.length; // 5 faixas de tamanho IGUAL (42 cada)

/** Faixas de baixo→cima, cada uma com seu range real de valor [lo, hi). */
const FAIXAS = [...NIVEIS].reverse().map((lvl, i, arr) => ({
  ...lvl,
  lo: lvl.min,
  hi: i < arr.length - 1 ? arr[i + 1].min : 10,
}));

/** centro vertical (y) da faixa i (0 = base) — divisões iguais. */
const centroY = (i: number) => 225 - SEG * i - SEG / 2;

/**
 * valor 0..10 → fração de preenchimento 0..1, com faixas IGUAIS no eixo.
 * Cada faixa ocupa 1/5 da coluna; dentro dela interpola pelos valores reais,
 * então os limites 3/5/7/9 caem exatamente nos divisores.
 */
function fracDe(v: number): number {
  const idx = FAIXAS.findIndex((f) => v < f.hi);
  const i = idx === -1 ? FAIXAS.length - 1 : idx;
  const f = FAIXAS[i];
  const local = f.hi === f.lo ? 1 : (v - f.lo) / (f.hi - f.lo);
  return (i + Math.max(0, Math.min(1, local))) / FAIXAS.length;
}

/** Termômetro — gauge vertical + 2 filtros (Práticas Beefor / Assessments) + Detalhes. */
export function TermometroCard({ chave, idTime, nome }: CardProps) {
  const [praticas, setPraticas] = useState(true);
  const [assessments, setAssessments] = useState(true);
  const [data, setData] = useState<TermometroGrafico | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    void window.beeforHttp.praticas
      .termometro(idTime, praticas, assessments)
      .then((res) => {
        if (!alive) return;
        if (res.ok) setData(res.data);
        else setError(res.error);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [idTime, praticas, assessments]);

  const comps = data?.competencias ?? [];
  const media = comps.length ? comps.reduce((s, c) => s + c.pontos, 0) / comps.length : 0;
  const n = nivel(media);
  const frac = fracDe(media);

  // Nível de preenchimento animado: drena pra 0 enquanto carrega, enche ao chegar dados.
  const [displayFrac, setDisplayFrac] = useState(0);
  useEffect(() => {
    if (loading) {
      setDisplayFrac(0); // drena
      return;
    }
    // enche no próximo frame pra disparar a transição CSS a partir do 0
    const id = requestAnimationFrame(() => setDisplayFrac(frac));
    return () => cancelAnimationFrame(id);
  }, [loading, frac]);

  const fillTransition = 'y .7s cubic-bezier(.22,1,.36,1), height .7s cubic-bezier(.22,1,.36,1)';
  const firstLoad = loading && !data; // só blanqueia na 1ª carga

  return (
    <CardShell
      titulo={nome || 'Termômetro de Práticas'}
      chave={chave}
      loading={firstLoad}
      error={error}
    >
      {!firstLoad && comps.length === 0 ? (
        <div className="praticas-chart-empty">Sem dados para os filtros selecionados.</div>
      ) : (
        <div className="praticas-termometro">
          <svg viewBox="0 0 108 270" width="108" height="240" className="praticas-term-svg">
            {/* ícones das faixas (hover mostra o nome) — centrados em cada divisão igual */}
            {FAIXAS.map((b, i) => (
              <text
                key={b.label}
                x="20"
                y={centroY(i)}
                textAnchor="middle"
                dominantBaseline="central"
                className={`praticas-term-ico${b.label === n.label ? ' on' : ''}`}
              >
                {b.emoji}
                <title>{b.label}</title>
              </text>
            ))}
            {/* trilho */}
            <rect x="52" y="15" width="18" height="210" rx="9" fill="var(--chart-track,#333)" />
            {/* preenchimento animado */}
            <rect
              x="52"
              y={15 + (1 - displayFrac) * 210}
              width="18"
              height={displayFrac * 210}
              rx="9"
              fill={n.color}
              style={{ transition: fillTransition }}
            />
            {/* divisores em posições IGUAIS (limites 3/5/7/9 caem aqui) */}
            {[1, 2, 3, 4].map((k) => (
              <line
                key={k}
                x1="50"
                x2="72"
                y1={225 - SEG * k}
                y2={225 - SEG * k}
                stroke="var(--panel-bg)"
                strokeWidth="2.5"
              />
            ))}
            {/* bulbo */}
            <circle
              cx="61"
              cy="240"
              r="22"
              fill={n.color}
              style={{ transition: 'fill .4s ease' }}
            />
          </svg>
          <div className="praticas-termometro-info">
            <span style={{ fontSize: 42 }}>{n.emoji}</span>
            <strong style={{ color: n.color }}>{n.label}</strong>
            <small>
              Média {media.toFixed(1)} / 10 · {comps.length} competências
            </small>
            {loading && <small className="praticas-term-loading">Atualizando…</small>}
          </div>
        </div>
      )}

      {/* rodapé: 2 filtros (chips toggle) à esquerda, Detalhes à direita */}
      <div className="praticas-card-footer">
        <div className="praticas-card-footer-left praticas-term-filtros">
          <button
            type="button"
            className={`praticas-filtro-chip${praticas ? ' on' : ''}`}
            aria-pressed={praticas}
            disabled={loading}
            onClick={() => setPraticas((v) => !v)}
            title="Práticas Beefor"
          >
            Práticas
          </button>
          <button
            type="button"
            className={`praticas-filtro-chip${assessments ? ' on' : ''}`}
            aria-pressed={assessments}
            disabled={loading}
            onClick={() => setAssessments((v) => !v)}
            title="Assessments"
          >
            Assessments
          </button>
        </div>
        <button type="button" className="praticas-footer-link" onClick={() => setModal(true)}>
          Detalhes
        </button>
      </div>

      {modal && (
        <div className="praticas-modal-overlay" onClick={() => setModal(false)}>
          <div className="praticas-modal" onClick={(e) => e.stopPropagation()}>
            <header className="praticas-modal-head">
              <h3>Termômetro — competências</h3>
              <button
                type="button"
                className="praticas-modal-close"
                onClick={() => setModal(false)}
              >
                ×
              </button>
            </header>
            <div className="praticas-modal-body">
              <ul className="praticas-term-lista">
                {comps.map((c, i) => {
                  const cn = nivel(c.pontos);
                  return (
                    <li key={i}>
                      <span>{c.nome}</span>
                      <span style={{ color: cn.color, fontWeight: 700 }}>
                        {c.pontos.toFixed(1)} {cn.emoji}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </CardShell>
  );
}
