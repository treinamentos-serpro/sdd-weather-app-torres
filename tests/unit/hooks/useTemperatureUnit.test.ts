import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useTemperatureUnit from '../../../src/hooks/useTemperatureUnit';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('useTemperatureUnit', () => {
  it('inicia Celsius sem preferência ou com valor corrompido', () => {
    const first = renderHook(() => useTemperatureUnit());
    expect(first.result.current.unit).toBe('celsius');
    first.unmount();
    localStorage.setItem('weather-unit', 'kelvin');
    const second = renderHook(() => useTemperatureUnit());
    expect(second.result.current.unit).toBe('celsius');
  });

  it('restaura Fahrenheit e persiste apenas a unidade ao trocar e remontar', () => {
    const { result, unmount } = renderHook(() => useTemperatureUnit());
    act(() => result.current.changeUnit('fahrenheit'));
    expect(localStorage.getItem('weather-unit')).toBe('fahrenheit');
    expect(localStorage.length).toBe(1);
    unmount();
    expect(renderHook(() => useTemperatureUnit()).result.current.unit).toBe('fahrenheit');
  });

  it('informa erro de leitura sem impedir Celsius', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Bloqueado', 'SecurityError');
    });
    const { result } = renderHook(() => useTemperatureUnit());
    expect(result.current.unit).toBe('celsius');
    expect(result.current.error).toContain('Não foi possível ler');
  });

  it('informa erro de escrita mantendo a unidade na sessão', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Bloqueado', 'QuotaExceededError');
    });
    const { result } = renderHook(() => useTemperatureUnit());
    act(() => result.current.changeUnit('fahrenheit'));
    expect(result.current.unit).toBe('fahrenheit');
    expect(result.current.error).toContain('Não foi possível salvar');
  });
});
