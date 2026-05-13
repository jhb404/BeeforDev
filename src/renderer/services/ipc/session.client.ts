import type { ActionResult, Credentials, SessionStatus } from '@shared/types';

export const sessionClient = {
  getStatus: (): Promise<SessionStatus> => window.beefor.getStatus(),
  login: (): Promise<ActionResult> => window.beefor.login(),
  logout: (): Promise<ActionResult> => window.beefor.logout(),
  verify: (): Promise<ActionResult<SessionStatus>> => window.beefor.verifySession(),
  onStatus: (cb: (s: SessionStatus) => void): (() => void) =>
    window.beefor.onStatus(cb),
  saveCredentials: (creds: Credentials): Promise<ActionResult> =>
    window.beefor.saveCredentials(creds),
  getCredentials: (): Promise<{ email: string } | null> =>
    window.beefor.getCredentials(),
  clearCredentials: (): Promise<ActionResult> => window.beefor.clearCredentials(),
};
