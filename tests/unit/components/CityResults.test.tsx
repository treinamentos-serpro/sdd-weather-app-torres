import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CityResults from '../../../src/components/CityResults';
import { mockWeatherData } from '../../../src/mocks/weatherData';

describe('CityResults', () => {
  it('limita dez opções na ordem e distingue homônimos pelas coordenadas', async () => {
    const cities = Array.from({ length: 12 }, (_, index) => ({
      ...mockWeatherData.city,
      id: String(index),
      latitude: index,
      longitude: index + 10,
    }));
    const onSelect = vi.fn();
    render(<CityResults cities={cities} onSelect={onSelect} disabled={false} />);
    const buttons = within(
      screen.getByRole('region', { name: 'Selecione uma cidade' }),
    ).getAllByRole('button');
    expect(buttons).toHaveLength(10);
    expect(buttons[0]).toHaveTextContent('São Paulo, São Paulo, Brasil (0, 10)');
    await userEvent.setup().click(buttons[1]);
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(cities[1]);
  });

  it('seleciona por teclado com rótulo sem campos nulos', async () => {
    const city = { ...mockWeatherData.city, region: null, country: null };
    const onSelect = vi.fn();
    render(<CityResults cities={[city]} onSelect={onSelect} disabled={false} />);
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole('button', { name: 'São Paulo' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(city);
  });
});
