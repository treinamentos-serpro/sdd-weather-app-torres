import { useId } from 'react';
import type { ForecastDay, Unit } from '../types/weather';
import ForecastCard from './ForecastCard';
import EmptyState from './states/EmptyState';

interface ForecastListProps {
  days: ForecastDay[];
  unit: Unit;
}

export default function ForecastList({ days, unit }: ForecastListProps) {
  const titleId = useId();
  const visibleDays = [...days].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);

  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId} className="mb-4 text-xl font-semibold text-white">
        Previsão de 5 dias
      </h2>
      {visibleDays.length === 0 ? (
        <EmptyState title="Sem previsão disponível" hint="Tente consultar os dados novamente." />
      ) : (
        <>
          {visibleDays.length < 5 && (
            <p className="mb-4 text-slate-300">
              Cobertura incompleta: {5 - visibleDays.length} dia(s) sem previsão disponível.
            </p>
          )}
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {visibleDays.map((day) => (
              <li key={day.date} className="min-w-0">
                <ForecastCard day={day} unit={unit} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
