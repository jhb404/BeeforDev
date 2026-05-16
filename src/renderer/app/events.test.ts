import { describe, expect, it, vi } from 'vitest';
import { APP_EVENTS, emitAppEvent, onAppEvent } from './events';

describe('app events', () => {
  it('emits subscribed events and removes listeners through cleanup', () => {
    const cb = vi.fn();
    const off = onAppEvent(APP_EVENTS.OPEN_KUDO, cb);

    emitAppEvent(APP_EVENTS.OPEN_KUDO);
    off();
    emitAppEvent(APP_EVENTS.OPEN_KUDO);

    expect(cb).toHaveBeenCalledTimes(1);
  });
});
