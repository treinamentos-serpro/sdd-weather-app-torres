import { useId } from 'react';
import type { City } from '../types/weather';

interface CityResultsProps {
  cities: City[];
  onSelect: (city: City) => void;
  disabled: boolean;
}

export default function CityResults({ cities, onSelect, disabled }: CityResultsProps) {
  const titleId = useId();
  function location(city: City) {
    return [city.name, city.region, city.country].filter(Boolean).join(', ');
  }

  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId} className="mb-3 text-xl font-semibold">
        Selecione uma cidade
      </h2>
      <ul className="space-y-2">
        {cities.slice(0, 10).map((city) => {
          const ambiguous = cities.filter((other) => location(other) === location(city)).length > 1;
          return (
            <li key={`${city.id}:${city.latitude}:${city.longitude}`}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(city)}
                className="min-h-11 w-full break-words rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:enabled:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {location(city)}
                {ambiguous && ` (${city.latitude}, ${city.longitude})`}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
