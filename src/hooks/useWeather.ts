import { useCallback, useEffect, useRef, useState } from 'react';
import { getWeather, searchCities, WeatherServiceError } from '../services/weatherService';
import type { City, WeatherData } from '../types/weather';

type WeatherStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';
type Operation = { type: 'search'; name: string } | { type: 'select'; city: City };

interface WeatherState {
  status: WeatherStatus;
  data: WeatherData | null;
  cities: City[];
  error: string | null;
  query: string;
}

export default function useWeather() {
  const [state, setState] = useState<WeatherState>({
    status: 'idle',
    data: null,
    cities: [],
    error: null,
    query: '',
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

    if (operation.type === 'search' && (operation.name.length < 3 || operation.name.length > 100)) {
      setState({
        status: 'error',
        data: null,
        cities: [],
        error: 'A busca deve conter de 3 a 100 caracteres.',
        query: operation.name,
      });
      return;
    }

    setState((previous) => ({
      ...previous,
      status: 'loading',
      data: null,
      error: null,
      cities: operation.type === 'search' ? [] : previous.cities,
      query: operation.type === 'search' ? operation.name : previous.query,
    }));

    try {
      let city: City;
      if (operation.type === 'search') {
        const cities = await searchCities(operation.name);
        if (!isCurrent()) return;
        setState((previous) => ({ ...previous, cities }));
        const firstCity = cities[0];
        if (!firstCity) {
          setState((previous) => ({ ...previous, status: 'empty' }));
          return;
        }
        city = firstCity;
      } else {
        city = operation.city;
      }
      const data = await getWeather(city);
      if (!isCurrent()) return;
      setState((previous) => ({ ...previous, status: 'success', data }));
    } catch (cause) {
      if (!isCurrent()) return;
      const error =
        cause instanceof WeatherServiceError
          ? cause.messagePtBr
          : cause instanceof Error
            ? cause.message
            : 'Não foi possível consultar o clima.';
      setState((previous) => ({ ...previous, status: 'error', data: null, error }));
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

  return { ...state, search, selectCity, retry };
}
