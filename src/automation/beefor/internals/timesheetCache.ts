const timesheetMonthCache = new Map<string, any>();

function monthCacheKey(year: number, month: number): string {
  return `${year}-${month}`;
}

export function cacheMonthPayload(
  year: number,
  month: number,
  payload: any,
): void {
  timesheetMonthCache.set(monthCacheKey(year, month), payload);
}

export function getCachedDayPayload(
  year: number,
  month: number,
  day: number,
): any | null {
  const payload = timesheetMonthCache.get(monthCacheKey(year, month));
  const days = Array.isArray(payload?.diasLancamento) ? payload.diasLancamento : [];
  return (
    days.find(
      (item: any) =>
        item?.dia === day && item?.mes === month && item?.ano === year,
    ) ?? null
  );
}

export function replaceCachedDayPayload(
  year: number,
  month: number,
  day: number,
  savedDay: any,
): void {
  const payload = timesheetMonthCache.get(monthCacheKey(year, month));
  const days = Array.isArray(payload?.diasLancamento)
    ? payload.diasLancamento
    : null;
  if (!days) return;
  const index = days.findIndex(
    (item: any) =>
      item?.dia === day && item?.mes === month && item?.ano === year,
  );
  if (index >= 0) days[index] = savedDay;
}
