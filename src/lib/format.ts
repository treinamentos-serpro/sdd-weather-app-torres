export function formatOptionalMetric(
  value: number | null | undefined,
  suffix: string,
  maximumFractionDigits = 1,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'Indisponível';
  }
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits })} ${suffix}`;
}

export function formatDay(date: string): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw new RangeError(`Data local inválida: ${date}`);
  }
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(parsed);
}
