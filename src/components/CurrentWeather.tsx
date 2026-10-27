import { useEffect, useId, useState } from 'react';
import { formatOptionalMetric } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherIcon } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: Unit;
  timeZone?: string;
}

export default function CurrentWeather({
  city,
  current,
  unit,
  timeZone = 'UTC',
}: CurrentWeatherProps) {
  const titleId = useId();
  const [, updateFreshness] = useState(0);
  useEffect(() => {
    if (current.observedAt === null) return;
    const remaining = Date.parse(current.observedAt) + 2 * 60 * 60_000 + 1 - Date.now();
    if (remaining <= 0) return;
    const timer = setTimeout(() => updateFreshness((value) => value + 1), remaining);
    return () => clearTimeout(timer);
  }, [current.observedAt]);
  const stale =
    current.observedAt !== null && Date.now() - Date.parse(current.observedAt) > 2 * 60 * 60_000;
  const location = [city.region, city.country].filter(Boolean).join(', ');
  const metrics = [
    { label: 'Umidade', value: formatOptionalMetric(current.relativeHumidityPercent, '%') },
    { label: 'Vento', value: formatOptionalMetric(current.windSpeedKmh, 'km/h') },
    { label: 'Precipitação', value: formatOptionalMetric(current.precipitationMm, 'mm') },
    {
      label: 'Pressão ao nível do mar',
      value: formatOptionalMetric(current.pressureMslHpa, 'hPa'),
    },
  ];

  return (
    <section
      aria-labelledby={titleId}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 font-sans text-white shadow-glass backdrop-blur-md sm:p-8"
    >
      <h2 id={titleId} className="break-words text-2xl font-semibold">
        {city.name}
      </h2>
      {location && <p className="break-words text-sm text-slate-300">{location}</p>}
      <p className="mt-2 text-sm text-slate-300">
        Observação:{' '}
        {current.observedAt ? (
          <time dateTime={current.observedAt}>
            {new Intl.DateTimeFormat('pt-BR', {
              timeZone,
              dateStyle: 'short',
              timeStyle: 'short',
            }).format(new Date(current.observedAt))}
          </time>
        ) : (
          'Indisponível'
        )}
        {stale && <strong className="ml-2 text-sun">Desatualizado</strong>}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <span aria-hidden="true" className="text-6xl text-sun">
          {getWeatherIcon(current.condition?.code ?? null)}
        </span>
        <p className="min-w-0 max-w-full break-words text-5xl font-semibold tracking-tight sm:text-7xl">
          {formatTemperature(current.temperatureC, unit)}
        </p>
      </div>
      <p className="mt-4 text-xl">{current.condition?.labelPtBr ?? 'Indisponível'}</p>
      <p className="mt-2 text-slate-300">
        Sensação térmica: {formatTemperature(current.apparentTemperatureC, unit)}
      </p>
      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <dt className="text-sm text-slate-300">{label}</dt>
            <dd className="mt-1 text-lg font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
