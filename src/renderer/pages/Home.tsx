import { useEffect, useMemo, useRef, useState } from 'react';
import { FunnyLoader } from '../components/FunnyLoader';
import type {
  AppSettings,
  FetchedTimesheetRow,
  Mood,
  TimesheetEntry,
} from '../../shared/types';
import { MOODS } from '../../shared/types';
import { useBeefor } from '../hooks/useBeefor';
import { MoodPicker } from '../components/MoodPicker';
import { MinimalView } from '../components/MinimalView';
import { StatusBadge } from '../components/StatusBadge';
import { Bolt, Calendar, Clock, Heart, Trophy } from '../components/Icons';
import {
  MONTHS_PT,
  WEEKDAY_SHORT_PT,
  daysInMonth,
  isoDate,
  todayIso,
  weekdayOf,
} from '../utils/dates';
import { formatMinutes, workedMinutes } from '../utils/timeMath';

interface Toast {
  kind: 'ok' | 'err';
  title?: string;
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

const FIELDS: Array<{
  key: keyof Omit<TimesheetEntry, 'date' | 'comentario'>;
  label: string;
}> = [
  { key: 'entrada', label: 'Entrada' },
  { key: 'int1', label: 'Int. 1' },
  { key: 'ret1', label: 'Ret. 1' },
  { key: 'int2', label: 'Int. 2' },
  { key: 'ret2', label: 'Ret. 2' },
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
    editable: true,
  };
}

function buildEmpty(year: number, month: number): RowState[] {
  const total = daysInMonth(year, month);
  const out: RowState[] = [];
  for (let d = 1; d <= total; d++) out.push(emptyRow(year, month, d));
  return out;
}

function mergeFetched(
  year: number,
  month: number,
  fetched: FetchedTimesheetRow[],
): RowState[] {
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
      editable: true,
    };
  });
}

interface HomeProps {
  onMoodChanged?: (mood: string | null) => void;
}

export function Home({ onMoodChanged }: HomeProps = {}) {
  const { status, busy, wrap } = useBeefor();
  const ready = status === 'connected';

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rows, setRows] = useState<RowState[]>(() => buildEmpty(year, month));

  const [currentMood, setCurrentMood] = useState<Mood | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loadingTs, setLoadingTs] = useState(false);
  const [timesheetLoaded, setTimesheetLoaded] = useState(false);
  const [loadingMood, setLoadingMood] = useState(false);
  const [moodLoaded, setMoodLoaded] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);

  const fetchInFlight = useRef(false);
  const lastFetchKey = useRef<string>('');

  useEffect(() => {
    void window.beefor.getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const key = `${year}-${month}`;
    if (lastFetchKey.current === key) return;
    lastFetchKey.current = key;
    setTimesheetLoaded(false);
    void (moodLoaded ? refreshTimesheet() : refreshAll());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, year, month, moodLoaded]);

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
        showToast({
          kind: 'err',
          title: 'Erro ao carregar',
          msg: `Apontamentos: ${res.error ?? 'falhou'}`,
        });
      }
    } finally {
      setLoadingTs(false);
      setTimesheetLoaded(true);
      fetchInFlight.current = false;
    }
  };

  const notifyMoodChanged = (mood: string | null) => {
    onMoodChanged?.(mood);
  };

  const refreshMood = async () => {
    setLoadingMood(true);
    try {
      const res = await window.beefor.getCurrentMood();
      if (res.ok) {
        const m = res.data ?? null;
        const matched = (MOODS as readonly string[]).includes(m ?? '')
          ? (m as Mood)
          : null;
        setCurrentMood(matched);
        notifyMoodChanged(matched);
      }
    } finally {
      setLoadingMood(false);
      setMoodLoaded(true);
    }
  };

  const refreshAll = async () => {
    await Promise.all([refreshTimesheet(), refreshMood()]);
  };

  useEffect(() => {
    if (!ready) return;
    const handleFocus = () => {
      void refreshMood();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refreshMood();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [ready, month, year]);

  useEffect(() => {
    const off = window.beefor.onNotify((info) => {
      if (info.title === 'sync:autoLancamento' && info.body === 'ok') {
        void refreshAll();
      }
    });
    return off;
  }, [year, month, ready]);

  const updateRow = (idx: number, patch: Partial<RowState>) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const lancar = async (idx: number, refreshAfter = false) => {
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
        comentario: r.comentario ?? '',
      });
      updateRow(idx, {
        saving: false,
        saved: res.ok,
        failed: !res.ok,
        errMsg: res.error,
      });
      showToast(
        res.ok
          ? {
              kind: 'ok',
              title: 'Horas salvas',
              msg: `${r.date.slice(8, 10)}/${r.date.slice(5, 7)} lançado no Beefor.`,
            }
          : {
              kind: 'err',
              title: 'Não foi possível salvar',
              msg: `${r.date}: ${res.error ?? 'falhou'}`,
            },
      );
      if (res.ok && refreshAfter) await refreshTimesheet();
    });
  };

  const confirmLancarMes = async () => {
    const pending = batchRows.map((item) => item.index);
    setShowBatchModal(false);
    for (const idx of pending) {
      await lancar(idx, false);
    }
    await refreshTimesheet();
  };

  const autoLancamento = async () => {
    await wrap(async () => {
      const res = await window.beefor.autoLancamento();
      showToast(
        res.ok
          ? {
              kind: 'ok',
              title: 'Auto lançamento concluído',
              msg: 'Os apontamentos automáticos foram enviados.',
            }
          : {
              kind: 'err',
              title: 'Auto lançamento falhou',
              msg: res.error ?? 'falhou',
            },
      );
      if (res.ok) await refreshTimesheet();
    });
  };

  const selectMood = async (m: Mood) => {
    if (currentMood === m) return;
    const previous = currentMood;
    setCurrentMood(m);
    await wrap(async () => {
      const res = await window.beefor.selectMood(m);
      if (!res.ok) {
        setCurrentMood(previous);
        notifyMoodChanged(previous);
        showToast({
          kind: 'err',
          title: 'Mood não salvo',
          msg: res.error ?? 'falhou',
        });
      } else {
        showToast({ kind: 'ok', title: 'Mood salvo', msg: m });
        notifyMoodChanged(m);
        void refreshMood();
      }
    });
  };

  const hoursPerDayMin = (settings?.hoursPerDay ?? 8) * 60;
  const hourRate = settings?.hourRate ?? 0;

  const summary = useMemo(() => {
    let workedTotal = 0;
    let saldoTotal = 0;
    let overtimeMin = 0;
    let expectedTotal = 0;
    let workedDays = 0;
    for (const r of rows) {
      const w = workedMinutes(r);
      if (w <= 0) continue;
      workedTotal += w;
      workedDays += 1;
      expectedTotal += hoursPerDayMin;
      const diff = w - hoursPerDayMin;
      saldoTotal += diff;
      if (diff > 0) overtimeMin += diff;
    }
    // Total estimado = horas normais trabalhadas × rate + valor das extras
    // = workedTotal × rate (pois workedTotal já inclui extras)
    // Valor extras baseado no saldo total positivo do mês (não soma dias individualmente)
    const netOvertimeMin = Math.max(0, saldoTotal);
    const overtimeValue = (netOvertimeMin / 60) * hourRate;
    const totalSalary = (workedTotal / 60) * hourRate;
    return {
      workedTotal,
      expectedTotal,
      saldoTotal,
      overtimeMin,
      overtimeValue,
      totalSalary,
      workedDays,
    };
  }, [rows, hoursPerDayMin, hourRate]);

  const today = todayIso();
  const yearOptions = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  const batchRows = useMemo(
    () =>
      rows
        .map((row, index) => ({ row, index, worked: workedMinutes(row) }))
        .filter(
          ({ row }) =>
            row.editable &&
            !!(
              row.entrada ||
              row.int1 ||
              row.ret1 ||
              row.int2 ||
              row.ret2 ||
              row.saida ||
              row.comentario
            ),
        ),
    [rows],
  );
  const autoLoginOnLaunch = settings?.autoLoginOnLaunch ?? true;
  const isBooting =
    status === 'loading' ||
    status === 'reconnecting' ||
    (status === 'idle' && autoLoginOnLaunch);
  const showMoodLoader = isBooting || (loadingMood && !moodLoaded) || (ready && !moodLoaded);
  const showTimesheetLoader =
    isBooting || (loadingTs && !timesheetLoaded) || (ready && !timesheetLoaded);
  const showDisconnectedState = !ready && !isBooting;

  return (
    <div className="home-layout">
      <section className="home-topbar">
        <div>
          <p className="eyebrow">Beefor Dev</p>
          <h1>Lançamento de horas</h1>
        </div>
        <div className="home-status">
          <StatusBadge status={status} />
          <button
            className="secondary compact"
            disabled={busy || !ready || loadingTs || loadingMood}
            onClick={() => void refreshAll()}
          >
            Recarregar
          </button>
          <button
            className="secondary compact"
            onClick={async () => {
              const res = await window.beefor.openBeefor();
              if (!res.ok) {
                showToast({
                  kind: 'err',
                  title: 'Não abriu o Beefor',
                  msg: res.error ?? 'falhou',
                });
              }
            }}
          >
            Abrir Beefor
          </button>
          <button
            className="secondary compact"
            onClick={() =>
                showToast({
                  kind: 'ok',
                  title: 'KudoCard',
                  msg: 'Botao pronto. Integracao do envio entra na proxima etapa.',
                })
              }
          >
            Enviar KudoCard
          </button>
        </div>
      </section>

      <section className="home-commandbar">
        <div className="mood-panel">
          <div>
            <span className="label">Mood do dia</span>
            <strong>{currentMood ?? 'Não identificado'}</strong>
          </div>
          {showMoodLoader ? (
            <FunnyLoader title="Buscando mood" />
          ) : (
            <MoodPicker current={currentMood} disabled={busy || !ready} onSelect={selectMood} />
          )}
        </div>
      </section>

      <section className="timesheet-panel">
        <div className="ts-toolbar">
          <div className="ts-filters">
            <label className="field-inline">
              <span className="label">Ano</span>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-inline">
              <span className="label">Mês</span>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {MONTHS_PT.map((name, i) => (
                  <option key={name} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="ts-actions">
            <button
              className="warm"
              disabled={busy || !ready}
              onClick={autoLancamento}
            >
              Auto lançamento
            </button>
            <button
              className="secondary"
              disabled
              title="Em breve"
            >
              Lançar mês
            </button>
          </div>
        </div>

        <div className={`summary-strip ${settings?.viewMode === 'minimal' ? 'compact' : ''}`}>
          <div className="summary-card">
            <span className="summary-label"><Clock size={14} /> Horas trabalhadas</span>
            <strong className="summary-value">{formatMinutes(summary.workedTotal)}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label"><Calendar size={14} /> Horas previstas</span>
            <strong className="summary-value">{formatMinutes(summary.expectedTotal)}</strong>
          </div>
          <div className={`summary-card ${summary.saldoTotal >= 0 ? 'pos' : 'neg'}`}>
            <span className="summary-label"><Bolt size={14} /> Saldo do mês</span>
            <strong className="summary-value">
              {formatMinutes(summary.saldoTotal, true)}
            </strong>
          </div>
          <div className="summary-card">
            <span className="summary-label"><Bolt size={14} /> Dias trabalhados</span>
            <strong className="summary-value">{summary.workedDays}d</strong>
          </div>
          <div className={`summary-card ${summary.overtimeMin > 0 ? 'pos' : ''}`}>
            <span className="summary-label"><Trophy size={14} /> Valor extras</span>
            <strong className="summary-value">
              {summary.overtimeValue.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </strong>
          </div>
          <div className="summary-card">
            <span className="summary-label"><Heart size={14} /> Total estimado</span>
            <strong className="summary-value">
              {summary.totalSalary.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </strong>
          </div>
        </div>

        {showTimesheetLoader ? (
          <FunnyLoader title="Carregando lançamentos" />
        ) : showDisconnectedState ? (
          <div className="ts-empty">
            <strong>Sem sessão ativa</strong>
            <span>Conecte a sessão para carregar os apontamentos do mês.</span>
          </div>
        ) : settings?.viewMode === 'minimal' ? (
          <MinimalView
            rows={rows}
            year={year}
            month={month}
            busy={busy}
            ready={ready}
            hoursPerDayMin={hoursPerDayMin}
            showDiff={settings?.calendarShowDiff ?? false}
            onUpdateRow={updateRow}
            onLancar={(idx) => void lancar(idx)}
          />
        ) : (
          <div className="ts-grid" role="table">
            <div className="ts-grid-head" role="row">
              <span>Data</span>
              {FIELDS.map((f) => (
                <span key={f.key}>{f.label}</span>
              ))}
              <span>Total</span>
              <span>Saldo</span>
              <span>Status</span>
              <span>Comentário</span>
              <span>Ação</span>
            </div>

            {rows.map((r, i) => {
              const isWeekend = r.weekday === 0 || r.weekday === 6;
              const isHoliday = (r.status ?? '').toLowerCase().includes('feriado');
              const isToday = r.date === today;
              const worked = workedMinutes(r);
              const expected = hoursPerDayMin;
              const diff = worked > 0 ? worked - expected : 0;
              const totalLabel = worked > 0 ? formatMinutes(worked) : '00:00';
              const diffLabel = worked > 0 ? formatMinutes(diff, true) : '00:00';
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
                  className={`ts-grid-row ${isWeekend ? 'weekend' : ''} ${
                    isHoliday ? 'holiday' : ''
                  } ${
                    isToday ? 'today' : ''
                  } ${r.saved ? 'saved' : ''} ${r.failed ? 'failed' : ''}`}
                  key={r.date}
                  role="row"
                >
                  <div className="date-cell">
                    <strong>{r.date.slice(8, 10)}/{r.date.slice(5, 7)}</strong>
                    <span>{WEEKDAY_SHORT_PT[r.weekday]}</span>
                  </div>
                  {FIELDS.map((f) => (
                    <label className="time-cell" key={f.key}>
                      <span className="mobile-label">{f.label}</span>
                      <input
                        type="time"
                        disabled={false}
                        value={r[f.key]}
                        aria-label={`${f.label} ${r.date}`}
                        onChange={(e) =>
                          updateRow(i, { [f.key]: e.target.value } as Partial<RowState>)
                        }
                      />
                    </label>
                  ))}
                  <div className="metric-cell">
                    <span className="mobile-label">Total</span>
                    <strong className="mono">{totalLabel}</strong>
                  </div>
                  <div className="metric-cell">
                    <span className="mobile-label">Saldo</span>
                    <strong className={`mono ${diffClass}`}>{diffLabel}</strong>
                  </div>
                  <div className="status-cell">
                    <span className="mobile-label">Status</span>
                    {r.status || (isToday ? 'Hoje' : '-')}
                  </div>
                  <label className="comment-cell">
                    <span className="mobile-label">Comentário</span>
                    <input
                      type="text"
                      disabled={false}
                      placeholder="Observação"
                      value={r.comentario ?? ''}
                      onChange={(e) => updateRow(i, { comentario: e.target.value })}
                    />
                  </label>
                  <div className="row-action">
                    <span className="mobile-label">Ação</span>
                    <button
                      disabled={busy || !ready || r.saving}
                      onClick={() => lancar(i)}
                      title={r.errMsg ?? ''}
                    >
                      {r.saving ? 'Salvando' : 'Lançar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showBatchModal && (
        <div className="modal-backdrop" role="presentation">
          <section
            aria-labelledby="batch-modal-title"
            aria-modal="true"
            className="modal-card"
            role="dialog"
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">Confirmação</p>
                <h2 id="batch-modal-title">Lançar mês</h2>
              </div>
              <button
                className="secondary compact"
                onClick={() => setShowBatchModal(false)}
              >
                Fechar
              </button>
            </div>
            <p className="modal-copy">
              O app vai lançar {batchRows.length} dia(s) preenchido(s) em{' '}
              {MONTHS_PT[month - 1]} de {year}. Confira antes de confirmar.
            </p>
            <div className="batch-preview">
              {batchRows.map(({ row, worked }) => {
                const filled = FIELDS.map((f) => ({
                  label: f.label,
                  value: row[f.key],
                })).filter((f) => f.value);
                return (
                  <div className="batch-preview-row" key={row.date}>
                    <strong>
                      {row.date.slice(8, 10)}/{row.date.slice(5, 7)}
                    </strong>
                    <span>{filled.map((f) => `${f.label}: ${f.value}`).join(' · ') || 'Sem horários'}</span>
                    <span>Total: {worked > 0 ? formatMinutes(worked) : '00:00'}</span>
                    {row.comentario && <span>Comentário: {row.comentario}</span>}
                  </div>
                );
              })}
            </div>
            <div className="modal-actions">
              <button className="secondary" onClick={() => setShowBatchModal(false)}>
                Cancelar
              </button>
              <button className="warm" disabled={busy} onClick={confirmLancarMes}>
                Confirmar lançamento
              </button>
            </div>
          </section>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.kind}`} role={toast.kind === 'err' ? 'alert' : 'status'}>
          <span className="toast__icon" aria-hidden="true">
            {toast.kind === 'ok' ? '✓' : '!'}
          </span>
          <span className="toast__body">
            <strong>{toast.title ?? (toast.kind === 'ok' ? 'Tudo certo' : 'Atenção')}</strong>
            <span>{toast.msg}</span>
          </span>
        </div>
      )}
    </div>
  );
}
