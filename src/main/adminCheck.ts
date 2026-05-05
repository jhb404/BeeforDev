import { app } from 'electron';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileP = promisify(execFile);

export function isElevated(): boolean {
  if (process.platform !== 'win32') {
    // Unix-like: euid 0 = root
    return typeof process.getuid === 'function' && process.getuid() === 0;
  }
  // Electron exposes process.isElevated only on Windows
  // (typed as any to avoid version-specific typings)
  const proc = process as unknown as { isElevated?: () => boolean };
  if (typeof proc.isElevated === 'function') return proc.isElevated();
  return false;
}

/**
 * Relaunches the app with elevated privileges via PowerShell `Start-Process -Verb RunAs`.
 * Triggers UAC prompt. App quits after spawning the elevated instance.
 */
export async function relaunchAsAdmin(): Promise<void> {
  if (process.platform !== 'win32') {
    throw new Error('Elevação só suportada no Windows.');
  }
  const exe = process.execPath;
  const args = process.argv.slice(1);

  const psArgs = [
    '-NoProfile',
    '-WindowStyle',
    'Hidden',
    '-Command',
    args.length
      ? `Start-Process -FilePath '${exe}' -ArgumentList ${args
          .map((a) => `'${a.replace(/'/g, "''")}'`)
          .join(',')} -Verb RunAs`
      : `Start-Process -FilePath '${exe}' -Verb RunAs`,
  ];

  await execFileP('powershell.exe', psArgs);
  // give UAC a moment to spawn, then quit current
  setTimeout(() => app.quit(), 500);
}
