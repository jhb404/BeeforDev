import type {
  ActionResult,
  FetchedTimesheetRow,
  TimesheetEntry,
  TimeStr,
} from '@shared/types/index';
import type { BeeforApi, BeeforHttpApi } from '../../../main/preload';

const TIME_KEYS = ['entrada', 'int1', 'ret1', 'int2', 'ret2', 'saida'] as const;

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function parseRowsFromApiPayload(payload: unknown): FetchedTimesheetRow[] {
  const root = asRecord(payload);
  const days = Array.isArray(root?.diasLancamento) ? (root!.diasLancamento as unknown[]) : [];
  const rows: FetchedTimesheetRow[] = [];

  for (const rawDay of days) {
    const day = asRecord(rawDay);
    if (!day) continue;
    const dia = Number(day.dia);
    const mes = Number(day.mes);
    const ano = Number(day.ano);
    if (!dia || !mes || !ano) continue;

    const apontamentos = Array.isArray(day.apontamentos)
      ? (day.apontamentos as unknown[])
      : [];
    const vals = TIME_KEYS.map((_, index) => {
      const arr = apontamentos.map(asRecord);
      const item = arr.find((ap) => Number(ap?.index) === index) ?? arr[index] ?? null;
      const valor = item?.valor;
      return typeof valor === 'string' ? (valor as TimeStr) : ('' as TimeStr);
    });

    rows.push({
      date: `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
      entrada: vals[0],
      int1: vals[1],
      ret1: vals[2],
      int2: vals[3],
      ret2: vals[4],
      saida: vals[5],
      total:
        typeof day.totalFormatado === 'string'
          ? (day.totalFormatado as string).replace(/[^\d:]/g, '') || '00:00'
          : '00:00',
      comentario: typeof day.comentario === 'string' ? (day.comentario as string) : '',
      status:
        typeof day.situacaoFormatada === 'string'
          ? (day.situacaoFormatada as string)
          : day.feriado
            ? 'Feriado'
            : '',
      editable: true,
    });
  }

  return rows;
}

function requireHttp(http?: BeeforHttpApi): BeeforHttpApi {
  if (!http) throw new Error('API HTTP indisponível — reinicie o app.');
  return http;
}

export function createTimesheetClient(api: BeeforApi, http?: BeeforHttpApi) {
  return {
    autoLancamento: async (): Promise<ActionResult> => {
      return requireHttp(http).timesheet.auto();
    },
    lancarHora: async (entry: TimesheetEntry): Promise<ActionResult> => {
      // Usa handler ACTION_LANCAR_HORA — faz GET-merge-POST do dia completo no main.
      return api.lancarHora(entry);
    },
    fetch: async (year: number, month: number): Promise<ActionResult<FetchedTimesheetRow[]>> => {
      const res = await requireHttp(http).timesheet.month(year, month);
      if (!res.ok) return res as ActionResult<FetchedTimesheetRow[]>;
      const rows = res.data ? parseRowsFromApiPayload(res.data) : [];
      return { ok: true as const, data: rows } as ActionResult<FetchedTimesheetRow[]>;
    },
    // openBeefor abre URL externa no browser do SO — não é Playwright, mantém via api.
    openBeefor: (): Promise<ActionResult> => api.openBeefor(),
  };
}

export const timesheetClient = createTimesheetClient(
  window.beefor,
  typeof window !== 'undefined' ? window.beeforHttp : undefined,
);
export type TimesheetClient = ReturnType<typeof createTimesheetClient>;
