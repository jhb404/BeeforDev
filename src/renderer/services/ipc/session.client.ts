import type { ActionResult, Credentials, SessionStatus } from '@shared/types/index';
import type { BeeforApi } from '../../../main/preload';

export function createSessionClient(api: BeeforApi) {
  return {
    getStatus: (): Promise<SessionStatus> => api.getStatus(),
    login: (): Promise<ActionResult> => api.login(),
    loginGoogle: (): Promise<ActionResult> => api.loginGoogle(),
    logout: (): Promise<ActionResult> => api.logout(),
    verify: (): Promise<ActionResult<SessionStatus>> => api.verifySession(),
    onStatus: (cb: (s: SessionStatus) => void): (() => void) => api.onStatus(cb),
    saveCredentials: (creds: Credentials): Promise<ActionResult> => api.saveCredentials(creds),
    getCredentials: (): Promise<{ email: string; connected?: boolean } | null> =>
      api.getCredentials(),
    clearCredentials: (): Promise<ActionResult> => api.clearCredentials(),
  };
}

export const sessionClient = createSessionClient(window.beefor);
export type SessionClient = ReturnType<typeof createSessionClient>;
