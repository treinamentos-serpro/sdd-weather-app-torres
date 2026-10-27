import { describe, expect, it } from 'vitest';
import { convertTemperature, formatTemperature } from '../../../src/lib/temperature';

describe('temperature', () => {
  it.each([
    [20, 68, '68,0 °F'],
    [-40, -40, '-40,0 °F'],
    [12.34, 54.212, '54,2 °F'],
    [0, 32, '32,0 °F'],
  ])('converte %s °C sem arredondar o valor interno', (input, value, formatted) => {
    expect(convertTemperature(input, 'fahrenheit')).toBeCloseTo(value);
    expect(formatTemperature(input, 'fahrenheit')).toBe(formatted);
    expect(convertTemperature(input, 'celsius')).toBe(input);
  });

  it('formata Celsius em pt-BR e diferencia ausência de zero', () => {
    expect(formatTemperature(0, 'celsius')).toBe('0,0 °C');
    expect(formatTemperature(12.34, 'celsius')).toBe('12,3 °C');
    expect(formatTemperature(null, 'celsius')).toBe('Indisponível');
    expect(formatTemperature(null, 'fahrenheit')).toBe('Indisponível');
  });
});
