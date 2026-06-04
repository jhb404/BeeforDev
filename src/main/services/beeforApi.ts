/**
 * Public HTTP API surface for goobeeteams + timesheet (ProjectPro).
 * Use these instead of Playwright-bound `beeforApiGet` for new code.
 */
export {
  loginHttp,
  getValidSession,
  getCachedSession,
  clearCachedSession,
  setCredentials,
  clearCredentials,
  beeforHttp,
  BeeforAuthError,
  BeeforApiError,
  type BeeforSession,
} from './beeforHttpClient';

export * as Mood from './beeforMoodService';
export * as Kudo from './beeforKudoService';
export * as Pessoa from './beeforPessoaService';
export * as Timesheet from './beeforTimesheetService';
export * as Atividades from './beeforAtividadesService';
