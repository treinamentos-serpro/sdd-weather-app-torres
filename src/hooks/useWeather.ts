import { useCallback, useEffect, useRef, useState } from 'react';
import { validateCityQuery } from '../lib/search';
import { getWeather, searchCities, WeatherServiceError } from '../services/weatherService';
import type { City, WeatherData } from '../types/weather';

type WeatherStatus = 'idle' | 'loading' | 'choosing' | 'success' | 'error' | 'empty';
type Operation = { type: 'search'; name: string } | { type: 'select' | 'refresh'; city: City };

interface WeatherState {
  status: WeatherStatus;
  data: WeatherData | null;
  cities: City[];
  error: string | null;
  query: string;
  selectedCity: City | null;
}

export default function useWeather() {
  const [state, setState] = useState<WeatherState>({
    status: 'idle',
    data: null,
    cities: [],
    error: null,
    query: '',
    selectedCity: null,
  });
  const requestId = useRef(0);
  const mounted = useRef(true);
  const lastOperation = useRef<Operation | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestId.current++;
    };
  }, []);

  const execute = useCallback(async (operation: Operation): Promise<void> => {
    if (!mounted.current) return;
    const id = ++requestId.current;
    lastOperation.current = operation;
    const isCurrent = () => mounted.current && requestId.current === id;

    if (operation.type === 'search' && validateCityQuery(operation.name)) {
      setState({
        status: 'error',
        data: null,
        cities: [],
        error: 'A busca deve conter de 3 a 100 caracteres.',
        query: operation.name,
        selectedCity: null,
      });
      return;
    }

    setState((previous) => ({
      ...previous,
      status: 'loading',
      data: operation.type === 'refresh' ? previous.data : null,
      error: null,
      cities: operation.type === 'search' ? [] : previous.cities,
      query: operation.type === 'search' ? operation.name : previous.query,
      selectedCity: operation.type === 'search' ? null : operation.city,
    }));

    try {
      if (operation.type === 'search') {
        const cities = await searchCities(operation.name);
        if (!isCurrent()) return;
        setState((previous) => ({
          ...previous,
          cities: cities.slice(0, 10),
          status: cities.length === 0 ? 'empty' : 'choosing',
        }));
        return;
      }
      const data = await getWeather(operation.city);
      if (!isCurrent()) return;
      setState((previous) => ({ ...previous, status: 'success', data }));
    } catch (cause) {
      if (!isCurrent()) return;
      const error =
        cause instanceof WeatherServiceError
          ? cause.messagePtBr
          : 'Ocorreu um erro inesperado ao consultar o clima. Tente novamente.';
      setState((previous) => ({
        ...previous,
        status: 'error',
        data: operation.type === 'refresh' ? previous.data : null,
        error,
      }));
    }
  }, []);

  const search = useCallback(
    (name: string) => execute({ type: 'search', name: name.trim() }),
    [execute],
  );
  const selectCity = useCallback((city: City) => execute({ type: 'select', city }), [execute]);
  const retry = useCallback(async () => {
    if (lastOperation.current) await execute(lastOperation.current);
  }, [execute]);
  const refresh = useCallback(async () => {
    if (state.selectedCity) await execute({ type: 'refresh', city: state.selectedCity });
  }, [execute, state.selectedCity]);

  return { ...state, search, selectCity, retry, refresh };
}
