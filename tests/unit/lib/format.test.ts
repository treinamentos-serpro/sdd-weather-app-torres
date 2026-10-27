import { describe, expect, it } from 'vitest';
import { formatDay } from '../../../src/lib/format';

describe('formatDay', () => {
  it('preserva a data local e usa rótulo pt-BR', () => {
    expect(formatDay('2026-10-27')).toBe('ter., 27/10');
    expect(formatDay('2026-11-01')).toBe('dom., 01/11');
  });

  it.each(['inválida', '2026-02-30', '2026-1-01'])('rejeita data inválida %s', (date) => {
    expect(() => formatDay(date)).toThrow(RangeError);
  });
});
