export type BeeforEnv = 'local' | 'prod';

export interface ApiBases {
  /** goobeeteams API (login, mood, kudocard, pessoa, organizacao, quadro/atividades) */
  teams: string;
  /** ProjectPro API (timesheet: apontamento, totais, lancamento, grupo) */
  timesheet: string;
  /** App URL (Playwright fallback / browser open) */
  appUrl: string;
}

export const API_BASES: Record<BeeforEnv, ApiBases> = {
  local: {
    teams: 'http://localhost:44341/api',
    timesheet: 'https://apiteams.goobee.com.br/timesheet-beefor/api',
    appUrl: 'https://app.beefor.io',
  },
  prod: {
    teams: 'http://localhost:44341/api',
    // teams: 'https://apiteams.goobee.com.br/api',
    timesheet: 'https://apiteams.goobee.com.br/timesheet-beefor/api',
    appUrl: 'https://app.beefor.io',
  },
};

let activeEnv: BeeforEnv =
  (process.env.BEEFOR_ENV as BeeforEnv | undefined) === 'local' ? 'local' : 'prod';

export function getBeeforEnv(): BeeforEnv {
  return activeEnv;
}

export function setBeeforEnv(env: BeeforEnv): void {
  activeEnv = env;
}

export function getApiBases(): ApiBases {
  return API_BASES[activeEnv];
}
