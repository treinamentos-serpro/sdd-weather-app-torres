import type { WeatherCondition } from '../types/weather';

interface WeatherCodeDescription {
  labelPtBr: string;
  icon: string;
}

const weatherCodes: Partial<Record<number, WeatherCodeDescription>> = {
  0: { labelPtBr: 'Céu limpo', icon: '☀️' },
  1: { labelPtBr: 'Predominantemente limpo', icon: '🌤️' },
  2: { labelPtBr: 'Parcialmente nublado', icon: '⛅' },
  3: { labelPtBr: 'Encoberto', icon: '☁️' },
  45: { labelPtBr: 'Nevoeiro', icon: '🌫️' },
  48: { labelPtBr: 'Nevoeiro com geada', icon: '🌫️' },
  51: { labelPtBr: 'Garoa fraca', icon: '🌦️' },
  53: { labelPtBr: 'Garoa moderada', icon: '🌦️' },
  55: { labelPtBr: 'Garoa intensa', icon: '🌦️' },
  56: { labelPtBr: 'Garoa congelante fraca', icon: '🌨️' },
  57: { labelPtBr: 'Garoa congelante intensa', icon: '🌨️' },
  61: { labelPtBr: 'Chuva fraca', icon: '🌧️' },
  63: { labelPtBr: 'Chuva moderada', icon: '🌧️' },
  65: { labelPtBr: 'Chuva forte', icon: '🌧️' },
  66: { labelPtBr: 'Chuva congelante fraca', icon: '🌨️' },
  67: { labelPtBr: 'Chuva congelante forte', icon: '🌨️' },
  71: { labelPtBr: 'Neve fraca', icon: '❄️' },
  73: { labelPtBr: 'Neve moderada', icon: '❄️' },
  75: { labelPtBr: 'Neve forte', icon: '❄️' },
  77: { labelPtBr: 'Grãos de neve', icon: '❄️' },
  80: { labelPtBr: 'Pancadas de chuva fracas', icon: '🌦️' },
  81: { labelPtBr: 'Pancadas de chuva moderadas', icon: '🌦️' },
  82: { labelPtBr: 'Pancadas de chuva violentas', icon: '🌧️' },
  85: { labelPtBr: 'Pancadas de neve fracas', icon: '🌨️' },
  86: { labelPtBr: 'Pancadas de neve fortes', icon: '🌨️' },
  95: { labelPtBr: 'Trovoadas', icon: '⛈️' },
  96: { labelPtBr: 'Trovoadas com granizo fraco', icon: '⛈️' },
  99: { labelPtBr: 'Trovoadas com granizo forte', icon: '⛈️' },
};

export function getWeatherCondition(code: number): WeatherCondition {
  return { code, labelPtBr: weatherCodes[code]?.labelPtBr ?? 'Condição desconhecida' };
}

export function getWeatherIcon(code: number | null): string {
  return code === null ? '—' : (weatherCodes[code]?.icon ?? '—');
}
