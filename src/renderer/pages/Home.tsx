import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  AppSettings,
  FetchedTimesheetRow,
  Mood,
  TimesheetEntry,
} from '../../shared/types';
import { MOODS } from '../../shared/types';
import { useBeefor } from '../hooks/useBeefor';
import { MoodPicker } from '../components/MoodPicker';
import {
  MONTHS_PT,
  WEEKDAY_SHORT_PT,
  daysInMonth,
  isoDate,
  pad2,
  todayIso,
  weekdayOf,
} from '../utils/dates';
import { formatMinutes, toMinutes, workedMinutes } from '../utils/timeMath';

interface Toast {
  kind: 'ok' | 'err';
  msg: string;
}

interface RowState extends TimesheetEntry {
  weekday: number;
  status?: string;
  editable: boolean;
  saving?: boolean;
  saved?: boolean;
  failed?: boolean;
  errMsg?: string;
}

const FIELDS: Array<{ key: keyof Omit<TimesheetEntry, 'date' | 'comentario'>; label: string }> = [
  { key: 'entrada', label: 'Entrada' },
  { key: 'int1', label: 'Int 1' },
  { key: 'ret1', label: 'Ret 1' },
  { key: 'int2', label: 'Int 2' },
  { key: 'ret2', label: 'Ret 2' },
  { key: 'saida', label: 'Saída' },
];

function emptyRow(year: number, month: number, day: number): RowState {
  const wd = weekdayOf(year, month, day);
  return {
    date: isoDate(year, month, day),
    weekday: wd,
    entrada: '',
    int1: '',
    ret1: '',
    int2: '',
    ret2: '',
    saida: '',
    comentario: '',
    editable: wd !== 0 && wd !== 6,
  };
}

function buildEmpty(year: number, month: number): RowState[] {
  const total = daysInMonth(year, month);
  const out: RowState[] = [];
  for (let d = 1; d <= total; d++) out.push(emptyRow(year, month, d));
  return out;
}

function mergeFetched(year: number, month: number, fetched: FetchedTimesheetRow[]): RowState[] {
  const base = buildEmpty(year, month);
  const byDate = new Map(fetched.map((f) => [f.date, f]));
  return base.map((r) => {
    const f = byDate.get(r.date);
    if (!f) return r;
    return {
      ...r,
      entrada: f.entrada,
      int1: f.int1,
      ret1: f.ret1,
      int2: f.int2,
      ret2: f.ret2,
      saida: f.saida,
      comentario: f.comentario ?? '',
      status: f.status,
      editable: f.editable,
    };
  });
}

export function Home() {
  const { status, busy, wrap } = useBeefor();
  const ready = status === 'connected';

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rows, setRows] = useState<RowState[]>(() => buildEmpty(year, month));

  const [currentMood, setCurrentMood] = useState<Mood | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loadingTs, setLoadingTs] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const fetchInFlight = useRef(false);
  const lastFetchKey = useRef<string>('');

  useEffect(() => {
    void window.beefor.getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const key = `${year}-${month}`;
    if (lastFetchKey.current === key) return; // already loaded this month
    lastFetchKey.current = key;
    void refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, year, month]);

  const showToast = (t: Toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 3500);
  };

  const refreshTimesheet = async () => {
    if (fetchInFlight.current) return;
    fetchInFlight.current = true;
    setLoadingTs(true);
    try {
      const res = await window.beefor.fetchTimesheet(year, month);
      if (res.ok && res.data) {
        setRows(mergeFetched(year, month, res.data));
      } else if (!res.ok) {
        showToast({ kind: 'err', msg: `Carregar timesheet: ${res.error ?? 'falhou'}` });
      }
    } finally {
      setLoadingTs(false);
      fetchInFlight.current = false;
    }
  };

  const refreshMood = async () => {
    const res = await window.beefor.getCurrentMood();
    if (res.ok) {
      const m = res.data ?? null;
      const matched = (MOODS as readonly string[]).includes(m ?? '')
        ? (m as Mood)
        : null;
      setCurrentMood(matched);
    }
  };

  const refreshAll = async () => {
    await Promise.all([refreshTimesheet(), refreshMood()]);
  };

  const updateRow = (idx: number, patch: Partial<RowState>) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const lancar = async (idx: number) => {
    const r = rows[idx];
    updateRow(idx, { saving: true, saved: false, failed: false, errMsg: undefined });
    await wrap(async () => {
      const res = await window.beefor.lancarHora({
        date: r.date,
        entrada: r.entrada,
        int1: r.int1,
        ret1: r.ret1,
        int2: r.int2,
        ret2: r.ret2,
        saida: r.saida,
        comentario: r.comentario || undefined,
      });
      updateRow(idx, {
        saving: false,
        saved: res.ok,
        failed: !res.ok,
        errMsg: res.error,
      });
      showToast(
        res.ok
          ? { kind: 'ok', msg: `${r.date.slice(8, 10)}/${r.date.slice(5, 7)}: salvo` }
          : { kind: 'err', msg: `${r.date}: ${res.error ?? 'falhou'}` },
      );
    });
  };

  const lancarMes = async () => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.editable) continue;
      const hasAny = !!(r.entrada || r.int1 || r.ret1 || r.int2 || r.ret2 || r.saida);
      if (!hasAny) continue;
      // skip if already matches what server has? simple approach — always send
      await lancar(i);
    }
  };

  const autoLancamento = async () => {
    await wrap(async () => {
      const res = await window.beefor.autoLancamento();
      showToast(
        res.ok
          ? { kind: 'ok', msg: 'Auto lançamento: sucesso' }
          : { kind: 'err', msg: `Auto lançamento: ${res.error ?? 'falhou'}` },
      );
      if (res.ok) await refreshTimesheet();
    });
  };

  const selectMood = async (m: Mood) => {
    if (currentMood === m) return;
    const previous = currentMood;
    setCurrentMood(m);
    const res = await window.beefor.selectMood(m);
    if (!res.ok) {
      setCurrentMood(previous);
      showToast({ kind: 'err', msg: `Mood: ${res.error ?? 'falhou'}` });
    } else {
      showToast({ kind: 'ok', msg: `Mood: ${m}` });
    }
  };

  // Totals
  const hoursPerDayMin = (settings?.hoursPerDay ?? 8) * 60;
  const hourRate = settings?.hourRate ?? 0;

  const summary = useMemo(() => {
    let workedTotal = 0;
    let diffTotal = 0;
    let filled = 0;
    for (const r of rows) {
      const w = workedMinutes(r);
      if (w > 0) {
        workedTotal += w;
        filled++;
      }
      if (r.editable) {
        diffTotal += w - hoursPerDayMin * (w > 0 ? 1 : 0);
      }
    }
    const salary = (workedTotal / 60) * hourRate;
    return { workedTotal, diffTotal, filled, salary };
  }, [rows, hoursPerDayMin, hourRate]);

  const today = todayIso();
  const yearOptions = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  const filledForBatch = rows.filter(
    (r) => r.editable && (r.entrada || r.int1 || r.ret1 || r.int2 || r.ret2 || r.saida),
  ).length;

  return (
    <div className="page-stack">
      {/* Top: actions + mood */}
      <div className="grid cols-2">
        <div className="card">
          <h2>Ações no Beefor</h2>
          <div className="action-list">
            <button
              className="action-card primary-action"
              disabled={busy || !ready}
              onClick={autoLancamento}
            >
              <div className="action-icon">⚡</div>
              <div className="action-text">
                <div className="action-title">Auto lançamento</div>
                <div className="action-desc">Aciona o botão "Auto lançamento" do Beefor</div>
              </div>
            </button>

            <button
              className="action-card"
              onClick={async () => {
                const res = await window.beefor.openBeefor();
                if (!res.ok) showToast({ kind: 'err', msg: res.error ?? 'falhou' });
              }}
            >
              <div className="action-icon">🌐</div>
              <div className="action-text">
                <div className="action-title">Abrir Beefor no navegador</div>
                <div className="action-desc">Para conferência manual</div>
              </div>
            </button>

            <button
              className="action-card"
              disabled={busy || !ready || loadingTs}
              onClick={() => void refreshAll()}
            >
              <div className="action-icon">🔄</div>
              <div className="action-text">
                <div className="action-title">Recarregar dados</div>
                <div className="action-desc">Lê do Beefor o mês atual + mood</div>
              </div>
            </button>
          </div>
        </div>

        <div className="card">
          <h2>Mood do dia</h2>
          <p className="card-hint">
            {currentMood
              ? `Atualmente: ${currentMood}`
              : ready
              ? 'Nenhum mood marcado hoje.'
              : 'Conectando…'}
          </p>
          <MoodPicker
            current={currentMood}
            disabled={busy || !ready}
            onSelect={selectMood}
          />
        </div>
      </div>

      {/* Timesheet */}
      <div className="card ts-toolbar">
        <div className="ts-filters">
          <div className="field-inline">
            <label className="label">Ano</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="field-inline">
            <label className="label">Mês</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS_PT.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="ts-actions">
          <span className="ts-summary">
            {loadingTs ? 'Carregando…' : `${filledForBatch} dia(s) preenchido(s)`}
          </span>
          <button
            className="secondary"
            disabled={busy || !ready || loadingTs}
            onClick={() => void refreshTimesheet()}
          >
            Recarregar
          </button>
          <button
            disabled={busy || !ready || filledForBatch === 0}
            onClick={lancarMes}
          >
            Lançar mês inteiro
          </button>
        </div>
      </div>

      <div className="card ts-table-card">
        <div className="ts-table">
          <div className="ts-row ts-head">
            <div className="ts-col-date">Data</div>
            {FIELDS.map((f) => (
              <div className="ts-col-time" key={f.key}>
                {f.label}
              </div>
            ))}
            <div className="ts-col-num">Total</div>
            <div className="ts-col-num">Diff</div>
            <div className="ts-col-cmt">Comentário</div>
            <div className="ts-col-act">Ação</div>
          </div>

          {rows.map((r, i) => {
            const isWeekend = r.weekday === 0 || r.weekday === 6;
            const isToday = r.date === today;
            const worked = workedMinutes(r);
            const expected = r.editable ? hoursPerDayMin : 0;
            const diff = worked > 0 ? worked - expected : 0;
            const totalLabel = worked > 0 ? formatMinutes(worked) : '—';
            const diffLabel = worked > 0 ? formatMinutes(diff, true) : '—';
            const diffClass =
              worked === 0
                ? ''
                : diff > 0
                ? 'diff-pos'
                : diff < 0
                ? 'diff-neg'
                : 'diff-zero';

            return (
              <div
                key={r.date}
                className={`ts-row ${isWeekend ? 'weekend' : ''} ${
                  isToday ? 'today' : ''
                } ${r.saved ? 'saved' : ''} ${r.failed ? 'failed' : ''} ${
                  !r.editable ? 'locked' : ''
                }`}
              >
                <div className="ts-col-date">
                  <strong>{pad2(Number(r.date.slice(8, 10)))}</strong>
                  <span className="ts-weekday">
                    {WEEKDAY_SHORT_PT[r.weekday]}
                    {r.status ? ` · ${r.status}` : ''}
                  </span>
                </div>
                {FIELDS.map((f) => (
                  <div className="ts-col-time" key={f.key}>
                    <input
                      type="time"
                      disabled={!r.editable}
                      value={(r as any)[f.key]}
                      onChange={(e) =>
                        updateRow(i, { [f.key]: e.target.value } as Partial<RowState>)
                      }
                    />
                  </div>
                ))}
                <div className="ts-col-num">{totalLabel}</div>
                <div className={`ts-col-num ${diffClass}`}>{diffLabel}</div>
                <div className="ts-col-cmt">
                  <input
                    type="text"
                    disabled={!r.editable}
                    placeholder="Comentário"
                    value={r.comentario ?? ''}
                    onChange={(e) => updateRow(i, { comentario: e.target.value })}
                  />
                </div>
                <div className="ts-col-act">
                  <button
                    disabled={busy || !ready || r.saving || !r.editable}
                    onClick={() => lancar(i)}
                    title={r.errMsg ?? ''}
                  >
                    {r.saving ? '…' : 'Lançar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="ts-footer">
          <div>
            <span className="label">Horas trabalhadas</span>
            <strong>{formatMinutes(summary.workedTotal)}</strong>
          </div>
          <div>
            <span className="label">Saldo</span>
            <strong className={summary.diffTotal >= 0 ? 'diff-pos' : 'diff-neg'}>
              {formatMinutes(summary.diffTotal, true)}
            </strong>
          </div>
          <div>
            <span className="label">Salário estimado</span>
            <strong>
              {summary.salary.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </strong>
          </div>
        </div>
      </div>

      {toast && <div className={`toast ${toast.kind}`}>{toast.msg}</div>}
    </div>
  );
}
