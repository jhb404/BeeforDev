import { describe, expect, it, vi } from 'vitest';
import { fail, ok, withTimeout } from './result';

describe('result helpers', () => {
  it('creates successful results with and without data', () => {
    expect(ok()).toEqual({ ok: true, data: undefined });
    expect(ok({ value: 1 })).toEqual({ ok: true, data: { value: 1 } });
  });

  it('normalizes unknown errors into failed results', () => {
    expect(fail(new Error('boom'))).toEqual({ ok: false, error: 'boom' });
    expect(fail('plain')).toEqual({ ok: false, error: 'plain' });
  });

  it('rejects with a timeout label when promise does not settle in time', async () => {
    vi.useFakeTimers();
    const promise = withTimeout(new Promise(() => undefined), 100, 'slow-op');
    const assertion = expect(promise).rejects.toThrow('slow-op: timeout após 100ms');

    await vi.advanceTimersByTimeAsync(100);

    await assertion;
    vi.useRealTimers();
  });
});
