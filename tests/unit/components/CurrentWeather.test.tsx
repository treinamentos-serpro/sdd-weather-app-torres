import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CurrentWeather from '../../../src/components/CurrentWeather';
import { getWeatherIcon } from '../../../src/lib/weatherCodes';
import { mockWeatherData } from '../../../src/mocks/weatherData';

const { city, current } = mockWeatherData;

describe('CurrentWeather', () => {
  it('mostra cidade, condição, ícone decorativo e métricas com unidades', () => {
    render(<CurrentWeather city={city} current={current} unit="celsius" />);

    expect(screen.getByRole('region', { name: city.name })).toBeInTheDocument();
    expect(screen.getByText('São Paulo, Brasil')).toBeInTheDocument();
    expect(screen.getByText('25,4 °C')).toBeInTheDocument();
    expect(screen.getByText('Parcialmente nublado')).toBeInTheDocument();
    expect(screen.getByText(getWeatherIcon(2))).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Sensação térmica: 26,1 °C')).toBeInTheDocument();
    expect(screen.getByText('65 %')).toBeInTheDocument();
    expect(screen.getByText('12,6 km/h')).toBeInTheDocument();
    expect(screen.getByText('0 mm')).toBeInTheDocument();
    expect(screen.getByText('1.015,2 hPa')).toBeInTheDocument();
    expect(screen.getByText('Pressão ao nível do mar')).toBeInTheDocument();
  });

  it('converte só temperaturas ao mudar a unidade e não altera os dados', () => {
    const { rerender } = render(<CurrentWeather city={city} current={current} unit="celsius" />);
    rerender(<CurrentWeather city={city} current={current} unit="fahrenheit" />);

    expect(screen.getByText('77,7 °F')).toBeInTheDocument();
    expect(screen.getByText('Sensação térmica: 79,0 °F')).toBeInTheDocument();
    expect(screen.getByText('65 %')).toBeInTheDocument();
    expect(screen.getByText('12,6 km/h')).toBeInTheDocument();
    expect(screen.getByText('0 mm')).toBeInTheDocument();
    expect(screen.getByText('1.015,2 hPa')).toBeInTheDocument();
    expect(current.temperatureC).toBe(25.4);

    rerender(<CurrentWeather city={city} current={current} unit="celsius" />);
    expect(screen.getByText('25,4 °C')).toBeInTheDocument();
  });

  it('identifica campos ausentes sem inventar valores ou localidade', () => {
    render(
      <CurrentWeather
        city={{ ...city, region: null, country: null }}
        current={{
          temperatureC: null,
          apparentTemperatureC: null,
          condition: null,
          relativeHumidityPercent: null,
          windSpeedKmh: null,
          precipitationMm: null,
          pressureMslHpa: null,
          observedAt: null,
        }}
        unit="celsius"
      />,
    );

    expect(screen.getAllByText('Indisponível')).toHaveLength(6);
    expect(screen.getByText('Sensação térmica: Indisponível')).toBeInTheDocument();
    expect(screen.queryByText('São Paulo, Brasil')).not.toBeInTheDocument();
    expect(screen.queryByText('0 mm')).not.toBeInTheDocument();
  });

  it('preserva zero em todas as métricas e usa ícone neutro para código desconhecido', () => {
    render(
      <CurrentWeather
        city={city}
        current={{
          ...current,
          temperatureC: 0,
          apparentTemperatureC: 0,
          relativeHumidityPercent: 0,
          windSpeedKmh: 0,
          precipitationMm: 0,
          pressureMslHpa: 0,
          condition: { code: 999, labelPtBr: 'Condição desconhecida' },
        }}
        unit="celsius"
      />,
    );

    for (const text of ['0,0 °C', '0 %', '0 km/h', '0 mm', '0 hPa', 'Condição desconhecida']) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
    expect(screen.getByText('—')).toHaveAttribute('aria-hidden', 'true');
  });
});
