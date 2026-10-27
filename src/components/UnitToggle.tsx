import type { Unit } from '../types/weather';

interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
}

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  return (
    <div
      role="group"
      aria-label="Unidade de temperatura"
      className="inline-flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 font-sans shadow-glass backdrop-blur-md"
    >
      {(['celsius', 'fahrenheit'] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={unit === value}
          onClick={() => onChange(value)}
          className="min-h-11 min-w-11 rounded-lg px-3 py-2 font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 aria-pressed:bg-accent-400 aria-pressed:text-night-900"
        >
          {value === 'celsius' ? '°C' : '°F'}
        </button>
      ))}
    </div>
  );
}
