import type { Unit } from '../types/weather';

export function convertTemperature(celsius: number, unit: Unit): number {
  return unit === 'fahrenheit' ? (celsius * 9) / 5 + 32 : celsius;
}

export function formatTemperature(celsius: number | null, unit: Unit): string {
  if (celsius === null) {
    return 'Indisponível';
  }
  const value = convertTemperature(celsius, unit).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${value} ${unit === 'celsius' ? '°C' : '°F'}`;
}
