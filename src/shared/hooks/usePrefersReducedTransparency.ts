import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-transparency: reduce)';

function leerPreferencia(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia(QUERY).matches;
  } catch {
    return false;
  }
}

/**
 * Indica si el usuario prefiere reducir los efectos de transparencia
 * (`prefers-reduced-transparency: reduce`). El soporte de este media query
 * es inconsistente entre navegadores; cuando no está soportado o falla,
 * el hook simplemente devuelve `false` (look translúcido por defecto),
 * nunca lanza.
 */
export function usePrefersReducedTransparency(): boolean {
  const [reducirTransparencia, setReducirTransparencia] = useState(leerPreferencia);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    let mql: MediaQueryList;
    try {
      mql = window.matchMedia(QUERY);
    } catch {
      return;
    }

    function onChange(e: MediaQueryListEvent) {
      setReducirTransparencia(e.matches);
    }

    setReducirTransparencia(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return reducirTransparencia;
}
