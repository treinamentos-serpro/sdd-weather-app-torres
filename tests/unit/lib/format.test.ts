import { describe, expect, it } from 'vitest';
import { formatDay, formatOptionalMetric } from '../../../src/lib/format';

describe('formatOptionalMetric', () => {
  it.each([
    [0, '%', 1, '0 %'],
    [12.6, 'km/h', 1, '12,6 km/h'],
    [12.6, '%', 0, '13 %'],
    [null, '%', 1, 'Indisponível'],
    [undefined, '%', 1, 'Indisponível'],
    [Number.NaN, '%', 1, 'Indisponível'],
    [Number.POSITIVE_INFINITY, '%', 1, 'Indisponível'],
  ])('formata %s %s com segurança', (value, suffix, digits, expected) => {
    expect(formatOptionalMetric(value, suffix, digits)).toBe(expected);
  });
});

describe('formatDay', () => {
  it('preserva a data local e usa rótulo pt-BR', () => {
    expect(formatDay('2026-10-27')).toBe('ter., 27/10');
    expect(formatDay('2026-11-01')).toBe('dom., 01/11');
  });

  it.each(['inválida', '2026-02-30', '2026-1-01'])('rejeita data inválida %s', (date) => {
    expect(() => formatDay(date)).toThrow(RangeError);
  });

  it.each([
    ['2024-02-29', 'qui., 29/02'],
    ['2026-12-31', 'qui., 31/12'],
    ['2027-01-01', 'sex., 01/01'],
  ])('formata %s sem perder o dia nas viradas de calendário', (date, expected) => {
    expect(formatDay(date)).toBe(expected);
  });

  it.each([
    '',
    '2026-02-29',
    '2026-04-31',
    '2026-00-01',
    '2026-13-01',
    '2026-10-27T00:00:00Z',
  ])('não normaliza silenciosamente a data inválida %j', (date) => {
    expect(() => formatDay(date)).toThrow(RangeError);
  });
});
