import { getBeeforTimesheetApiBase } from '../../shared/constants';
import { getValidSession, BeeforApiError } from './beeforHttpClient';
import { logger } from '../logger';

// Electron undici tem keep-alive nativo — sem node:http Agent (corrompe request).
async function tsFetch(url: string, init: RequestInit): Promise<Response> {
  return fetch(url, init);
}

export interface ApontamentoDia {
  id?: string;
  dia: number;
  mes: number;
  ano: number;
  apontamentos: Array<{ index: number; valor: string }>;
  comentario?: string;
}

export interface ApontamentoMonthPayload {
  diasLancamento: ApontamentoDia[];
  [key: string]: unknown;
}

export interface TotaisMes {
  totalEsperado?: string;
  totalLancado?: string;
  diferenca?: string;
  [key: string]: unknown;
}

async function tsRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
  retry = true,
): Promise<T> {
  const session = await getValidSession();
  const base = getBeeforTimesheetApiBase();
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

  const init: RequestInit = {
    method,
    headers: {
      accept: 'application/json, text/plain, */*',
      authorization: `Bearer ${session.token}`,
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  const response = await tsFetch(url, init);

  if (response.status === 401 && retry) {
    logger.warn(`Timesheet 401 ${method} ${url} — retrying after token refresh.`);
    const { clearCachedSession } = await import('./beeforHttpClient');
    clearCachedSession();
    return tsRequest<T>(method, path, body, false);
  }

  if (!response.ok) {
    const txt = await response.text().catch(() => '');
    throw new BeeforApiError(
      `${method} ${url} → ${response.status}: ${txt.slice(0, 300)}`,
      response.status,
      txt,
    );
  }

  const text = await response.text();
  if (!text) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export async function getMonthPayload(
  ano: number,
  mes: number,
): Promise<ApontamentoMonthPayload> {
  return tsRequest<ApontamentoMonthPayload>('GET', `/apontamento/${ano}/${mes}`);
}

/** POST cru do dia completo (caller deve passar o objeto inteiro do GET, mutado). */
export async function postApontamento(dia: unknown): Promise<unknown> {
  return tsRequest('POST', '/apontamento', dia);
}

const TIME_KEYS = ['entrada', 'int1', 'ret1', 'int2', 'ret2', 'saida'] as const;

export interface LancarHoraValores {
  date: string; // yyyy-mm-dd
  entrada: string;
  int1: string;
  ret1: string;
  int2: string;
  ret2: string;
  saida: string;
  comentario?: string;
}

/**
 * Salva dia replicando o front: GET mês → acha o dia (objeto COMPLETO) → muta valores → POST inteiro.
 * Server exige todos os campos do diaLancamento (situacao, saldo, abonado, etc), não só os apontamentos.
 */
export async function lancarHora(valores: LancarHoraValores): Promise<unknown> {
  const [ano, mes, dia] = valores.date.split('-').map(Number);
  if (!ano || !mes || !dia) throw new Error(`Data inválida: ${valores.date}`);

  const month = await getMonthPayload(ano, mes);
  const days = Array.isArray(month?.diasLancamento) ? month.diasLancamento : [];
  const row: any = days.find(
    (d: any) => Number(d?.dia) === dia && Number(d?.mes) === mes && Number(d?.ano) === ano,
  );
  if (!row) throw new Error(`Dia ${dia}/${mes}/${ano} não encontrado no apontamento.`);
  if (!Array.isArray(row.apontamentos) || row.apontamentos.length < 6) {
    throw new Error('Payload sem os 6 apontamentos esperados.');
  }

  const valuesByKey: Record<string, string> = {
    entrada: valores.entrada,
    int1: valores.int1,
    ret1: valores.ret1,
    int2: valores.int2,
    ret2: valores.ret2,
    saida: valores.saida,
  };

  TIME_KEYS.forEach((key, index) => {
    const ap =
      row.apontamentos.find((a: any) => Number(a?.index) === index) ?? row.apontamentos[index];
    if (!ap) return;
    const next = valuesByKey[key] || null;
    if ((ap.valor ?? null) !== next) {
      ap.valor = next;
      ap.manual = !!next;
    }
  });

  if (valores.comentario !== undefined) {
    row.comentario = valores.comentario;
  }

  // POST dia completo
  const saved = await tsRequest<any>('POST', '/apontamento', row);

  // Comentário separado (igual front)
  if (valores.comentario !== undefined && saved) {
    try {
      await tsRequest('POST', '/apontamento/comentario', {
        ...saved,
        comentario: valores.comentario,
      });
    } catch (err) {
      logger.warn(
        `Comentário falhou (apontamento salvo): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return saved;
}

export async function autoLancarApontamentos(): Promise<unknown> {
  return tsRequest('POST', '/apontamento/registar', null);
}

export async function comentarDia(dia: ApontamentoDia): Promise<unknown> {
  return tsRequest('POST', '/apontamento/comentario', dia);
}

export async function sumarizarApontamentos(apontamentos: unknown[]): Promise<unknown> {
  return tsRequest('POST', '/apontamento/sumarizar-apontamentos', apontamentos);
}

export async function getTotaisMes(ano: number, mes: number): Promise<TotaisMes> {
  return tsRequest<TotaisMes>('GET', `/totais/${mes}/${ano}`);
}

export async function getTotaisDif(ano: number, mes: number): Promise<TotaisMes> {
  return tsRequest<TotaisMes>('GET', `/totais/dif/${mes}/${ano}`);
}

export async function getSituacaoDia(id: string): Promise<unknown> {
  return tsRequest('GET', `/apontamento/situacao-dia/${encodeURIComponent(id)}`);
}

export async function getMovimentoDia(id: string): Promise<unknown> {
  return tsRequest('GET', `/apontamento/movimento-dia/${encodeURIComponent(id)}`);
}

export async function listarAnos(): Promise<number[]> {
  const data = await tsRequest<any>('GET', '/lancamento/anos');
  return Array.isArray(data) ? data.map((x) => Number(x)).filter((n) => !!n) : [];
}

export async function listarMeses(ano: number): Promise<number[]> {
  const data = await tsRequest<any>('GET', `/lancamento/meses/${ano}`);
  return Array.isArray(data) ? data.map((x) => Number(x)).filter((n) => !!n) : [];
}

export async function gruposDaPessoa(idPessoa: string): Promise<unknown[]> {
  const data = await tsRequest<any>('GET', `/grupo/${encodeURIComponent(idPessoa)}`);
  return Array.isArray(data) ? data : [];
}
