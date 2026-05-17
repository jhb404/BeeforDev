import { app } from 'electron';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { logger } from './logger';

const execFileP = promisify(execFile);

const USER_DATA_FLAG = '--user-data-dir=';

export function isElevated(): boolean {
  if (process.platform === 'win32') {
    const proc = process as unknown as { isElevated?: () => boolean };
    if (typeof proc.isElevated === 'function') return proc.isElevated();
    return false;
  }
  // macOS/Linux: check UID
  return typeof process.getuid === 'function' && process.getuid() === 0;
}

/**
 * Relaunches the app with elevated privileges.
 * Windows: via PowerShell `Start-Process -Verb RunAs`.
 * macOS: currently not supported as elevation is rarely needed for Electron apps on Mac.
 */
export async function relaunchAsAdmin(): Promise<void> {
  if (process.platform !== 'win32') {
    logger.warn('Relaunch as admin called on non-Windows platform; ignoring.');
    return;
  }
  const exe = process.execPath;

  // Keep existing args but ensure --user-data-dir points to current userData
  const userData = app.getPath('userData');
  const existingArgs = process.argv.slice(1).filter((a) => !a.startsWith(USER_DATA_FLAG));
  const args = [...existingArgs, `${USER_DATA_FLAG}${userData}`];

  const psArgs = [
    '-NoProfile',
    '-WindowStyle',
    'Hidden',
    '-Command',
    `Start-Process -FilePath '${exe}' -ArgumentList ${args
      .map((a) => `'${a.replace(/'/g, "''")}'`)
      .join(',')} -Verb RunAs`,
  ];

  await execFileP('powershell.exe', psArgs);
  setTimeout(() => app.quit(), 500);
}
