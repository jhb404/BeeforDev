import { describe, it, expect } from 'vitest';
import { isoDate, daysInMonth, weekdayOf, formatBirthdayPretty, initialsOf } from './dates';

describe('isoDate', () => {
  it('pads month and day', () => expect(isoDate(2024, 3, 5)).toBe('2024-03-05'));
  it('handles two-digit values', () => expect(isoDate(2024, 12, 31)).toBe('2024-12-31'));
});

describe('daysInMonth', () => {
  it('returns 28 for Feb 2023', () => expect(daysInMonth(2023, 2)).toBe(28));
  it('returns 29 for Feb 2024 (leap)', () => expect(daysInMonth(2024, 2)).toBe(29));
  it('returns 31 for January', () => expect(daysInMonth(2024, 1)).toBe(31));
});

describe('weekdayOf', () => {
  it('2024-01-01 is Monday (1)', () => expect(weekdayOf(2024, 1, 1)).toBe(1));
  it('2024-01-07 is Sunday (0)', () => expect(weekdayOf(2024, 1, 7)).toBe(0));
});

describe('formatBirthdayPretty', () => {
  it('formats YYYY-MM-DD', () => expect(formatBirthdayPretty('1990-03-15')).toBe('15 de março'));
  it('formats MM-DD', () => expect(formatBirthdayPretty('12-25')).toBe('25 de dezembro'));
  it('returns — for null', () => expect(formatBirthdayPretty(null)).toBe('—'));
  it('returns — for empty', () => expect(formatBirthdayPretty('')).toBe('—'));
});

describe('initialsOf', () => {
  it('two-word name', () => expect(initialsOf('João Batista')).toBe('JB'));
  it('single word', () => expect(initialsOf('Joao')).toBe('JO'));
  it('three words takes first+last', () => expect(initialsOf('Ana Maria Silva')).toBe('AS'));
  it('empty string returns ?', () => expect(initialsOf('')).toBe('?'));
});
