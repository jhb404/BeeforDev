type Level = 'debug' | 'info' | 'warn' | 'error';

function log(level: Level, ...args: unknown[]) {
  const prefix = `[renderer:${level}]`;
  if (level === 'error') console.error(prefix, ...args);
  else if (level === 'warn') console.warn(prefix, ...args);
  else if (level === 'debug') console.debug(prefix, ...args);
  else console.info(prefix, ...args);
}

export const logger = {
  debug: (...args: unknown[]) => log('debug', ...args),
  info: (...args: unknown[]) => log('info', ...args),
  warn: (...args: unknown[]) => log('warn', ...args),
  error: (...args: unknown[]) => log('error', ...args),
};
