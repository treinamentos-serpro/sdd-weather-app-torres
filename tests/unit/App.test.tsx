import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { mockWeatherData } from '../../src/mocks/weatherData';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { WeatherData } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/weatherService')>();
  return { ...actual, searchCities: vi.fn(), getWeather: vi.fn() };
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(searchCities).mockResolvedValue([mockWeatherData.city]);
  vi.mocked(getWeather).mockResolvedValue(mockWeatherData);
});

describe('App integrado', () => {
  it('inicia idle sem rede nem controles de demonstração', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: 'Consulte o clima de uma cidade' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Estado de demonstração' })).not.toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(searchCities).not.toHaveBeenCalled();
  });

  it('busca dados, mantém foco, troca unidade e não refaz requests para conversão', async () => {
    const user = userEvent.setup();
    let resolve!: (value: WeatherData) => void;
    vi.mocked(getWeather).mockReturnValue(
      new Promise((res) => {
        resolve = res;
      }),
    );
    render(<App />);
    await user.type(screen.getByRole('searchbox'), ' São Paulo {Enter}');
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(screen.getByRole('region', { name: 'Resultados da consulta' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: '°F' }));
    await act(async () => resolve(mockWeatherData));
    expect(screen.getByText('77,7 °F')).toBeInTheDocument();
    expect(screen.getByText('81,5 °F')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(5);
    await user.click(screen.getByRole('button', { name: '°C' }));
    expect(screen.getByText('25,4 °C')).toBeInTheDocument();
    expect(searchCities).toHaveBeenCalledExactlyOnceWith('São Paulo');
    expect(getWeather).toHaveBeenCalledExactlyOnceWith(mockWeatherData.city);
  });

  it('mostra empty sem forecast e permite nova busca', async () => {
    const user = userEvent.setup();
    vi.mocked(searchCities).mockResolvedValueOnce([]);
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'Inexistente{Enter}');
    expect(
      await screen.findByRole('heading', { name: 'Nenhum resultado encontrado' }),
    ).toBeInTheDocument();
    expect(getWeather).not.toHaveBeenCalled();
    expect(screen.getByRole('searchbox')).toBeEnabled();
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    expect(await screen.findByText('25,4 °C')).toBeInTheDocument();
  });

  it.each([
    'search',
    'forecast',
  ])('exibe erro de %s e liga retry à última operação', async (stage) => {
    const user = userEvent.setup();
    const error = new WeatherServiceError('network', 'Falha de rede.');
    if (stage === 'search') vi.mocked(searchCities).mockRejectedValueOnce(error);
    else vi.mocked(getWeather).mockRejectedValueOnce(error);
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha de rede.');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('25,4 °C')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Resultados da consulta' })).toHaveFocus();
    expect(searchCities).toHaveBeenCalledTimes(2);
  });
});
