import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchWithTimeout, WeatherServiceError } from '../../../src/services/weatherService';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('fetchWithTimeout', () => {
  it('aborta apenas após 10 s e limpa o timer no finally', async () => {
    let requestSignal: AbortSignal | null | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn((_url, { signal }: RequestInit) => {
        requestSignal = signal;
        return new Promise((_resolve, reject) => {
          signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        });
      }),
    );
    const clear = vi.spyOn(globalThis, 'clearTimeout');
    const assertion = expect(fetchWithTimeout('/test')).rejects.toMatchObject({
      code: 'timeout',
      message:
        'A consulta excedeu o tempo limite de 10 segundos. Verifique sua conexão e tente novamente.',
      messagePtBr:
        'A consulta excedeu o tempo limite de 10 segundos. Verifique sua conexão e tente novamente.',
    });
    await vi.advanceTimersByTimeAsync(9999);
    expect(requestSignal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await assertion;
    expect(requestSignal?.aborted).toBe(true);
    expect(clear).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    [
      'abort',
      new DOMException('Aborted', 'AbortError'),
      'timeout',
      'A consulta excedeu o tempo limite de 10 segundos. Verifique sua conexão e tente novamente.',
    ],
    [
      'network',
      new TypeError('Offline'),
      'network',
      'Não foi possível conectar ao serviço meteorológico. Verifique sua conexão e tente novamente.',
    ],
  ])('normaliza %s preservando causa e limpando timer', async (_label, cause, code, message) => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(cause));
    const error = await fetchWithTimeout('/test').catch((value: unknown) => value);
    expect(error).toBeInstanceOf(WeatherServiceError);
    expect(error).toMatchObject({ code, message, messagePtBr: message, cause });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('retorna JSON e limpa o timer sem abortar uma consulta concluída', async () => {
    let requestSignal: AbortSignal | null | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn((_url, { signal }: RequestInit) => {
        requestSignal = signal;
        return Promise.resolve(new Response('{"ok":true}'));
      }),
    );
    await expect(fetchWithTimeout('/test')).resolves.toEqual({ ok: true });
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(requestSignal?.aborted).toBe(false);
  });

  it.each([
    [new Response('{}', { status: 503 }), 'http'],
    [new Response('{'), 'invalid-response'],
    [{ ok: true, json: () => Promise.reject(new TypeError('Conexão interrompida')) }, 'network'],
  ])('limpa timer em falha HTTP/JSON/leitura', async (response, code) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    await expect(fetchWithTimeout('/test')).rejects.toMatchObject({ code });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('mantém o timeout ativo enquanto lê o corpo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url, { signal }: RequestInit) =>
        Promise.resolve({
          ok: true,
          json: () =>
            new Promise((_resolve, reject) => {
              signal?.addEventListener('abort', () =>
                reject(new DOMException('Aborted', 'AbortError')),
              );
            }),
        }),
      ),
    );
    const assertion = expect(fetchWithTimeout('/test')).rejects.toMatchObject({
      code: 'timeout',
      message:
        'A consulta excedeu o tempo limite de 10 segundos. Verifique sua conexão e tente novamente.',
    });
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });
});
