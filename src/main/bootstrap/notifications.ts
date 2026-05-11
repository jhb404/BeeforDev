import { Notification } from 'electron';
import { getBuildIconPath } from '../window';
import { logger } from '../logger';

export function notifyWindows(
  title: string,
  body: string,
  variant: 'orange' | 'purple' = 'orange',
): void {
  try {
    if (Notification.isSupported()) {
      new Notification({
        title,
        body,
        icon: getBuildIconPath(variant),
      }).show();
      return;
    }
  } catch (err) {
    logger.warn(
      `Notification failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  logger.info(`[NOTIFY] ${title} - ${body}`);
}
