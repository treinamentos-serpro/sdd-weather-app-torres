import { useRef, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import useWeather from './hooks/useWeather';
import type { Unit } from './types/weather';

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const { status, data, error, query, search, retry } = useWeather();
  const resultsRef = useRef<HTMLDivElement>(null);

  function handleSearch(city: string) {
    resultsRef.current?.focus();
    void search(city);
  }

  function handleRetry() {
    resultsRef.current?.focus();
    void retry();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-night-900 to-night-800 font-sans text-white">
      <a
        href="#main-content"
        className="sr-only z-10 rounded-lg bg-accent-400 p-3 font-semibold text-night-900 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-white"
      >
        Pular para o conteúdo
      </a>
      <header className="border-b border-white/10">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div>
            <h1 className="text-2xl font-bold text-accent-400">Weather App</h1>
            <p className="text-sm text-slate-300">Seu clima, em um só lugar</p>
          </div>
          <SearchBar onSearch={handleSearch} disabled={status === 'loading'} />
          <div className="justify-self-start">
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-6xl space-y-6 px-4 py-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400 sm:px-6"
      >
        <div
          aria-live="polite"
          aria-atomic="true"
          className="break-words text-sm text-slate-300 [overflow-wrap:anywhere]"
        >
          {query && `Busca: ${query}. `}
          {status === 'success' && data && `Exibindo o clima de ${data.city.name}.`}
          {status === 'empty' &&
            'Nenhum resultado encontrado. Confira o nome da cidade e tente uma nova busca.'}
          {status === 'idle' && 'Digite uma cidade para consultar o clima.'}
        </div>
        <div
          ref={resultsRef}
          role="region"
          aria-label="Resultados da consulta"
          tabIndex={-1}
          className="space-y-6 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-400"
        >
          {status === 'idle' && (
            <EmptyState
              title="Consulte o clima de uma cidade"
              hint="Digite uma cidade no campo de busca para consultar a previsão."
            />
          )}
          {status === 'loading' && <LoadingState />}
          {status === 'empty' && (
            <EmptyState
              title="Nenhum resultado encontrado"
              hint="Confira o nome da cidade e tente uma nova busca."
            />
          )}
          {status === 'error' && error !== null && (
            <ErrorState message={error} onRetry={handleRetry} />
          )}
          {status === 'success' && data !== null && (
            <>
              <CurrentWeather city={data.city} current={data.current} unit={unit} />
              <ForecastList days={data.days} unit={unit} />
            </>
          )}
        </div>
      </main>
      <footer className="px-4 py-6 text-center text-sm text-slate-300">
        Dados meteorológicos:{' '}
        <a
          href="https://open-meteo.com/"
          className="underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
        >
          Open-Meteo
        </a>
      </footer>
    </div>
  );
}
