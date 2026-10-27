interface EmptyStateProps {
  title: string;
  hint: string;
}

export default function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-white backdrop-blur-md">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-slate-300">{hint}</p>
    </div>
  );
}
