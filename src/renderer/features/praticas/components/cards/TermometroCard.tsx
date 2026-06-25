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
          <svg viewBox="0 0 90 270" width="90" height="240" aria-hidden>
            <rect x="36" y="15" width="18" height="210" rx="9" fill="var(--border,#333)" />
            <rect
              x="36"
              y={15 + (1 - frac) * 210}
              width="18"
              height={frac * 210}
              rx="9"
              fill={n.color}
            />
            <circle cx="45" cy="240" r="22" fill={n.color} />
          </svg>
          <div className="praticas-termometro-info">
            <span style={{ fontSize: 42 }}>{n.emoji}</span>
            <strong style={{ color: n.color }}>{n.label}</strong>
            <small>
              Média {media.toFixed(1)} / 10 · {comps.length} competências
            </small>
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
            onClick={() => setPraticas((v) => !v)}
            title="Práticas Beefor"
          >
            Práticas
          </button>
          <button
            type="button"
            className={`praticas-filtro-chip${assessments ? ' on' : ''}`}
            aria-pressed={assessments}
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
