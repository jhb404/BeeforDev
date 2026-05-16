import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const mocks = vi.hoisted(() => ({
  handle: vi.fn(),
  on: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: {
    handle: mocks.handle,
    on: mocks.on,
  },
}));

vi.mock('../../logger', () => ({
  logger: {
    debug: vi.fn(),
    error: mocks.error,
    info: vi.fn(),
    warn: mocks.warn,
  },
}));

import { defineHandler } from '../defineHandler';

function registeredHandler() {
  const call = mocks.handle.mock.calls.at(-1);
  if (!call) throw new Error('No handler registered');
  return call[1] as (event: unknown, ...args: unknown[]) => Promise<unknown>;
}

describe('defineHandler', () => {
  beforeEach(() => {
    mocks.handle.mockClear();
    mocks.on.mockClear();
    mocks.error.mockClear();
    mocks.warn.mockClear();
  });

  it('runs handler with validated payload', async () => {
    const run = vi.fn(({ data }) => ({ ok: true, data: data.id }));

    defineHandler({
      channel: 'test:happy' as never,
      schema: z.object({ id: z.number() }),
      run,
    });

    const result = await registeredHandler()({}, { id: 42 });

    expect(result).toEqual({ ok: true, data: 42 });
    expect(run).toHaveBeenCalledWith({
      event: {},
      args: [{ id: 42 }],
      data: { id: 42 },
    });
  });

  it('returns fail and logs when handler throws', async () => {
    defineHandler({
      channel: 'test:throw' as never,
      errorMessage: 'Exploded',
      run: () => {
        throw new Error('boom');
      },
    });

    const result = await registeredHandler()({});

    expect(result).toEqual({ ok: false, error: 'boom' });
    expect(mocks.error).toHaveBeenCalledWith('Exploded', expect.any(Error));
  });

  it('returns validation failure without running handler', async () => {
    const run = vi.fn();

    defineHandler({
      channel: 'test:invalid' as never,
      schema: z.object({ id: z.number() }),
      run,
    });

    const result = await registeredHandler()({}, { id: 'nope' });

    expect(result).toEqual({ ok: false, error: 'Payload inválido' });
    expect(run).not.toHaveBeenCalled();
    expect(mocks.warn).toHaveBeenCalledWith(expect.stringContaining('IPC validation rejected'));
  });
});
