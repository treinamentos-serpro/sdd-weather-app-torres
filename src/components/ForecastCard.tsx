import { formatDay, formatOptionalMetric } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherIcon } from '../lib/weatherCodes';
import type { ForecastDay, Unit } from '../types/weather';

interface ForecastCardProps {
  day: ForecastDay;
  unit: Unit;
}

export default function ForecastCard({ day, unit }: ForecastCardProps) {
  return (
    <article
      aria-label={`Previsão para ${formatDay(day.date)}`}
      className="h-full min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-glass backdrop-blur-md"
    >
      <h3 className="font-semibold">
        <time dateTime={day.date}>{formatDay(day.date)}</time>
      </h3>
      <span aria-hidden="true" className="my-3 block text-4xl text-sun">
        {getWeatherIcon(day.condition?.code ?? null)}
      </span>
      <p className="break-words text-sm text-slate-300">
        {day.condition?.labelPtBr ?? 'Indisponível'}
      </p>
      <dl className="mt-4 space-y-2 break-words text-sm">
        <div>
          <dt className="text-slate-300">Máxima</dt>
          <dd className="font-semibold">{formatTemperature(day.temperatureMaxC, unit)}</dd>
        </div>
        <div>
          <dt className="text-slate-300">Mínima</dt>
          <dd>{formatTemperature(day.temperatureMinC, unit)}</dd>
        </div>
        <div>
          <dt className="text-slate-300">Probabilidade de chuva</dt>
          <dd>
            {formatOptionalMetric(day.precipitationProbabilityMaxPercent, '%', 0)}
          </dd>
        </div>
      </dl>
    </article>
  );
}
