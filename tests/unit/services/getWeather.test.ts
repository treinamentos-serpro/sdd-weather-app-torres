import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockWeatherData } from '../../../src/mocks/weatherData';
import { getWeather, WeatherServiceError } from '../../../src/services/weatherService';

function forecast() {
  return {
    timezone: 'America/Sao_Paulo',
    utc_offset_seconds: -10800,
    current_units: {
      time: 'iso8601',
      temperature_2m: '°C',
      apparent_temperature: '°C',
      relative_humidity_2m: '%',
      wind_speed_10m: 'km/h',
      weather_code: 'wmo code',
      precipitation: 'mm',
      pressure_msl: 'hPa',
    },
    daily_units: {
      time: 'iso8601',
      weather_code: 'wmo code',
      temperature_2m_min: '°C',
      temperature_2m_max: '°C',
      precipitation_probability_max: '%',
    },
    current: {
      time: '2026-10-27T12:00',
      temperature_2m: 0,
      apparent_temperature: -2,
      relative_humidity_2m: 65,
      wind_speed_10m: 0,
      weather_code: 0,
      precipitation: 0,
      pressure_msl: 1015.2,
    },
    daily: {
      time: ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'],
      weather_code: [0, 2, 61, 3, 999],
      temperature_2m_min: [0, 1, 2, 3, 4],
      temperature_2m_max: [10, 11, 12, 13, 14],
      precipitation_probability_max: [0, 20, 80, 30, 10],
    },
  };
}

function mockResponse(payload: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('getWeather', () => {
  it('solicita unidades e campos corretos e mapeia current e cinco dias por índice', async () => {
    const fetchMock = mockResponse(forecast());
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-27T15:05:00Z'));
    const result = await getWeather(mockWeatherData.city);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    for (const [key, value] of Object.entries({
      latitude: '-23.5475',
      longitude: '-46.6361',
      timezone: 'auto',
      forecast_days: '5',
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh',
      precipitation_unit: 'mm',
      current:
        'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation,pressure_msl',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    }))
      expect(url.searchParams.get(key)).toBe(value);
    expect(result.city).toEqual(mockWeatherData.city);
    expect(result.timeZone).toBe('America/Sao_Paulo');
    expect(result.fetchedAt).toBe('2026-10-27T15:05:00.000Z');
    expect(result.current).toEqual({
      temperatureC: 0,
      apparentTemperatureC: -2,
      relativeHumidityPercent: 65,
      windSpeedKmh: 0,
      precipitationMm: 0,
      pressureMslHpa: 1015.2,
      condition: { code: 0, labelPtBr: 'Céu limpo' },
      observedAt: '2026-10-27T15:00:00.000Z',
    });
    expect(result.days).toHaveLength(5);
    expect(result.days.map((day) => day.temperatureMinC)).toEqual([0, 1, 2, 3, 4]);
    expect(result.days[2]).toEqual({
      date: '2026-10-29',
      condition: { code: 61, labelPtBr: 'Chuva fraca' },
      temperatureMinC: 2,
      temperatureMaxC: 12,
      precipitationProbabilityMaxPercent: 80,
    });
    expect(result.days[4].condition?.labelPtBr).toBe('Condição desconhecida');
  });

  it('limita uma resposta com mais datas aos cinco primeiros dias', async () => {
    const payload = forecast();
    payload.daily.time.push('2026-11-01');
    for (const values of [
      payload.daily.weather_code,
      payload.daily.temperature_2m_min,
      payload.daily.temperature_2m_max,
      payload.daily.precipitation_probability_max,
    ])
      values.push(0);
    mockResponse(payload);
    expect((await getWeather(mockWeatherData.city)).days).toHaveLength(5);
  });

  it('normaliza métricas ausentes e nulas sem inventar zeros', async () => {
    const payload = forecast();
    mockResponse({
      ...payload,
      current: {},
      daily: { time: payload.daily.time, temperature_2m_min: [null, 1, null, null, 0] },
    });
    const result = await getWeather(mockWeatherData.city);
    expect(Object.values(result.current).every((value) => value === null)).toBe(true);
    expect(result.days[0]).toEqual({
      date: '2026-10-27',
      condition: null,
      temperatureMinC: null,
      temperatureMaxC: null,
      precipitationProbabilityMaxPercent: null,
    });
    expect(result.days[4].temperatureMinC).toBe(0);
  });

  it.each([
    { current: undefined },
    { daily: undefined },
    { current: null },
    { daily: null },
    { current: [] },
    { daily: {} },
    { timezone: 'inválido' },
    { current_units: { temperature_2m: '°F' } },
    { daily_units: { time: 'iso8601', temperature_2m_min: '°F' } },
    { daily: { time: ['2026-10-27'] } },
    { daily: { ...forecast().daily, weather_code: [0] } },
    { daily: { ...forecast().daily, time: ['2026-02-30', ...forecast().daily.time.slice(1)] } },
    { daily: { ...forecast().daily, temperature_2m_min: [0, 'bad', 0, 0, 0] } },
    { current: { time: '2026-10-27T25:00' } },
    { current: { temperature_2m: '21' } },
  ])('rejeita resposta incompleta ou inválida %j', async (override) => {
    mockResponse({ ...forecast(), ...override });
    const error = await getWeather(mockWeatherData.city).catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(WeatherServiceError);
    expect(error).toMatchObject({ code: 'invalid-response' });
  });

  it('normaliza hora local com offset positivo cruzando a meia-noite', async () => {
    const payload = forecast();
    mockResponse({
      ...payload,
      timezone: 'Asia/Tokyo',
      utc_offset_seconds: 32400,
      current: { ...payload.current, time: '2026-10-27T00:15' },
    });
    expect((await getWeather(mockWeatherData.city)).current.observedAt).toBe(
      '2026-10-26T15:15:00.000Z',
    );
  });

  it('lança erro HTTP com status', async () => {
    mockResponse({}, 503);
    await expect(getWeather(mockWeatherData.city)).rejects.toMatchObject({
      code: 'http',
      status: 503,
    });
  });

  it('preserva falha de rede como causa', async () => {
    const cause = new TypeError('Offline');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(cause));
    await expect(getWeather(mockWeatherData.city)).rejects.toMatchObject({
      code: 'network',
      cause,
    });
  });

  it('rejeita JSON inválido', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{')));
    await expect(getWeather(mockWeatherData.city)).rejects.toMatchObject({
      code: 'invalid-response',
    });
  });

  it('aplica timeout de dez segundos', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        (_url, { signal }: RequestInit) =>
          new Promise((_resolve, reject) => {
            signal?.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            );
          }),
      ),
    );
    const assertion = expect(getWeather(mockWeatherData.city)).rejects.toMatchObject({
      code: 'timeout',
      message: 'A requisição demorou demais.',
    });
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });
});
