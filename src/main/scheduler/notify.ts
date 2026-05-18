import { BrowserWindow, Notification } from 'electron';
import { logger } from '../logger';
import { IPC } from '../../shared/ipc/index';
import { getBuildAssetPath } from '../window';
import { showMacAlert } from '../macAlert';
import type { TodayAlert } from '../../shared/types/index';

type AlarmKind = Exclude<TodayAlert['kind'], 'birthday'>;

function showOsNotification(title: string, body: string): void {
  if (process.platform === 'darwin') {
    showMacAlert(title, body);
    return;
  }
  try {
    if (Notification.isSupported()) {
      new Notification({
        title,
        body,
        icon: getBuildAssetPath('icon.png'),
        urgency: 'critical',
        timeoutType: 'never',
      }).show();
    } else {
      logger.warn('Notifications not supported on this system');
    }
  } catch (err) {
    logger.error('Notification failed', err);
  }
}

export function notify(
  win: BrowserWindow | null,
  title: string,
  body: string,
  withAlarm: boolean,
  kind?: AlarmKind,
): void {
  showOsNotification(title, body);
  if (withAlarm && win && !win.isDestroyed()) {
    win.webContents.send(IPC.EVT_PLAY_ALARM, { title, body, kind });
  }
  if (win && !win.isDestroyed()) {
    win.webContents.send(IPC.EVT_NOTIFY, { title, body });
  }
}
