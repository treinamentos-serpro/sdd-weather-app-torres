import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('useWeather', () => {
  it('inicia idle sem rede e retry inicial não faz nada', async () => {
    const { result } = renderHook(() => useWeather());
    expect(result.current).toMatchObject({
      status: 'idle',
      data: null,
      cities: [],
      query: '',
      error: null,
    });
    await act(() => result.current.retry());
    expect(searchCities).not.toHaveBeenCalled();
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('busca com trim, expõe loading e carrega a primeira cidade', async () => {
    const pending = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValue(pending.promise);
    const { result } = renderHook(() => useWeather(), { wrapper: StrictMode });
    let task: Promise<void>;
    act(() => {
      task = result.current.search(' São Paulo ');
    });
    expect(result.current).toMatchObject({ status: 'loading', query: 'São Paulo', error: null });
    await act(async () => {
      pending.resolve([city, otherCity]);
      await task;
    });
    expect(searchCities).toHaveBeenCalledExactlyOnceWith('São Paulo');
    expect(getWeather).toHaveBeenCalledExactlyOnceWith(city);
    expect(result.current).toMatchObject({
      status: 'success',
      cities: [city, otherCity],
      data: mockWeatherData,
    });
  });

  it('encerra vazio sem consultar forecast', async () => {
    vi.mocked(searchCities).mockResolvedValue([]);
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('Inexistente'));
    expect(result.current).toMatchObject({ status: 'empty', data: null, cities: [], error: null });
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
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('A busca deve conter de 3 a 100 caracteres.');
    expect(searchCities).not.toHaveBeenCalled();
    expect(getWeather).not.toHaveBeenCalled();
  });

  it.each(['abc', 'x'.repeat(100)])('aceita tamanho limite %s', async (query) => {
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search(query));
    expect(result.current.status).toBe('success');
  });

  it('seleciona outra cidade, limpa dados durante loading e retry refaz apenas seleção', async () => {
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    const pending = deferred<WeatherData>();
    vi.mocked(getWeather).mockReturnValueOnce(pending.promise);
    let task: Promise<void>;
    act(() => {
      task = result.current.selectCity(otherCity);
    });
    expect(result.current).toMatchObject({
      status: 'loading',
      data: null,
      cities: [city, otherCity],
    });
    await act(async () => {
      pending.reject(new WeatherServiceError('network', 'Falha de rede.'));
      await task;
    });
    expect(result.current).toMatchObject({ status: 'error', error: 'Falha de rede.', data: null });
    vi.mocked(getWeather).mockResolvedValue(otherData);
    await act(() => result.current.retry());
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenLastCalledWith(otherCity);
    expect(result.current).toMatchObject({ status: 'success', data: otherData, error: null });
  });

  it.each([
    'geocoding',
    'forecast',
  ])('retry repete a busca completa após falha em %s', async (stage) => {
    const failure = new WeatherServiceError('http', 'Serviço indisponível.');
    if (stage === 'geocoding') vi.mocked(searchCities).mockRejectedValueOnce(failure);
    else vi.mocked(getWeather).mockRejectedValueOnce(failure);
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    expect(result.current).toMatchObject({
      status: 'error',
      error: failure.messagePtBr,
      data: null,
    });
    await act(() => result.current.retry());
    expect(searchCities).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({ status: 'success', data: mockWeatherData, error: null });
  });

  it('ignora busca antiga antes de iniciar forecast e não substitui a ação de retry', async () => {
    const pending = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(pending.promise).mockResolvedValue([otherCity]);
    vi.mocked(getWeather).mockResolvedValue(otherData);
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
    expect(result.current.data).toBe(otherData);
    expect(getWeather).toHaveBeenCalledExactlyOnceWith(otherCity);
    await act(() => result.current.retry());
    expect(searchCities).toHaveBeenLastCalledWith('Recife');
  });

  it.each(['resolve', 'reject'])('ignora forecast antigo que termina por %s', async (outcome) => {
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
      else pending.reject(new Error('Erro antigo'));
      await old;
    });
    expect(result.current).toMatchObject({ status: 'success', data: otherData, error: null });
  });

  it('não inicia forecast depois de desmontar nem executa ações retidas', async () => {
    const pending = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValue(pending.promise);
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
