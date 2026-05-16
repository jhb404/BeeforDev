import { BrowserWindow, Notification } from 'electron';
import { logger } from '../logger';
import { IPC } from '../../shared/ipc/index';
import { getBuildAssetPath } from '../window';
import type { TodayAlert } from '../../shared/types/index';

type AlarmKind = Exclude<TodayAlert['kind'], 'birthday'>;

function appIconPath(): string {
  return getBuildAssetPath('icon.png');
}

export function notify(
  win: BrowserWindow | null,
  title: string,
  body: string,
  withAlarm: boolean,
  kind?: AlarmKind,
): void {
  try {
    if (Notification.isSupported()) {
      const n = new Notification({
        title,
        body,
        icon: appIconPath(),
        urgency: 'critical',
        timeoutType: 'never',
      });
      n.show();
    } else {
      logger.warn('Notifications not supported on this system');
    }
  } catch (err) {
    logger.error('Notification failed', err);
  }
  if (withAlarm && win && !win.isDestroyed()) {
    win.webContents.send(IPC.EVT_PLAY_ALARM, { title, body, kind });
  }
  if (win && !win.isDestroyed()) {
    win.webContents.send(IPC.EVT_NOTIFY, { title, body });
  }
}
