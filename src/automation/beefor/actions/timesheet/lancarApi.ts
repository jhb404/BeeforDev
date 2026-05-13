import type { Page } from 'playwright';
import type { TimesheetEntry } from '../../../../shared/types';
import { ensureBeeforOrigin } from '../../internals/beeforApi';
import {
  cacheMonthPayload,
  getCachedDayPayload,
  replaceCachedDayPayload,
} from '../../internals/timesheetCache';
import {
  TIME_KEYS,
  normalizeTimeForCompare,
  type TimeKey,
} from './shared';
import { asRecord, extractDayPayload, extractSavedValues } from './payloadParse';

export async function doLancarHoraViaApi(
  page: Page,
  entry: TimesheetEntry,
): Promise<void> {
  const [y, m, d] = entry.date.split('-').map(Number);
  if (!y || !m || !d) throw new Error(`Data inválida: ${entry.date}`);

  await ensureBeeforOrigin(page);

  const cachedRow = getCachedDayPayload(y, m, d);
  const apiResult = await page.evaluate(
    async ({ year, month, day, values, comentario, cachedRow }) => {
      const endpoint =
        'https://apiteams.goobee.com.br/timesheet-beefor/api/apontamento';
      const storage = (globalThis as any).localStorage;
      const user = JSON.parse(storage.getItem('user1') || '{}');
      if (!user?.token) {
        throw new Error('Token do Beefor não encontrado no localStorage.');
      }
      const authHeaders = {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${user.token}`,
      };
      let monthData = null;
      let row = cachedRow ? JSON.parse(JSON.stringify(cachedRow)) : null;
      if (!row) {
        const monthResponse = await fetch(`${endpoint}/${year}/${month}`, {
          headers: authHeaders,
        });
        const monthText = await monthResponse.text();
        if (!monthResponse.ok) {
          throw new Error(`GET apontamento ${monthResponse.status}: ${monthText.slice(0, 300)}`);
        }

        monthData = JSON.parse(monthText);
        row = monthData?.diasLancamento?.find(
          (item: any) => item?.dia === day && item?.mes === month && item?.ano === year,
        );
      }
      if (!row) throw new Error(`Dia ${day}/${month}/${year} não encontrado no apontamento.`);
      if (!Array.isArray(row.apontamentos) || row.apontamentos.length < 6) {
        throw new Error('Payload do Beefor sem os 6 apontamentos esperados.');
      }

      const keys = ['entrada', 'int1', 'ret1', 'int2', 'ret2', 'saida'] as const;
      keys.forEach((key, index) => {
        const apontamento =
          row.apontamentos.find((item: any) => item?.index === index) ??
          row.apontamentos[index];
        if (!apontamento) return;
        const next = values[key] || null;
        if ((apontamento.valor ?? null) !== next) {
          apontamento.valor = next;
          apontamento.manual = !!next;
        }
      });

      if (comentario !== undefined) {
        row.comentario = comentario;
      }

      const saveResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { ...authHeaders, 'content-type': 'application/json' },
        body: JSON.stringify(row),
      });
      const saveText = await saveResponse.text();
      if (!saveResponse.ok) {
        throw new Error(`POST apontamento ${saveResponse.status}: ${saveText.slice(0, 300)}`);
      }
      const saved = JSON.parse(saveText);
      let commentSaved = null;
      if (comentario !== undefined) {
        const commentPayload = { ...saved, comentario };
        const commentResponse = await fetch(`${endpoint}/comentario`, {
          method: 'POST',
          headers: { ...authHeaders, 'content-type': 'application/json' },
          body: JSON.stringify(commentPayload),
        });
        const commentText = await commentResponse.text();
        if (!commentResponse.ok) {
          throw new Error(
            `POST apontamento/comentario ${commentResponse.status}: ${commentText.slice(0, 300)}`,
          );
        }
        if (commentText) {
          try {
            commentSaved = JSON.parse(commentText);
          } catch {
            commentSaved = commentText;
          }
        }
      }

      return { saved, commentSaved, monthData };
    },
    {
      year: y,
      month: m,
      day: d,
      values: {
        entrada: entry.entrada,
        int1: entry.int1,
        ret1: entry.ret1,
        int2: entry.int2,
        ret2: entry.ret2,
        saida: entry.saida,
      },
      comentario: entry.comentario,
      cachedRow,
    },
  );
  if (apiResult.monthData) cacheMonthPayload(y, m, apiResult.monthData);
  const savedDay =
    extractDayPayload(apiResult.commentSaved) ??
    extractDayPayload(apiResult.saved) ??
    asRecord(apiResult.saved);
  const persisted = extractSavedValues(savedDay ?? apiResult.saved);
  const expected: Record<TimeKey, string> = {
    entrada: entry.entrada,
    int1: entry.int1,
    ret1: entry.ret1,
    int2: entry.int2,
    ret2: entry.ret2,
    saida: entry.saida,
  };
  const mismatches: string[] = TIME_KEYS.filter(
    (key) => normalizeTimeForCompare(persisted?.[key]) !== normalizeTimeForCompare(expected[key]),
  );
  if (
    entry.comentario !== undefined &&
    (persisted?.comentario ?? '').trim() !== entry.comentario.trim()
  ) {
    mismatches.push('comentario');
  }

  if (mismatches.length) {
    throw new Error(`API rápida não confirmou ${mismatches.join(', ')}.`);
  }

  replaceCachedDayPayload(y, m, d, savedDay ?? apiResult.saved);
}
