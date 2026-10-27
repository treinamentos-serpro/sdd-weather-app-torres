import { useState } from 'react';
import type { Unit } from '../types/weather';

const storageKey = 'weather-unit';

function readPreference(): { unit: Unit; error: string | null } {
  try {
    const stored = localStorage.getItem(storageKey);
    return { unit: stored === 'fahrenheit' ? 'fahrenheit' : 'celsius', error: null };
  } catch {
    return {
      unit: 'celsius',
      error: 'Não foi possível ler sua preferência. A unidade será mantida apenas nesta visita.',
    };
  }
}

export default function useTemperatureUnit() {
  const [preference, setPreference] = useState(readPreference);

  function changeUnit(unit: Unit) {
    try {
      localStorage.setItem(storageKey, unit);
      setPreference({ unit, error: null });
    } catch {
      setPreference({
        unit,
        error:
          'Não foi possível salvar sua preferência. A unidade será mantida apenas nesta visita.',
      });
    }
  }

  return { ...preference, changeUnit };
}
