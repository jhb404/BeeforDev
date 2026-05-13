import { describe, it, expect } from 'vitest';
import { toMinutes, formatMinutes, workedMinutes } from './timeMath';

describe('toMinutes', () => {
  it('parses HH:MM', () => expect(toMinutes('08:30')).toBe(510));
  it('parses single-digit hour', () => expect(toMinutes('9:00')).toBe(540));
  it('returns 0 for empty string', () => expect(toMinutes('')).toBe(0));
  it('returns 0 for invalid format', () => expect(toMinutes('abc')).toBe(0));
});

describe('formatMinutes', () => {
  it('formats positive', () => expect(formatMinutes(90)).toBe('01:30'));
  it('formats negative', () => expect(formatMinutes(-90)).toBe('-01:30'));
  it('formats with sign prefix', () => expect(formatMinutes(90, true)).toBe('+01:30'));
  it('formats zero', () => expect(formatMinutes(0)).toBe('00:00'));
});

describe('workedMinutes', () => {
  it('computes full day with two intervals', () => {
    expect(
      workedMinutes({
        entrada: '08:00',
        int1: '12:00',
        ret1: '13:00',
        int2: '15:00',
        ret2: '15:15',
        saida: '17:00',
      }),
    ).toBe(9 * 60 - 60 - 15);
  });

  it('returns 0 when entrada or saida missing', () => {
    expect(
      workedMinutes({ entrada: '', int1: '', ret1: '', int2: '', ret2: '', saida: '17:00' }),
    ).toBe(0);
  });

  it('ignores incomplete interval pairs', () => {
    expect(
      workedMinutes({
        entrada: '08:00',
        int1: '12:00',
        ret1: '',
        int2: '',
        ret2: '',
        saida: '17:00',
      }),
    ).toBe(9 * 60);
  });
});
