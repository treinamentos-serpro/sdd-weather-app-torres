import { describe, expect, it } from 'vitest';
import { convertTemperature, formatTemperature, unitLabel } from '../../src/lib/temperature';

describe('convertTemperature', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
  ])('converte %s °C para %s °F', (celsius, fahrenheit) => {
    expect(convertTemperature(celsius, 'fahrenheit')).toBe(fahrenheit);
  });

  it.each([0, 100, -40, 12.34])('preserva %s quando a unidade é Celsius', (celsius) => {
    expect(convertTemperature(celsius, 'celsius')).toBe(celsius);
  });

  it('preserva a precisão interna ao converter para Fahrenheit', () => {
    expect(convertTemperature(12.34, 'fahrenheit')).toBeCloseTo(54.212, 10);
  });
});

describe('formatTemperature', () => {
  it.each([
    { celsius: 0, unit: 'celsius', expected: '0,0 °C' },
    { celsius: 0, unit: 'fahrenheit', expected: '32,0 °F' },
    { celsius: 100, unit: 'fahrenheit', expected: '212,0 °F' },
    { celsius: -40, unit: 'fahrenheit', expected: '-40,0 °F' },
    { celsius: 12.34, unit: 'celsius', expected: '12,3 °C' },
    { celsius: 12.36, unit: 'celsius', expected: '12,4 °C' },
    { celsius: -12.36, unit: 'celsius', expected: '-12,4 °C' },
    { celsius: 12.34, unit: 'fahrenheit', expected: '54,2 °F' },
    { celsius: 12.37, unit: 'fahrenheit', expected: '54,3 °F' },
  ] as const)('formata $celsius °C em $unit como $expected', ({ celsius, unit, expected }) => {
    expect(formatTemperature(celsius, unit)).toBe(expected);
  });

  it.each(['celsius', 'fahrenheit'] as const)(
    'identifica temperatura ausente em %s sem convertê-la em zero',
    (unit) => {
      expect(formatTemperature(null, unit)).toBe('Indisponível');
    },
  );

  it.each([undefined, Number.NaN, Number.POSITIVE_INFINITY])(
    'não exibe temperatura ausente ou não finita: %s',
    (temperature) => {
      expect(formatTemperature(temperature, 'celsius')).toBe('Indisponível');
    },
  );
});

describe('unitLabel', () => {
  it.each([
    { unit: 'celsius', expected: '°C' },
    { unit: 'fahrenheit', expected: '°F' },
  ] as const)('retorna $expected para $unit', ({ unit, expected }) => {
    expect(unitLabel(unit)).toBe(expected);
  });
});
