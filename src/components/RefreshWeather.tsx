interface RefreshWeatherProps {
  fetchedAt: string;
  timeZone: string;
  onRefresh: () => void;
}

export default function RefreshWeather({ fetchedAt, timeZone, onRefresh }: RefreshWeatherProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <p className="text-sm text-slate-300">
        Última consulta bem-sucedida:{' '}
        <time dateTime={fetchedAt}>
          {new Intl.DateTimeFormat('pt-BR', {
            timeZone,
            dateStyle: 'short',
            timeStyle: 'medium',
          }).format(new Date(fetchedAt))}
        </time>
      </p>
      <button
        type="button"
        onClick={onRefresh}
        className="min-h-11 rounded-lg bg-accent-400 px-4 py-2 font-semibold text-night-900 hover:bg-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
      >
        Atualizar
      </button>
    </div>
  );
}
