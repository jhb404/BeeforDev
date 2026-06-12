import { useState, useEffect, useRef } from 'react';
import { MONTHS_PT, daysInMonth, weekdayOf } from '../../../utils/dates';

export interface ImportRow {
  id: number;
  dia: number;
  mes: number;
  ano: number;
  entrada: string;
  saida: string;
}

interface Props {
  fileName: string;
  year: number;
  month: number;
  onClose: () => void;
  onEnviar: (rows: ImportRow[]) => void;
}

function buildMockRows(year: number, month: number): ImportRow[] {
  const total = daysInMonth(year, month);
  const rows: ImportRow[] = [];
  for (let d = 1; d <= total; d++) {
    const wd = weekdayOf(year, month, d);
    if (wd === 0 || wd === 6) continue; // pula fim de semana
    rows.push({ id: d, dia: d, mes: month, ano: year, entrada: '08:00', saida: '17:00' });
  }
  return rows;
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      className="imp-time-input"
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function ImportarMesModal({
  fileName: initialFileName,
  year,
  month,
  onClose,
  onEnviar,
}: Props) {
  const [rows, setRows] = useState<ImportRow[]>(() => buildMockRows(year, month));
  const [fileName, setFileName] = useState(initialFileName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    e.target.value = '';
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function patchRow(id: number, patch: Partial<ImportRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: number) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function addRow() {
    const maxId = rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1;
    setRows((prev) => [
      ...prev,
      { id: maxId, dia: 1, mes: month, ano: year, entrada: '08:00', saida: '17:00' },
    ]);
  }

  return (
    <div
      className="imp-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="imp-modal" role="dialog" aria-modal="true" aria-label="Importar mês">
        {/* ── Header ── */}
        <div className="imp-header">
          <div className="imp-icon-wrap" aria-hidden>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div className="imp-header-text">
            <h2 className="imp-title">Importar mês</h2>
            <span className="imp-subtitle">
              {fileName ? (
                <>
                  <span className="imp-file-badge">📄 {fileName}</span> · {MONTHS_PT[month - 1]}{' '}
                  {year}
                </>
              ) : (
                <>
                  {MONTHS_PT[month - 1]} {year} <span className="imp-mock-badge">mock</span>
                </>
              )}
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv,.tsv,.json,.md,.log"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            className="imp-load-file"
            onClick={() => fileInputRef.current?.click()}
            title="Carregar arquivo"
          >
            📂
          </button>
          <button className="imp-close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        {/* ── Tabela ── */}
        <div className="imp-table-wrap">
          <div className="imp-table">
            <div className="imp-thead">
              <span>Dia</span>
              <span>Mês</span>
              <span>Entrada</span>
              <span>Saída</span>
              <span aria-hidden />
            </div>

            <div className="imp-tbody">
              {rows.length === 0 && (
                <div className="imp-empty">Nenhuma linha. Adicione abaixo.</div>
              )}
              {rows.map((r) => (
                <div key={r.id} className="imp-row">
                  <input
                    className="imp-num-input"
                    type="number"
                    min={1}
                    max={31}
                    value={r.dia}
                    onChange={(e) => patchRow(r.id, { dia: Number(e.target.value) })}
                  />
                  <select
                    className="imp-select"
                    value={r.mes}
                    onChange={(e) => patchRow(r.id, { mes: Number(e.target.value) })}
                  >
                    {MONTHS_PT.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <TimeInput value={r.entrada} onChange={(v) => patchRow(r.id, { entrada: v })} />
                  <TimeInput value={r.saida} onChange={(v) => patchRow(r.id, { saida: v })} />
                  <button
                    className="imp-row-del"
                    onClick={() => removeRow(r.id)}
                    aria-label="Remover linha"
                    title="Remover"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="imp-footer">
          <button className="imp-add-row" onClick={addRow}>
            + Adicionar linha
          </button>
          <div className="imp-footer-actions">
            <button className="imp-btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="imp-btn-enviar warm"
              disabled={rows.length === 0}
              onClick={() => onEnviar(rows)}
            >
              Enviar {rows.length > 0 && <span className="imp-count">{rows.length}</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
