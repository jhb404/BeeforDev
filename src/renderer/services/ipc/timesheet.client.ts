import type {
  ActionResult,
  FetchedTimesheetRow,
  TimesheetEntry,
} from '@shared/types';

export const timesheetClient = {
  autoLancamento: (): Promise<ActionResult> => window.beefor.autoLancamento(),
  lancarHora: (entry: TimesheetEntry): Promise<ActionResult> =>
    window.beefor.lancarHora(entry),
  fetch: (
    year: number,
    month: number,
  ): Promise<ActionResult<FetchedTimesheetRow[]>> =>
    window.beefor.fetchTimesheet(year, month),
  openBeefor: (): Promise<ActionResult> => window.beefor.openBeefor(),
};
