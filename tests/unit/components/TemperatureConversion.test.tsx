import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import CurrentWeather from '../../../src/components/CurrentWeather';
import UnitToggle from '../../../src/components/UnitToggle';
import { mockWeatherData } from '../../../src/mocks/weatherData';
import type { Unit } from '../../../src/types/weather';

function TemperatureView() {
  const [unit, setUnit] = useState<Unit>('celsius');
  return (
    <>
      <UnitToggle unit={unit} onChange={setUnit} />
      <CurrentWeather
        city={mockWeatherData.city}
        current={{
          ...mockWeatherData.current,
          temperatureC: 0,
          apparentTemperatureC: null,
          precipitationMm: null,
        }}
        unit={unit}
      />
    </>
  );
}

describe('conversão integrada de unidade', () => {
  it('converte 0 °C em 32 °F ao clicar e retorna sem acumular erro ou converter ausências', async () => {
    const user = userEvent.setup();
    render(<TemperatureView />);
    const weather = within(screen.getByRole('region', { name: 'São Paulo' }));
    expect(weather.getByText('0,0 °C', { exact: true })).toBeInTheDocument();

    for (let attempt = 0; attempt < 3; attempt++) {
      await user.click(screen.getByRole('button', { name: '°F' }));
      expect(weather.getByText('32,0 °F', { exact: true })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '°F', pressed: true })).toBeInTheDocument();
      expect(weather.getByText('Sensação térmica: Indisponível')).toBeInTheDocument();
      expect(weather.getByText('Indisponível', { exact: true })).toBeInTheDocument();
      expect(weather.getByText('65 %')).toBeInTheDocument();
      expect(weather.getByText('12,6 km/h')).toBeInTheDocument();
      expect(weather.queryByText('0 mm')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '°C' }));
      expect(weather.getByText('0,0 °C', { exact: true })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '°C', pressed: true })).toBeInTheDocument();
    }
  });
});
