import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useWeather from '../../../src/hooks/useWeather';
import { mockWeatherData } from '../../../src/mocks/weatherData';
import {
  getWeather,
  searchCities,
  WeatherServiceError,
} from '../../../src/services/weatherService';
import type { City, WeatherData } from '../../../src/types/weather';

vi.mock('../../../src/services/weatherService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/services/weatherService')>();
  return { ...actual, searchCities: vi.fn(), getWeather: vi.fn() };
});

const city = mockWeatherData.city;
const otherCity: City = {
  ...city,
  id: 'recife',
  name: 'Recife',
  latitude: -8.05,
  longitude: -34.9,
};
const otherData: WeatherData = { ...mockWeatherData, city: otherCity };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(searchCities).mockResolvedValue([city, otherCity]);
  vi.mocked(getWeather).mockResolvedValue(mockWeatherData);
});
afterEach(() => vi.useRealTimers());

describe('useWeather', () => {
  it('inicia sem rede e retry/refresh sem operação não consultam', async () => {
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.retry());
    await act(() => result.current.refresh());
    expect(result.current.status).toBe('idle');
    expect(searchCities).not.toHaveBeenCalled();
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('busca com trim, expõe loading e aguarda seleção explícita em StrictMode', async () => {
    const pending = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useWeather(), { wrapper: StrictMode });
    let task: Promise<void>;
    act(() => {
      task = result.current.search(' São Paulo ');
    });
    expect(result.current.status).toBe('loading');
    await act(async () => {
      pending.resolve([city, otherCity]);
      await task;
    });
    expect(result.current).toMatchObject({
      status: 'choosing',
      cities: [city, otherCity],
      data: null,
      selectedCity: null,
    });
    expect(searchCities).toHaveBeenCalledExactlyOnceWith('São Paulo');
    expect(getWeather).not.toHaveBeenCalled();
    await act(() => result.current.selectCity(otherCity));
    expect(getWeather).toHaveBeenCalledExactlyOnceWith(otherCity);
  });

  it('limita dez cidades na ordem recebida', async () => {
    const cities = Array.from({ length: 12 }, (_, index) => ({ ...city, id: String(index) }));
    vi.mocked(searchCities).mockResolvedValue(cities);
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    expect(result.current.cities).toEqual(cities.slice(0, 10));
  });

  it('encerra vazio sem forecast', async () => {
    vi.mocked(searchCities).mockResolvedValue([]);
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('Inexistente'));
    expect(result.current).toMatchObject({ status: 'empty', data: null, cities: [] });
    expect(getWeather).not.toHaveBeenCalled();
  });

  it.each([
    '',
    '   ',
    'ab',
    'x'.repeat(101),
  ])('rejeita consulta inválida sem rede %j', async (query) => {
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search(query));
    expect(result.current.error).toBe('A busca deve conter de 3 a 100 caracteres.');
    expect(searchCities).not.toHaveBeenCalled();
  });

  it.each(['abc', 'x'.repeat(100)])('aceita tamanho limite %s', async (query) => {
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search(query));
    expect(result.current.status).toBe('choosing');
  });

  it('retry de geocoding repete a consulta, sem selecionar automaticamente', async () => {
    vi.mocked(searchCities).mockRejectedValueOnce(
      new WeatherServiceError('network', 'Verifique sua conexão.'),
    );
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    expect(result.current.status).toBe('error');
    await act(() => result.current.retry());
    expect(searchCities).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('choosing');
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('retry após falha do forecast preserva cidade e não repete geocoding', async () => {
    vi.mocked(getWeather).mockRejectedValueOnce(
      new WeatherServiceError('network', 'Verifique sua conexão.'),
    );
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    await act(() => result.current.selectCity(otherCity));
    expect(result.current).toMatchObject({ status: 'error', selectedCity: otherCity, data: null });
    vi.mocked(getWeather).mockResolvedValue(otherData);
    await act(() => result.current.retry());
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenLastCalledWith(otherCity);
    expect(result.current).toMatchObject({ status: 'success', data: otherData, error: null });
  });

  it('refresh preserva relatório/timestamp em memória na falha e retry atualiza só forecast', async () => {
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.selectCity(city));
    vi.mocked(getWeather).mockRejectedValueOnce(new Error('Failed to fetch'));
    await act(() => result.current.refresh());
    expect(result.current).toMatchObject({
      status: 'error',
      data: mockWeatherData,
      selectedCity: city,
      error: 'Ocorreu um erro inesperado ao consultar o clima. Tente novamente.',
    });
    const updated = { ...mockWeatherData, fetchedAt: '2026-10-27T15:10:00Z' };
    vi.mocked(getWeather).mockResolvedValue(updated);
    await act(() => result.current.retry());
    expect(result.current).toMatchObject({ status: 'success', data: updated });
    expect(searchCities).not.toHaveBeenCalled();
  });

  it('ignora busca obsoleta e retry conserva a operação mais recente', async () => {
    const pending = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(pending.promise).mockResolvedValue([otherCity]);
    const { result } = renderHook(() => useWeather());
    let old: Promise<void>;
    act(() => {
      old = result.current.search('São Paulo');
    });
    await act(() => result.current.search('Recife'));
    await act(async () => {
      pending.resolve([city]);
      await old;
    });
    expect(result.current.cities).toEqual([otherCity]);
    await act(() => result.current.retry());
    expect(searchCities).toHaveBeenLastCalledWith('Recife');
    expect(getWeather).not.toHaveBeenCalled();
  });

  it.each(['resolve', 'reject'])('ignora forecast obsoleto que termina com %s', async (outcome) => {
    const pending = deferred<WeatherData>();
    vi.mocked(getWeather).mockReturnValueOnce(pending.promise).mockResolvedValue(otherData);
    const { result } = renderHook(() => useWeather());
    let old: Promise<void>;
    act(() => {
      old = result.current.selectCity(city);
    });
    await act(() => result.current.selectCity(otherCity));
    await act(async () => {
      if (outcome === 'resolve') pending.resolve(mockWeatherData);
      else pending.reject(new Error('antigo'));
      await old;
    });
    expect(result.current.data).toBe(otherData);
  });

  it('não atualiza automaticamente após cinco minutos', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.selectCity(city));
    await act(() => vi.advanceTimersByTimeAsync(300_000));
    expect(getWeather).toHaveBeenCalledTimes(1);
  });

  it('não executa ações retidas depois de desmontar', async () => {
    const pending = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(pending.promise);
    const { result, unmount } = renderHook(() => useWeather());
    let task: Promise<void>;
    act(() => {
      task = result.current.search('São Paulo');
    });
    const retry = result.current.retry;
    unmount();
    await act(async () => {
      pending.resolve([city]);
      await task;
      await retry();
    });
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getWeather).not.toHaveBeenCalled();
  });
});
