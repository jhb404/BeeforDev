import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppSettings, Mood } from '@shared/types/index';
import { moodClient, settingsClient, systemClient, timesheetClient } from '../services/ipc';
import { MOODS } from '@shared/types/index';
import { useBeefor } from '../hooks/useBeefor';
import { MinimalView } from './home/components/MinimalView';
import { KudoCardModal } from '../features/kudo/components/KudoCardModal';
import { KudoCardHistoryModal } from '../features/kudo/components/KudoCardHistoryModal';
import { FunnyLoader } from '../components/common/FunnyLoader';
import { todayIso } from '../utils/dates';
import { workedMinutes } from '../utils/timeMath';
import { playUiSound } from '../utils/alarm';
import { useEscapeToClose } from '../hooks/useEscapeToClose';
import { buildEmpty, mergeFetched, type RowState } from './home/utils/rowState';
import { useToast } from '../app/providers/ToastProvider';
import { MoodPanel } from './home/components/MoodPanel';
import { SummaryStrip } from './home/components/SummaryStrip';
import { TimesheetToolbar } from './home/components/TimesheetToolbar';
import { TimesheetGrid } from './home/components/TimesheetGrid';
import { BatchConfirmModal } from './home/components/BatchConfirmModal';
import { HomeTopbar } from './home/components/HomeTopbar';
import { AtividadesModal } from '../features/atividades/components/AtividadesModal';

interface HomeProps {
  onMoodChanged?: (mood: string | null) => void;
  onBootReady?: () => void;
  onStartLunchTimer?: () => void;
}

export function Home({ onMoodChanged, onBootReady, onStartLunchTimer }: HomeProps = {}) {
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
  const showToast = useToast();
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showKudoModal, setShowKudoModal] = useState(false);
  const [showKudoHistory, setShowKudoHistory] = useState(false);
  const [showAtividades, setShowAtividades] = useState(false);

  const fetchInFlight = useRef(false);
  const lastFetchKey = useRef<string>('');
  const yearRef = useRef(year);
  const monthRef = useRef(month);
  useEffect(() => {
    yearRef.current = year;
  }, [year]);
  useEffect(() => {
    monthRef.current = month;
  }, [month]);

  useEffect(() => {
    void settingsClient.get().then(setSettings);
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

  const refreshTimesheet = async () => {
    if (fetchInFlight.current) return;
    fetchInFlight.current = true;
    setLoadingTs(true);
    try {
      const res = await timesheetClient.fetch(year, month);
      if (res.ok && res.data) {
        setRows(mergeFetched(year, month, res.data));
      } else if (!res.ok) {
        showToast({
          kind: 'err',
          title: 'Erro ao carregar',
          msg: `Apontamentos: ${res.ok ? '' : res.error}`,
        });
      }
    } finally {
      setLoadingTs(false);
      setTimesheetLoaded(true);
      fetchInFlight.current = false;
    }
  };

  const notifyMoodChanged = (mood: string | null) => onMoodChanged?.(mood);

  const refreshMood = async () => {
    setLoadingMood(true);
    try {
      const res = await moodClient.getCurrent();
      if (res.ok) {
        const m = res.data ?? null;
        const matched = (MOODS as readonly string[]).includes(m ?? '') ? (m as Mood) : null;
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
    const handleFocus = () => void refreshMood();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refreshMood();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, month, year]);

  useEffect(() => {
    const off = systemClient.onNotify((info) => {
      if (info.title === 'sync:autoLancamento' && info.body === 'ok') {
        const y = yearRef.current;
        const m = monthRef.current;
        lastFetchKey.current = '';
        void timesheetClient.fetch(y, m).then((res) => {
          if (res.ok && res.data) {
            setRows(mergeFetched(y, m, res.data));
            setTimesheetLoaded(true);
          }
        });
      }
      if (info.title === 'sync:autoLancamento' && info.body === 'failed') {
        void refreshMood();
      }
    });
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const updateRow = (idx: number, patch: Partial<RowState>) => {
    setRows((prev) => {
      const next = prev.map((r, i) => (i === idx ? { ...r, ...patch } : r));
      // auto-start lunch timer when int1 (2nd punch) is set on today
      if ('int1' in patch && patch.int1 && !prev[idx]?.int1) {
        const row = prev[idx];
        if (row?.date === todayIso()) {
          onStartLunchTimer?.();
        }
      }
      return next;
    });
  };

  const lancar = async (idx: number, refreshAfter = false) => {
    const r = rows[idx];
    updateRow(idx, { saving: true, saved: false, failed: false, errMsg: undefined });
    await wrap(async () => {
      const res = await timesheetClient.lancarHora({
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
        errMsg: res.ok ? undefined : res.error,
      });
      if (settings?.uiSounds && res.ok) playUiSound('success');
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
              msg: `${r.date}: ${res.ok ? '' : res.error}`,
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

  useEscapeToClose(showBatchModal, () => setShowBatchModal(false));

  useEffect(() => {
    const handler = () => setShowKudoModal(true);
    window.addEventListener('beefor:open-kudo', handler);
    return () => window.removeEventListener('beefor:open-kudo', handler);
  }, []);

  const autoLancamento = async () => {
    await wrap(async () => {
      const res = await timesheetClient.autoLancamento();
      if (settings?.uiSounds && res.ok) playUiSound('auto-lancar-success');
      showToast(
        res.ok
          ? {
              kind: 'ok',
              title: 'Auto lançamento iniciado',
              msg: 'Processando... calendário atualiza quando concluir.',
            }
          : {
              kind: 'err',
              title: 'Auto lançamento falhou',
              msg: (res.ok ? '' : res.error) || 'falhou',
            },
      );
      if (res.ok) {
        const nowDate = new Date();
        setYear(nowDate.getFullYear());
        setMonth(nowDate.getMonth() + 1);
      }
    });
  };

  const selectMood = async (m: Mood) => {
    if (currentMood === m) return;
    const previous = currentMood;
    setCurrentMood(m);
    await wrap(async () => {
      const res = await moodClient.select(m);
      if (!res.ok) {
        setCurrentMood(previous);
        notifyMoodChanged(previous);
        showToast({
          kind: 'err',
          title: 'Mood não salvo',
          msg: (res.ok ? '' : res.error) || 'falhou',
        });
      } else {
        showToast({ kind: 'ok', title: 'Mood salvo', msg: m });
        notifyMoodChanged(m);
        void refreshMood();
      }
    });
  };

  const hoursPerDayMin = (settings?.hoursPerDay ?? 8) * 60;

  const summary = useMemo(() => {
    let workedTotal = 0;
    let saldoTotal = 0;
    let workedDays = 0;
    let bestDayMin = 0;
    for (const r of rows) {
      const w = workedMinutes(r);
      if (w <= 0) continue;
      workedTotal += w;
      workedDays += 1;
      const diff = w - hoursPerDayMin;
      saldoTotal += diff;
      if (w > bestDayMin) bestDayMin = w;
    }
    const avgDayMin = workedDays > 0 ? Math.round(workedTotal / workedDays) : 0;
    return { workedTotal, saldoTotal, workedDays, avgDayMin, bestDayMin };
  }, [rows, hoursPerDayMin]);

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
    status === 'loading' || status === 'reconnecting' || (status === 'idle' && autoLoginOnLaunch);
  const showMoodLoader = isBooting || (loadingMood && !moodLoaded) || (ready && !moodLoaded);
  const showTimesheetLoader =
    isBooting || (loadingTs && !timesheetLoaded) || (ready && !timesheetLoaded);
  const showDisconnectedState = !ready && !isBooting;
  const bootReady = showDisconnectedState || (ready && moodLoaded && timesheetLoaded);

  useEffect(() => {
    if (bootReady) onBootReady?.();
  }, [bootReady, onBootReady]);

  return (
    <div className="home-layout">
      <HomeTopbar
        status={status}
        busy={busy}
        loadingMood={loadingMood}
        loadingTs={loadingTs}
        ready={ready}
        onReload={() => void refreshAll()}
        onOpenBeefor={async () => {
          const res = await timesheetClient.openBeefor();
          if (!res.ok) {
            showToast({
              kind: 'err',
              title: 'Não abriu o Beefor',
              msg: (res.ok ? '' : res.error) || 'falhou',
            });
          }
        }}
        onOpenKudo={() => setShowKudoModal(true)}
        onOpenKudoHistory={() => setShowKudoHistory(true)}
        onOpenAtividades={() => setShowAtividades(true)}
      />

      <MoodPanel
        loading={showMoodLoader}
        currentMood={currentMood}
        busy={busy}
        ready={ready}
        onSelect={selectMood}
      />

      <section className="timesheet-panel">
        <TimesheetToolbar
          year={year}
          month={month}
          yearOptions={yearOptions}
          busy={busy}
          ready={ready}
          onYearChange={setYear}
          onMonthChange={setMonth}
          onAutoLancamento={() => void autoLancamento()}
        />

        <SummaryStrip summary={summary} compact={settings?.viewMode === 'minimal'} />

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
          <TimesheetGrid
            rows={rows}
            today={today}
            hoursPerDayMin={hoursPerDayMin}
            busy={busy}
            ready={ready}
            onUpdateRow={updateRow}
            onLancar={(idx) => void lancar(idx)}
          />
        )}
      </section>

      <BatchConfirmModal
        open={showBatchModal}
        busy={busy}
        month={month}
        year={year}
        batchRows={batchRows}
        onClose={() => setShowBatchModal(false)}
        onConfirm={() => void confirmLancarMes()}
      />

      <KudoCardModal
        open={showKudoModal}
        onClose={() => setShowKudoModal(false)}
        onSent={(msg) => showToast({ kind: 'ok', title: 'KudoCard enviado', msg })}
        onError={(msg) => showToast({ kind: 'err', title: 'Falha ao enviar KudoCard', msg })}
      />

      <KudoCardHistoryModal open={showKudoHistory} onClose={() => setShowKudoHistory(false)} />

      <AtividadesModal open={showAtividades} onClose={() => setShowAtividades(false)} />
    </div>
  );
}
