import type { BrowserWindow } from 'electron';
import { registerCredentialsHandlers } from './handlers/credentials.handlers';
import { registerSettingsHandlers } from './handlers/settings.handlers';
import { registerSessionHandlers } from './handlers/session.handlers';
import { registerTimesheetHandlers } from './handlers/timesheet.handlers';
import { registerMoodHandlers } from './handlers/mood.handlers';
import { registerKudoHandlers } from './handlers/kudo.handlers';
import { registerTeamHandlers } from './handlers/team.handlers';
import { registerSystemHandlers } from './handlers/system.handlers';
import { registerWindowHandlers } from './handlers/window.handlers';
import { registerCoin2uHandlers } from './handlers/coin2u.handlers';
import { registerAtividadesHandlers } from './handlers/atividades.handlers';

export function registerIpcHandlers(getWindow: () => BrowserWindow | null): void {
  registerCredentialsHandlers();
  registerSettingsHandlers();
  registerSessionHandlers(getWindow);
  registerTimesheetHandlers(getWindow);
  registerMoodHandlers(getWindow);
  registerKudoHandlers(getWindow);
  registerTeamHandlers(getWindow);
  registerSystemHandlers(getWindow);
  registerWindowHandlers(getWindow);
  registerCoin2uHandlers();
  registerAtividadesHandlers(getWindow);
}
