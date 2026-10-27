export default function LoadingState() {
  return (
    <div
      role="status"
      className="rounded-2xl border border-white/10 bg-white/5 p-8 text-white backdrop-blur-md"
    >
      <p className="text-lg font-semibold">Carregando previsão…</p>
      <p className="mt-2 text-slate-300">Aguarde enquanto consultamos os dados meteorológicos.</p>
    </div>
  );
}
