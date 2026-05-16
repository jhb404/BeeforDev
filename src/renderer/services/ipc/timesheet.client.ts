import type { ActionResult, FetchedTimesheetRow, TimesheetEntry } from '@shared/types/index';
import type { BeeforApi } from '../../../main/preload';

export function createTimesheetClient(api: BeeforApi) {
  return {
    autoLancamento: (): Promise<ActionResult> => api.autoLancamento(),
    lancarHora: (entry: TimesheetEntry): Promise<ActionResult> => api.lancarHora(entry),
    fetch: (year: number, month: number): Promise<ActionResult<FetchedTimesheetRow[]>> =>
      api.fetchTimesheet(year, month),
    openBeefor: (): Promise<ActionResult> => api.openBeefor(),
  };
}

export const timesheetClient = createTimesheetClient(window.beefor);
export type TimesheetClient = ReturnType<typeof createTimesheetClient>;
