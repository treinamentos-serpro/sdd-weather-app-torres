export type TemperatureUnit = 'celsius' | 'fahrenheit';

export interface City {
  id: string;
  name: string;
  region: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

export interface WeatherCondition {
  code: number;
  labelPtBr: string;
}

export interface CurrentWeather {
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  condition: WeatherCondition | null;
  relativeHumidityPercent: number | null;
  windSpeedKmh: number | null;
  precipitationMm: number | null;
  pressureMslHpa: number | null;
  /** Instante ISO-8601 da observação informado pela fonte. */
  observedAt: string | null;
}

export interface DailyForecast {
  /** Data YYYY-MM-DD no fuso da cidade. */
  date: string;
  condition: WeatherCondition | null;
  temperatureMinC: number | null;
  temperatureMaxC: number | null;
  precipitationProbabilityMaxPercent: number | null;
}

export interface WeatherReport {
  city: City;
  timeZone: string;
  /** Instante ISO-8601 de recebimento da resposta válida. */
  fetchedAt: string;
  current: CurrentWeather;
  /** Até cinco dias; a fonte pode fornecer cobertura parcial. */
  days: DailyForecast[];
}

export type Unit = TemperatureUnit;
export type ForecastDay = DailyForecast;
export type WeatherData = WeatherReport;

export type RequestErrorCode = 'network' | 'timeout' | 'http' | 'invalid-response';

export interface RequestError {
  code: RequestErrorCode;
  messagePtBr: string;
}

export interface OpenMeteoClient {
  searchCities(query: string, signal?: AbortSignal): Promise<City[]>;
  getWeather(city: City, signal?: AbortSignal): Promise<WeatherReport>;
}
