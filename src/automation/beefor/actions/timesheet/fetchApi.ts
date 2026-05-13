import type { Page } from 'playwright';
import { BEEFOR_TIMESHEET_API } from '../../../../shared/constants';
import { ensureBeeforOrigin } from '../../internals/beeforApi';
import { cacheMonthPayload } from '../../internals/timesheetCache';
import { TIME_KEYS, type FetchedRow } from './shared';
import { asRecord } from './payloadParse';

async function fetchMonthPayloadViaApi(page: Page, year: number, month: number): Promise<any> {
  await ensureBeeforOrigin(page);
  const payload = await page.evaluate(
    async ({ year, month, endpoint }) => {
      const storage = (globalThis as any).localStorage;
      const user = JSON.parse(storage.getItem('user1') || '{}');
      if (!user?.token) {
        throw new Error('Token do Beefor não encontrado no localStorage.');
      }
      const response = await fetch(`${endpoint}/${year}/${month}`, {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${user.token}`,
        },
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`GET apontamento ${response.status}: ${text.slice(0, 300)}`);
      }
      return JSON.parse(text);
    },
    { year, month, endpoint: BEEFOR_TIMESHEET_API },
  );
  cacheMonthPayload(year, month, payload);
  return payload;
}

function parseFetchedRowsFromApi(payload: unknown): FetchedRow[] {
  const root = asRecord(payload);
  const days = Array.isArray(root?.diasLancamento) ? root.diasLancamento : [];
  const rows: FetchedRow[] = [];

  for (const rawDay of days) {
    const day = asRecord(rawDay);
    if (!day) continue;
    const dia = Number(day.dia);
    const mes = Number(day.mes);
    const ano = Number(day.ano);
    if (!dia || !mes || !ano) continue;

    const apontamentos = Array.isArray(day.apontamentos) ? day.apontamentos : [];
    const vals = TIME_KEYS.map((_, index) => {
      const item =
        apontamentos.map(asRecord).find((ap) => ap?.index === index) ??
        asRecord(apontamentos[index]);
      return typeof item?.valor === 'string' ? item.valor : '';
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
          ? day.totalFormatado.replace(/[^\d:]/g, '') || '00:00'
          : '00:00',
      comentario: typeof day.comentario === 'string' ? day.comentario : '',
      status:
        typeof day.situacaoFormatada === 'string'
          ? day.situacaoFormatada
          : day.feriado
            ? 'Feriado'
            : '',
      editable: true,
    });
  }

  return rows;
}

export async function doFetchTimesheetViaApi(
  page: Page,
  year: number,
  month: number,
): Promise<FetchedRow[]> {
  const payload = await fetchMonthPayloadViaApi(page, year, month);
  return parseFetchedRowsFromApi(payload);
}
