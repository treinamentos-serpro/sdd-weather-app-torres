import { useId } from 'react';
import { formatTemperature } from '../lib/temperature';
import { getWeatherIcon } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: Unit;
}

function formatMetric(value: number | null, suffix: string): string {
  return value === null
    ? 'Indisponível'
    : `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ${suffix}`;
}

export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const titleId = useId();
  const location = [city.region, city.country].filter(Boolean).join(', ');
  const metrics = [
    { label: 'Umidade', value: formatMetric(current.relativeHumidityPercent, '%') },
    { label: 'Vento', value: formatMetric(current.windSpeedKmh, 'km/h') },
    { label: 'Precipitação', value: formatMetric(current.precipitationMm, 'mm') },
    { label: 'Pressão ao nível do mar', value: formatMetric(current.pressureMslHpa, 'hPa') },
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
