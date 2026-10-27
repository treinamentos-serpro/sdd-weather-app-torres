import { getWeatherCondition } from '../lib/weatherCodes';
import type {
  City,
  ForecastDay,
  RequestError,
  RequestErrorCode,
  WeatherData,
} from '../types/weather';

export class WeatherServiceError extends Error implements RequestError {
  constructor(
    public readonly code: RequestErrorCode,
    public readonly messagePtBr: string,
    options?: ErrorOptions,
    public readonly status?: number,
  ) {
    super(messagePtBr, options);
    this.name = 'WeatherServiceError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalidResponse(): WeatherServiceError {
  return new WeatherServiceError(
    'invalid-response',
    'O serviço retornou uma resposta incompleta ou inválida.',
  );
}

function optionalText(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw invalidResponse();
  return value;
}

function mapCity(value: unknown): City {
  if (
    !isRecord(value) ||
    typeof value.name !== 'string' ||
    value.name.trim().length === 0 ||
    typeof value.latitude !== 'number' ||
    !Number.isFinite(value.latitude) ||
    Math.abs(value.latitude) > 90 ||
    typeof value.longitude !== 'number' ||
    !Number.isFinite(value.longitude) ||
    Math.abs(value.longitude) > 180
  ) {
    throw invalidResponse();
  }
  const { id } = value;
  if (
    id !== undefined &&
    id !== null &&
    (typeof id !== 'number' || !Number.isFinite(id)) &&
    (typeof id !== 'string' || id.trim().length === 0)
  ) {
    throw invalidResponse();
  }
  return {
    id: id === undefined || id === null ? `${value.latitude},${value.longitude}` : String(id),
    name: value.name,
    region: optionalText(value.admin1),
    country: optionalText(value.country),
    latitude: value.latitude,
    longitude: value.longitude,
  };
}

/** Consulta JSON com timeout que inclui a leitura do corpo da resposta. */
export async function fetchWithTimeout(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new WeatherServiceError(
        'http',
        'Não foi possível consultar o serviço meteorológico.',
        undefined,
        response.status,
      );
    }
    try {
      return await response.json();
    } catch (cause) {
      if (controller.signal.aborted || (isRecord(cause) && cause.name === 'AbortError')) {
        throw cause;
      }
      throw new WeatherServiceError(
        isRecord(cause) && cause.name === 'SyntaxError' ? 'invalid-response' : 'network',
        isRecord(cause) && cause.name === 'SyntaxError'
          ? 'O serviço retornou uma resposta inválida.'
          : 'Falha de rede.',
        { cause },
      );
    }
  } catch (cause) {
    if (cause instanceof WeatherServiceError) throw cause;
    const aborted = controller.signal.aborted || (isRecord(cause) && cause.name === 'AbortError');
    throw new WeatherServiceError(
      aborted ? 'timeout' : 'network',
      aborted ? 'A requisição demorou demais.' : 'Falha de rede.',
      { cause },
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function searchCities(name: string): Promise<City[]> {
  const query = name.trim();
  if (query.length === 0) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=pt&format=json`;
  const payload = await fetchWithTimeout(url);
  if (!isRecord(payload)) throw invalidResponse();
  if (payload.results === undefined) return [];
  if (!Array.isArray(payload.results)) throw invalidResponse();
  return payload.results.slice(0, 10).map(mapCity);
}

function optionalNumber(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) throw invalidResponse();
  return value;
}

function condition(value: unknown) {
  const code = optionalNumber(value);
  if (code !== null && !Number.isInteger(code)) throw invalidResponse();
  return code === null ? null : getWeatherCondition(code);
}

function localDate(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw invalidResponse();
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw invalidResponse();
  }
  return value;
}

function observedAt(value: unknown, offset: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value) ||
    typeof offset !== 'number' ||
    !Number.isInteger(offset) ||
    Math.abs(offset) > 86400
  )
    throw invalidResponse();
  localDate(value.slice(0, 10));
  if (
    Number(value.slice(11, 13)) > 23 ||
    Number(value.slice(14, 16)) > 59 ||
    (value.length > 16 && Number(value.slice(17, 19)) > 59)
  )
    throw invalidResponse();
  return new Date(Date.parse(`${value}Z`) - offset * 1000).toISOString();
}

function validateUnits(
  data: Record<string, unknown>,
  units: unknown,
  expected: Record<string, string>,
) {
  if (!isRecord(units)) throw invalidResponse();
  for (const [key, unit] of Object.entries(expected)) {
    if (data[key] !== undefined && data[key] !== null && units[key] !== unit) {
      throw invalidResponse();
    }
  }
}

export async function getWeather(city: City): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation,pressure_msl',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
    timezone: 'auto',
    forecast_days: '5',
  });
  const payload = await fetchWithTimeout(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (
    !isRecord(payload) ||
    !isRecord(payload.current) ||
    !isRecord(payload.daily) ||
    typeof payload.timezone !== 'string' ||
    payload.timezone.length === 0
  )
    throw invalidResponse();
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: payload.timezone });
  } catch (cause) {
    throw new WeatherServiceError(
      'invalid-response',
      'O serviço retornou um fuso horário inválido.',
      { cause },
    );
  }
  const { current, daily } = payload;
  validateUnits(current, payload.current_units, {
    time: 'iso8601',
    temperature_2m: '°C',
    apparent_temperature: '°C',
    relative_humidity_2m: '%',
    wind_speed_10m: 'km/h',
    weather_code: 'wmo code',
    precipitation: 'mm',
    pressure_msl: 'hPa',
  });
  validateUnits(daily, payload.daily_units, {
    time: 'iso8601',
    weather_code: 'wmo code',
    temperature_2m_max: '°C',
    temperature_2m_min: '°C',
    precipitation_probability_max: '%',
  });
  if (!Array.isArray(daily.time) || daily.time.length < 5) throw invalidResponse();
  const dates = daily.time.map(localDate);
  for (let index = 1; index < dates.length; index++) {
    if (Date.parse(dates[index]) - Date.parse(dates[index - 1]) !== 86400000)
      throw invalidResponse();
  }
  for (const key of [
    'weather_code',
    'temperature_2m_max',
    'temperature_2m_min',
    'precipitation_probability_max',
  ]) {
    const series = daily[key];
    if (
      series !== undefined &&
      series !== null &&
      (!Array.isArray(series) || series.length !== dates.length)
    )
      throw invalidResponse();
  }
  function dailyValue(key: string, index: number): unknown {
    const series = daily[key];
    return Array.isArray(series) ? series[index] : null;
  }
  const days: ForecastDay[] = dates.slice(0, 5).map((date, index) => ({
    date,
    condition: condition(dailyValue('weather_code', index)),
    temperatureMinC: optionalNumber(dailyValue('temperature_2m_min', index)),
    temperatureMaxC: optionalNumber(dailyValue('temperature_2m_max', index)),
    precipitationProbabilityMaxPercent: optionalNumber(
      dailyValue('precipitation_probability_max', index),
    ),
  }));
  return {
    city,
    timeZone: payload.timezone,
    fetchedAt: new Date().toISOString(),
    current: {
      temperatureC: optionalNumber(current.temperature_2m),
      apparentTemperatureC: optionalNumber(current.apparent_temperature),
      condition: condition(current.weather_code),
      relativeHumidityPercent: optionalNumber(current.relative_humidity_2m),
      windSpeedKmh: optionalNumber(current.wind_speed_10m),
      precipitationMm: optionalNumber(current.precipitation),
      pressureMslHpa: optionalNumber(current.pressure_msl),
      observedAt: observedAt(current.time, payload.utc_offset_seconds),
    },
    days,
  };
}
