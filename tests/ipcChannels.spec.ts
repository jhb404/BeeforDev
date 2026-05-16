import { describe, it, expect } from 'vitest';
import { IPC } from '../src/shared/ipc/index';

describe('IPC channels', () => {
  it('all channels are unique', () => {
    const values = Object.values(IPC);
    expect(new Set(values).size).toBe(values.length);
  });

  it('has core session/action channels', () => {
    expect(IPC.SESSION_LOGIN).toBeDefined();
    expect(IPC.ACTION_AUTO_LANCAMENTO).toBeDefined();
    expect(IPC.ACTION_SELECT_MOOD).toBeDefined();
  });
});
