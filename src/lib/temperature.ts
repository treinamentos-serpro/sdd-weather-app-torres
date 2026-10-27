import type { Unit } from '../types/weather';

export function convertTemperature(celsius: number, unit: Unit): number {
  return unit === 'fahrenheit' ? (celsius * 9) / 5 + 32 : celsius;
}

export function unitLabel(unit: Unit): string {
  return unit === 'celsius' ? '°C' : '°F';
}

export function formatTemperature(celsius: number | null | undefined, unit: Unit): string {
  if (celsius === null || celsius === undefined || !Number.isFinite(celsius)) {
    return 'Indisponível';
  }
  const value = convertTemperature(celsius, unit).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${value} ${unitLabel(unit)}`;
}
