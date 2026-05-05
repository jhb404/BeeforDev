import { app } from 'electron';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileP = promisify(execFile);

const USER_DATA_FLAG = '--user-data-dir=';

export function isElevated(): boolean {
  if (process.platform !== 'win32') {
    return typeof process.getuid === 'function' && process.getuid() === 0;
  }
  const proc = process as unknown as { isElevated?: () => boolean };
  if (typeof proc.isElevated === 'function') return proc.isElevated();
  return false;
}

/**
 * Relaunches the app with elevated privileges via PowerShell `Start-Process -Verb RunAs`.
 * Passes --user-data-dir so the elevated process reads the same userData path,
 * preventing settings/session loss when admin uses a different profile directory.
 */
export async function relaunchAsAdmin(): Promise<void> {
  if (process.platform !== 'win32') {
    throw new Error('Elevação só suportada no Windows.');
  }
  const exe = process.execPath;

  // Keep existing args but ensure --user-data-dir points to current userData
  const userData = app.getPath('userData');
  const existingArgs = process.argv.slice(1).filter(
    (a) => !a.startsWith(USER_DATA_FLAG),
  );
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
