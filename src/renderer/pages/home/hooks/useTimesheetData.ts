import { useCallback, useEffect, useRef, useState } from 'react';
import type { FetchedTimesheetRow } from '@shared/types/index';
import type { SystemClient } from '../../../services/ipc/system.client';
import type { TimesheetClient } from '../../../services/ipc/timesheet.client';
import { buildEmpty, mergeFetched, type RowState } from '../utils/rowState';

interface UseTimesheetDataOptions {
  ready: boolean;
  year: number;
  month: number;
  moodLoaded: boolean;
  timesheetClient: TimesheetClient;
  systemClient: SystemClient;
  refreshMood: () => Promise<void>;
  showToast: (toast: { kind: 'ok' | 'err'; title?: string; msg: string }) => void;
}

export function useTimesheetData({
  ready,
  year,
  month,
  moodLoaded,
  timesheetClient,
  systemClient,
  refreshMood,
  showToast,
}: UseTimesheetDataOptions) {
  const [rows, setRows] = useState<RowState[]>(() => buildEmpty(year, month));
  const [loadingTs, setLoadingTs] = useState(false);
  const [timesheetLoaded, setTimesheetLoaded] = useState(false);
  const fetchInFlight = useRef(false);
  const lastFetchKey = useRef('');
  const yearRef = useRef(year);
  const monthRef = useRef(month);

  useEffect(() => {
    yearRef.current = year;
  }, [year]);

  useEffect(() => {
    monthRef.current = month;
  }, [month]);

  const refreshTimesheet = useCallback(async () => {
    if (fetchInFlight.current) return;
    fetchInFlight.current = true;
    setLoadingTs(true);
    try {
      const res = await timesheetClient.fetch(year, month);
      if (res.ok && res.data) {
        setRows(mergeFetched(year, month, res.data as FetchedTimesheetRow[]));
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
  }, [month, showToast, timesheetClient, year]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshTimesheet(), refreshMood()]);
  }, [refreshMood, refreshTimesheet]);

  useEffect(() => {
    if (!ready) return;
    const key = `${year}-${month}`;
    if (lastFetchKey.current === key) return;
    lastFetchKey.current = key;
    setTimesheetLoaded(false);
    void (moodLoaded ? refreshTimesheet() : refreshAll());
  }, [month, moodLoaded, ready, refreshAll, refreshTimesheet, year]);

  useEffect(() => {
    const off = systemClient.onNotify((info) => {
      if (info.title === 'sync:autoLancamento' && info.body === 'ok') {
        const y = yearRef.current;
        const m = monthRef.current;
        lastFetchKey.current = '';
        void timesheetClient.fetch(y, m).then((res) => {
          if (res.ok && res.data) {
            setRows(mergeFetched(y, m, res.data as FetchedTimesheetRow[]));
            setTimesheetLoaded(true);
          }
        });
      }
      if (info.title === 'sync:autoLancamento' && info.body === 'failed') {
        void refreshMood();
      }
    });
    return off;
  }, [refreshMood, systemClient, timesheetClient]);

  return {
    rows,
    setRows,
    loadingTs,
    timesheetLoaded,
    refreshTimesheet,
    refreshAll,
  };
}
