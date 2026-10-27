import type { WeatherData } from '../types/weather';

/** Dados fictícios e estáticos para desenvolver a UI sem acesso à API. */
export const mockWeatherData: WeatherData = {
  city: {
    id: '3448439',
    name: 'São Paulo',
    region: 'São Paulo',
    country: 'Brasil',
    latitude: -23.5475,
    longitude: -46.6361,
  },
  timeZone: 'America/Sao_Paulo',
  fetchedAt: '2026-10-27T15:05:00Z',
  current: {
    temperatureC: 25.4,
    apparentTemperatureC: 26.1,
    condition: { code: 2, labelPtBr: 'Parcialmente nublado' },
    relativeHumidityPercent: 65,
    windSpeedKmh: 12.6,
    precipitationMm: 0,
    pressureMslHpa: 1015.2,
    observedAt: '2026-10-27T15:00:00Z',
  },
  days: [
    {
      date: '2026-10-27',
      condition: { code: 2, labelPtBr: 'Parcialmente nublado' },
      temperatureMinC: 18.2,
      temperatureMaxC: 27.5,
      precipitationProbabilityMaxPercent: 20,
    },
    {
      date: '2026-10-28',
      condition: { code: 0, labelPtBr: 'Céu limpo' },
      temperatureMinC: 19,
      temperatureMaxC: 29.3,
      precipitationProbabilityMaxPercent: 0,
    },
    {
      date: '2026-10-29',
      condition: { code: 61, labelPtBr: 'Chuva fraca' },
      temperatureMinC: 18.7,
      temperatureMaxC: 24.6,
      precipitationProbabilityMaxPercent: 80,
    },
    {
      date: '2026-10-30',
      condition: { code: 3, labelPtBr: 'Encoberto' },
      temperatureMinC: 17.4,
      temperatureMaxC: 23.8,
      precipitationProbabilityMaxPercent: 30,
    },
    {
      date: '2026-10-31',
      condition: { code: 1, labelPtBr: 'Predominantemente limpo' },
      temperatureMinC: 18.1,
      temperatureMaxC: 26.9,
      precipitationProbabilityMaxPercent: 10,
    },
  ],
};
