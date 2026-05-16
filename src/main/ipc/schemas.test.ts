import { describe, expect, it } from 'vitest';
import {
  assetFileNameSchema,
  notifyTestKindSchema,
  notifyWindowsArgsSchema,
} from './schemas';

describe('ipc schemas', () => {
  it('accepts only known notification test kinds', () => {
    expect(notifyTestKindSchema.safeParse('mood').success).toBe(true);
    expect(notifyTestKindSchema.safeParse('lunch').success).toBe(true);
    expect(notifyTestKindSchema.safeParse('unknown').success).toBe(false);
  });

  it('validates custom notification args', () => {
    expect(notifyWindowsArgsSchema.safeParse(['title', 'body', 'purple']).success).toBe(true);
    expect(notifyWindowsArgsSchema.safeParse(['title', 'body', 'blue']).success).toBe(false);
    expect(notifyWindowsArgsSchema.safeParse(['title', 'x'.repeat(2001)]).success).toBe(false);
  });

  it('rejects asset filenames with path traversal or separators', () => {
    expect(assetFileNameSchema.safeParse('patch-journal.md').success).toBe(true);
    expect(assetFileNameSchema.safeParse('../secret.txt').success).toBe(false);
    expect(assetFileNameSchema.safeParse('nested/file.txt').success).toBe(false);
  });
});
