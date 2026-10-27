import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

function partialForecast(indices: number[]) {
  const payload = forecast();
  payload.daily = {
    time: indices.map((index) => payload.daily.time[index]),
    weather_code: indices.map((index) => payload.daily.weather_code[index]),
    temperature_2m_min: indices.map((index) => payload.daily.temperature_2m_min[index]),
    temperature_2m_max: indices.map((index) => payload.daily.temperature_2m_max[index]),
    precipitation_probability_max: indices.map(
      (index) => payload.daily.precipitation_probability_max[index],
    ),
  };
  return payload;
}

function unavailableDay(date: string) {
  return {
    date,
    condition: null,
    temperatureMinC: null,
    temperatureMaxC: null,
    precipitationProbabilityMaxPercent: null,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-27T15:05:00Z'));
});

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

  it('rejeita uma resposta com mais de cinco datas, sem truncar a série', async () => {
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
    await expect(getWeather(mockWeatherData.city)).rejects.toMatchObject({
      code: 'invalid-response',
    });
  });

  it('normaliza campos atuais ausentes e séries diárias ausentes/nulas sem inventar zeros', async () => {
    const payload = forecast();
    mockResponse({
      ...payload,
      current: { temperature_2m: 0 },
      daily: { time: payload.daily.time, temperature_2m_min: [null, 1, null, null, 0] },
    });
    const result = await getWeather(mockWeatherData.city);
    expect(result.current).toEqual({
      temperatureC: 0,
      apparentTemperatureC: null,
      relativeHumidityPercent: null,
      windSpeedKmh: null,
      condition: null,
      precipitationMm: null,
      pressureMslHpa: null,
      observedAt: null,
    });
    expect(result.days[0]).toEqual({
      date: '2026-10-27',
      condition: null,
      temperatureMinC: null,
      temperatureMaxC: null,
      precipitationProbabilityMaxPercent: null,
    });
    expect(result.days[4].temperatureMinC).toBe(0);
    expect(
      result.days.every(
        (day) =>
          day.condition === null &&
          day.temperatureMaxC === null &&
          day.precipitationProbabilityMaxPercent === null,
      ),
    ).toBe(true);
  });

  it.each([
    { time: forecast().daily.time },
    {
      time: forecast().daily.time,
      weather_code: null,
      temperature_2m_min: null,
      temperature_2m_max: null,
      precipitation_probability_max: null,
    },
    {
      time: forecast().daily.time,
      weather_code: [null, null, null, null, null],
      temperature_2m_min: [null, null, null, null, null],
      temperature_2m_max: [null, null, null, null, null],
      precipitation_probability_max: [null, null, null, null, null],
    },
    { time: ['2026-10-29'], temperature_2m_min: [null] },
  ])('rejeita forecast sem qualquer campo meteorológico disponível %j', async (daily) => {
    mockResponse({ ...forecast(), daily });
    const error = await getWeather(mockWeatherData.city).catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(WeatherServiceError);
    expect(error).toMatchObject({
      code: 'invalid-response',
      messagePtBr: 'O serviço retornou uma resposta incompleta ou inválida.',
    });
  });

  it.each([
    ['weather_code', 'condition', { code: 0, labelPtBr: 'Céu limpo' }],
    ['temperature_2m_min', 'temperatureMinC', 0],
    ['temperature_2m_max', 'temperatureMaxC', 0],
    ['precipitation_probability_max', 'precipitationProbabilityMaxPercent', 0],
  ])('aceita forecast parcial com somente %s igual a zero', async (series, field, value) => {
    mockResponse({
      ...forecast(),
      daily: { time: ['2026-10-29'], [series]: [0] },
    });
    const result = await getWeather(mockWeatherData.city);
    expect(result.days).toEqual([
      unavailableDay('2026-10-27'),
      unavailableDay('2026-10-28'),
      { ...unavailableDay('2026-10-29'), [field]: value },
      unavailableDay('2026-10-30'),
      unavailableDay('2026-10-31'),
    ]);
  });

  it('preserva campos válidos em uma resposta parcialmente nula, sem presumir precipitação zero', async () => {
    const payload = forecast();
    mockResponse({
      ...payload,
      current: { ...payload.current, precipitation: null, apparent_temperature: null },
      daily: {
        ...payload.daily,
        temperature_2m_max: [10, null, 12, 13, 14],
        precipitation_probability_max: [0, null, 80, 30, 10],
      },
    });

    const result = await getWeather(mockWeatherData.city);

    expect(result.current).toMatchObject({
      temperatureC: 0,
      apparentTemperatureC: null,
      precipitationMm: null,
      relativeHumidityPercent: 65,
    });
    expect(result.days).toHaveLength(5);
    expect(result.days[1]).toEqual({
      date: '2026-10-28',
      condition: { code: 2, labelPtBr: 'Parcialmente nublado' },
      temperatureMinC: 1,
      temperatureMaxC: null,
      precipitationProbabilityMaxPercent: null,
    });
    expect(result.days[2].temperatureMaxC).toBe(12);
    expect(result.days[0].precipitationProbabilityMaxPercent).toBe(0);
  });

  it.each([
    [0, 1, 2],
    [0, 2, 4],
    [1, 3, 4],
    [4],
    [1, 3],
    [0, 1, 3, 4],
  ])('aceita datas parciais %j e representa cada lacuna sem inventar valores', async (...indices) => {
    mockResponse(partialForecast(indices));
    const result = await getWeather(mockWeatherData.city);
    expect(result.days.map((day) => day.date)).toEqual(forecast().daily.time);
    for (const [index, day] of result.days.entries()) {
      if (!indices.includes(index)) {
        expect(day).toEqual(unavailableDay(forecast().daily.time[index]));
      } else {
        expect(day).toEqual({
          date: forecast().daily.time[index],
          condition: { code: forecast().daily.weather_code[index], labelPtBr: expect.any(String) },
          temperatureMinC: index,
          temperatureMaxC: 10 + index,
          precipitationProbabilityMaxPercent: forecast().daily.precipitation_probability_max[index],
        });
      }
    }
  });

  it.each([
    {
      timezone: 'Asia/Tokyo',
      offset: 32400,
      now: '2026-10-26T15:05:00Z',
      today: '2026-10-27',
      last: '2026-10-31',
    },
    {
      timezone: 'America/Los_Angeles',
      offset: -25200,
      now: '2026-10-28T00:05:00Z',
      today: '2026-10-27',
      last: '2026-10-31',
    },
    {
      timezone: 'Pacific/Kiritimati',
      offset: 50400,
      now: '2026-10-31T12:05:00Z',
      today: '2026-11-01',
      last: '2026-11-05',
    },
  ])('calcula D pelo relógio em $timezone, não pela primeira data recebida', async ({
    timezone,
    offset,
    now,
    today,
    last,
  }) => {
    vi.setSystemTime(new Date(now));
    mockResponse({
      ...forecast(),
      timezone,
      utc_offset_seconds: offset,
      daily: { time: [last], temperature_2m_min: [0] },
    });
    const result = await getWeather(mockWeatherData.city);
    expect(result.timeZone).toBe(timezone);
    expect(result.days).toHaveLength(5);
    expect(result.days[0]).toEqual(unavailableDay(today));
    expect(result.days.slice(0, 4).every((day) => day.temperatureMinC === null)).toBe(true);
    expect(result.days[4]).toEqual({ ...unavailableDay(last), temperatureMinC: 0 });
  });

  it.each([
    {},
    { time: '2026-10-27T12:00' },
    {
      time: '2026-10-27T12:00',
      temperature_2m: null,
      apparent_temperature: null,
      relative_humidity_2m: null,
      wind_speed_10m: null,
      weather_code: null,
      precipitation: null,
      pressure_msl: null,
    },
    { temperature_2m: null, precipitation: null },
  ])('rejeita consulta atual sem dados meteorológicos %j', async (current) => {
    mockResponse({ ...forecast(), current });
    const error = await getWeather(mockWeatherData.city).catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(WeatherServiceError);
    expect(error).toMatchObject({
      code: 'invalid-response',
      messagePtBr: 'O serviço retornou uma resposta incompleta ou inválida.',
    });
  });

  it.each([
    { temperature_2m: 0 },
    { apparent_temperature: 0 },
    { relative_humidity_2m: 0 },
    { wind_speed_10m: 0 },
    { weather_code: 0 },
    { precipitation: 0 },
    { pressure_msl: 0 },
  ])('aceita ao menos um campo meteorológico válido, inclusive zero %j', async (current) => {
    mockResponse({ ...forecast(), current });
    await expect(getWeather(mockWeatherData.city)).resolves.toMatchObject({
      days: expect.any(Array),
    });
  });

  it.each([
    { ...partialForecast([0, 2, 4]).daily, weather_code: [0, 2] },
    { ...partialForecast([0, 2, 4]).daily, temperature_2m_max: [0, 1, 2, 3] },
    { ...partialForecast([0, 2, 4]).daily, temperature_2m_min: 'invalid' },
    { ...partialForecast([0, 2, 4]).daily, precipitation_probability_max: [0, 'bad', 0] },
    { time: ['2026-10-26'], temperature_2m_min: [0] },
    { time: ['2026-11-01'], temperature_2m_min: [0] },
    { time: ['2026-10-27', '2026-10-27'] },
    { time: ['2026-10-29', '2026-10-27'] },
    { time: ['2026-13-01'] },
    { time: ['2026-10-32'] },
    { time: ['2026-10-27T00:00:00Z'] },
    { time: [null] },
  ])('rejeita série parcial fora do contrato %j', async (daily) => {
    mockResponse({ ...forecast(), daily });
    await expect(getWeather(mockWeatherData.city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      code: 'invalid-response',
    });
  });

  it.each([
    { ...forecast(), current_units: { ...forecast().current_units, temperature_2m: '°F' } },
    { ...forecast(), current_units: { ...forecast().current_units, precipitation: '%' } },
    {
      ...forecast(),
      daily_units: { ...forecast().daily_units, temperature_2m_max: '°F' },
    },
    {
      ...forecast(),
      daily: {
        ...forecast().daily,
        time: ['2026-10-27', '2026-10-27', '2026-10-29', '2026-10-30', '2026-10-31'],
      },
    },
    {
      ...forecast(),
      daily: {
        ...forecast().daily,
        time: ['2026-10-27', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'],
      },
    },
    {
      ...forecast(),
      daily: { ...forecast().daily, time: [...forecast().daily.time].reverse() },
    },
    { ...forecast(), current: { ...forecast().current, weather_code: 1.5 } },
  ])('rejeita unidades incompatíveis ou dados inconsistentes sem aceitar valores enganosos %#', async (payload) => {
    mockResponse(payload);
    await expect(getWeather(mockWeatherData.city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      code: 'invalid-response',
    });
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
    { daily: { time: [] } },
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
    vi.setSystemTime(new Date('2026-10-27T00:05:00Z'));
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
      message:
        'A consulta excedeu o tempo limite de 10 segundos. Verifique sua conexão e tente novamente.',
    });
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });
});
