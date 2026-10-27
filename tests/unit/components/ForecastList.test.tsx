import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ForecastCard from '../../../src/components/ForecastCard';
import ForecastList from '../../../src/components/ForecastList';
import { mockWeatherData } from '../../../src/mocks/weatherData';

describe('ForecastList e ForecastCard', () => {
  it('mostra cinco dias ordenados sem alterar os dados e converte as temperaturas', () => {
    const days = [...mockWeatherData.days].reverse();
    const { rerender } = render(<ForecastList days={days} unit="celsius" />);
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(5);
    expect(within(cards[0]).getByRole('heading')).toHaveTextContent('ter., 27/10');
    expect(within(cards[0]).getByText('27,5 °C')).toBeInTheDocument();
    expect(within(cards[0]).getByText('18,2 °C')).toBeInTheDocument();
    expect(screen.getByText('0 %')).toBeInTheDocument();
    expect(days[0].date).toBe('2026-10-31');

    rerender(<ForecastList days={days} unit="fahrenheit" />);
    expect(screen.getByText('81,5 °F')).toBeInTheDocument();
    expect(screen.getByText('64,8 °F')).toBeInTheDocument();
    expect(screen.getByText('0 %')).toBeInTheDocument();
  });

  it('limita a cinco dias e sinaliza cobertura parcial e lista vazia', () => {
    const days = [...mockWeatherData.days, { ...mockWeatherData.days[0], date: '2026-11-01' }];
    const { rerender } = render(<ForecastList days={days} unit="celsius" />);
    expect(screen.getAllByRole('article')).toHaveLength(5);
    rerender(<ForecastList days={days.slice(0, 3)} unit="celsius" />);
    expect(screen.getByText(/2 dia\(s\) sem previsão/)).toBeInTheDocument();
    rerender(<ForecastList days={[]} unit="celsius" />);
    expect(screen.getByRole('heading', { name: 'Sem previsão disponível' })).toBeInTheDocument();
  });

  it('marca campos ausentes e usa ícone decorativo neutro', () => {
    render(
      <ForecastCard
        day={{
          date: '2026-10-27',
          condition: null,
          temperatureMaxC: null,
          temperatureMinC: null,
          precipitationProbabilityMaxPercent: null,
        }}
        unit="celsius"
      />,
    );
    expect(screen.getAllByText('Indisponível')).toHaveLength(4);
    expect(screen.getByText('—')).toHaveAttribute('aria-hidden', 'true');
  });
});
