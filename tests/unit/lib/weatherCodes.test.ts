import { describe, expect, it } from 'vitest';
import { getWeatherCondition, getWeatherIcon } from '../../../src/lib/weatherCodes';

describe('weatherCodes', () => {
  it.each([
    0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86,
    95, 96, 99,
  ])('mapeia o código WMO %s para condição e ícone', (code) => {
    const condition = getWeatherCondition(code);
    expect(condition.code).toBe(code);
    expect(condition.labelPtBr).not.toBe('Condição desconhecida');
    expect(condition.labelPtBr.length).toBeGreaterThan(0);
    expect(getWeatherIcon(code)).not.toBe('—');
  });

  it('usa fallback neutro para códigos desconhecidos e condição ausente', () => {
    expect(getWeatherCondition(999)).toEqual({ code: 999, labelPtBr: 'Condição desconhecida' });
    expect(getWeatherIcon(999)).toBe('—');
    expect(getWeatherIcon(null)).toBe('—');
  });
});
