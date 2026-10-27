import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchCities, WeatherServiceError } from '../../../src/services/weatherService';

const city = {
  id: 3448439,
  name: 'São Paulo',
  admin1: 'São Paulo',
  country: 'Brasil',
  latitude: -23.5475,
  longitude: -46.6361,
};

function mockResponse(payload: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('searchCities', () => {
  it.each(['', '   ', '\t\n'])('retorna vazio sem rede para %j', async (query) => {
    const fetchMock = mockResponse({});
    await expect(searchCities(query)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('codifica o nome com trim, usa parâmetros e mapeia City', async () => {
    const fetchMock = mockResponse({ results: [city] });
    await expect(searchCities(' São Paulo & região ')).resolves.toEqual([
      {
        id: '3448439',
        name: 'São Paulo',
        region: 'São Paulo',
        country: 'Brasil',
        latitude: -23.5475,
        longitude: -46.6361,
      },
    ]);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      'https://geocoding-api.open-meteo.com/v1/search?name=S%C3%A3o%20Paulo%20%26%20regi%C3%A3o&count=10&language=pt&format=json',
      { signal: expect.any(AbortSignal) },
    );
  });

  it('normaliza campos ausentes, ID por coordenadas e preserva zero', async () => {
    mockResponse({ results: [{ name: 'Exemplo', latitude: 0, longitude: 0 }] });
    await expect(searchCities('Exemplo')).resolves.toEqual([
      {
        id: '0,0',
        name: 'Exemplo',
        latitude: 0,
        longitude: 0,
        region: null,
        country: null,
      },
    ]);
  });

  it.each([
    {},
    { results: [] },
  ])('retorna lista vazia quando não há resultados', async (payload) => {
    mockResponse(payload);
    await expect(searchCities('Recife')).resolves.toEqual([]);
  });

  it('preserva a ordem e limita a dez resultados', async () => {
    mockResponse({ results: Array.from({ length: 12 }, (_, id) => ({ ...city, id })) });
    const cities = await searchCities('São Paulo');
    expect(cities.map((result) => result.id)).toEqual(
      Array.from({ length: 10 }, (_, id) => String(id)),
    );
  });

  it('lança WeatherServiceError HTTP com status sem tentar ler o JSON', async () => {
    const json = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503, json }));
    const error = await searchCities('Recife').catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(WeatherServiceError);
    expect(error).toMatchObject({ name: 'WeatherServiceError', code: 'http', status: 503 });
    expect(json).not.toHaveBeenCalled();
  });

  it('encapsula falha de rede preservando a causa', async () => {
    const cause = new TypeError('Offline');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(cause));
    await expect(searchCities('Recife')).rejects.toMatchObject({ code: 'network', cause });
  });

  it.each([
    null,
    [],
    { results: null },
    { results: {} },
    { results: [{}] },
    { results: [{ ...city, latitude: 91 }] },
    { results: [{ ...city, country: 123 }] },
  ])('rejeita payload incompatível %j', async (payload) => {
    mockResponse(payload);
    await expect(searchCities('Recife')).rejects.toMatchObject({ code: 'invalid-response' });
  });

  it('rejeita JSON inválido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.resolve(new Response('{'))),
    );
    await expect(searchCities('Recife')).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(searchCities('Recife')).rejects.toMatchObject({ code: 'invalid-response' });
  });

  it('configura timeout de 10 segundos e identifica sua falha', async () => {
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
    const assertion = expect(searchCities('Recife')).rejects.toMatchObject({
      code: 'timeout',
      message:
        'A consulta excedeu o tempo limite de 10 segundos. Verifique sua conexão e tente novamente.',
    });
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });
});
