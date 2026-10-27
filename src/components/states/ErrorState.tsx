interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-white backdrop-blur-md">
      <p role="alert" className="text-lg font-semibold">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 min-h-11 rounded-lg bg-accent-400 px-4 py-2 font-semibold text-night-900 transition-colors hover:bg-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
      >
        Tentar novamente
      </button>
    </div>
  );
}
