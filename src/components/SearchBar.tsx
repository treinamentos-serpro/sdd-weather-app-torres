import { type FormEvent, useId, useState } from 'react';
import { validateCityQuery } from '../lib/search';

interface SearchBarProps {
  onSearch: (city: string) => void;
  disabled?: boolean;
}

export default function SearchBar({ onSearch, disabled = false }: SearchBarProps) {
  const inputId = useId();
  const [city, setCity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const query = city.trim();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;
    const validation = validateCityQuery(query);
    setError(validation);
    if (validation) return;
    onSearch(query);
  }

  return (
    <form
      role="search"
      aria-label="Buscar cidade"
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 font-sans text-white shadow-glass backdrop-blur-md"
    >
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium">
        Cidade
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={inputId}
          name="city"
          type="search"
          value={city}
          onChange={(event) => {
            setCity(event.target.value);
            setError(null);
          }}
          aria-invalid={error !== null}
          aria-describedby={error ? `${inputId}-error` : undefined}
          disabled={disabled}
          placeholder="Ex.: São Paulo"
          className="min-w-0 flex-1 rounded-lg border border-slate-400 bg-night-900 px-4 py-3 text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled}
          className="rounded-lg bg-accent-400 px-5 py-3 font-semibold text-night-900 transition-colors hover:bg-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent-400"
        >
          Buscar
        </button>
      </div>
      {error && (
        <p id={`${inputId}-error`} role="alert" className="mt-2 text-sm text-white">
          {error}
        </p>
      )}
    </form>
  );
}
