import { TIME_KEYS, type PersistedRowValues } from './shared';

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

export function extractDayPayload(payload: unknown): Record<string, unknown> | null {
  const root = asRecord(payload);
  if (!root) return null;
  if (Array.isArray(root.apontamentos)) return root;

  const diaApontamento = asRecord(root.diaApontamento);
  if (diaApontamento && Array.isArray(diaApontamento.apontamentos)) {
    return diaApontamento;
  }

  const stateMachine = asRecord(root.stateMachine);
  const stateDay = asRecord(stateMachine?.diaApontamento);
  if (stateDay && Array.isArray(stateDay.apontamentos)) {
    return stateDay;
  }

  return null;
}

export function extractSavedValues(payload: unknown): Partial<PersistedRowValues> | null {
  const day = extractDayPayload(payload);
  if (!day) return null;

  const out: Partial<PersistedRowValues> = {};
  if (typeof day.comentario === 'string') {
    out.comentario = day.comentario;
  }

  const apontamentos = Array.isArray(day.apontamentos) ? day.apontamentos : [];
  for (const raw of apontamentos) {
    const item = asRecord(raw);
    if (!item) continue;
    const index = typeof item?.index === 'number' ? item.index : -1;
    const key = TIME_KEYS[index];
    if (!key) continue;
    out[key] = typeof item.valor === 'string' ? item.valor : '';
  }

  return out;
}
