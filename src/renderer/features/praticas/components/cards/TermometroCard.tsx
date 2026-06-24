import { useEffect, useState } from 'react';
import type { TermometroGrafico } from '@shared/types/index';
import { CardShell } from '../CardShell';
import { CardActions } from '../CardActions';
import type { CardProps } from './registry';

const NIVEIS = [
  { min: 9, label: 'Fervendo', color: '#e5484d', emoji: '🔥' },
  { min: 7, label: 'Quente', color: '#ff9400', emoji: '☀️' },
  { min: 5, label: 'Morno', color: '#f2c037', emoji: '⛅' },
  { min: 3, label: 'Frio', color: '#7c5cbf', emoji: '🌬️' },
  { min: 0, label: 'Congelado', color: '#5b8def', emoji: '❄️' },
];
const nivel = (p: number) => NIVEIS.find((n) => p >= n.min) ?? NIVEIS[NIVEIS.length - 1];

/** Termômetro — gauge vertical + 2 filtros (Práticas Beefor / Assessments) + Detalhes. */
export function TermometroCard({ idTime, nome }: CardProps) {
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
  const frac = Math.max(0, Math.min(1, media / 10));

  return (
    <CardShell titulo={nome || 'Termômetro de Práticas'} loading={loading} error={error}>
      {comps.length === 0 ? (
        <div className="praticas-chart-empty">Sem dados para os filtros selecionados.</div>
      ) : (
        <div className="praticas-termometro">
          <svg viewBox="0 0 60 180" width="60" height="180" aria-hidden>
            <rect x="24" y="10" width="12" height="140" rx="6" fill="var(--border,#333)" />
            <rect
              x="24"
              y={10 + (1 - frac) * 140}
              width="12"
              height={frac * 140}
              rx="6"
              fill={n.color}
            />
            <circle cx="30" cy="160" r="14" fill={n.color} />
          </svg>
          <div className="praticas-termometro-info">
            <span style={{ fontSize: 28 }}>{n.emoji}</span>
            <strong style={{ color: n.color }}>{n.label}</strong>
            <small>
              Média {media.toFixed(1)} / 10 · {comps.length} competências
            </small>
          </div>
        </div>
      )}

      {/* filtros abaixo do termômetro (igual web) */}
      <div className="praticas-term-filtros">
        <label className={`praticas-toggle${praticas ? ' on' : ''}`}>
          <input
            type="checkbox"
            checked={praticas}
            onChange={(e) => setPraticas(e.target.checked)}
          />
          Práticas Beefor
        </label>
        <label className={`praticas-toggle${assessments ? ' on' : ''}`}>
          <input
            type="checkbox"
            checked={assessments}
            onChange={(e) => setAssessments(e.target.checked)}
          />
          Assessments
        </label>
      </div>

      <CardActions actions={[{ label: 'Detalhes', onClick: () => setModal(true) }]} />

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
