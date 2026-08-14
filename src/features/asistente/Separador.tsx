import { useEffect, useRef, useState } from 'react';
import { PALETA } from '@/theme/palette';

/**
 * Separador arrastrable entre dos columnas. Sin dependencias: un div con
 * pointer capture. Es un `separator` accesible — con foco, las flechas mueven
 * el borde igual que el arrastre.
 */

const PASO_TECLADO = 16;

export function Separador({
  ancho,
  min,
  max,
  signo,
  etiqueta,
  onCambio,
}: {
  ancho: number;
  min: number;
  max: number;
  /** +1 si el panel crece al arrastrar a la derecha (columna izquierda), -1 si al revés. */
  signo: 1 | -1;
  etiqueta: string;
  onCambio: (ancho: number) => void;
}) {
  const [arrastrando, setArrastrando] = useState(false);
  const inicio = useRef({ x: 0, ancho: 0 });

  const acotar = (valor: number) => Math.min(max, Math.max(min, Math.round(valor)));

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={etiqueta}
      aria-valuenow={ancho}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        inicio.current = { x: e.clientX, ancho };
        setArrastrando(true);
      }}
      onPointerMove={(e) => {
        if (!arrastrando) return;
        onCambio(acotar(inicio.current.ancho + signo * (e.clientX - inicio.current.x)));
      }}
      onPointerUp={(e) => {
        e.currentTarget.releasePointerCapture(e.pointerId);
        setArrastrando(false);
      }}
      onKeyDown={(e) => {
        const paso = e.key === 'ArrowLeft' ? -PASO_TECLADO : e.key === 'ArrowRight' ? PASO_TECLADO : 0;
        if (paso === 0) return;
        e.preventDefault();
        onCambio(acotar(ancho + signo * paso));
      }}
      style={{
        flex: '0 0 5px',
        cursor: 'col-resize',
        background: arrastrando ? PALETA.morado : 'transparent',
        borderLeft: `1px solid ${PALETA.borde}`,
        touchAction: 'none',
      }}
    />
  );
}

/** Ancho de un panel, recordado entre sesiones en localStorage. */
export function useAnchoPersistido(clave: string, inicial: number) {
  const [ancho, setAncho] = useState(() => {
    const guardado = Number(globalThis.localStorage?.getItem(clave));
    return Number.isFinite(guardado) && guardado > 0 ? guardado : inicial;
  });
  useEffect(() => {
    globalThis.localStorage?.setItem(clave, String(ancho));
  }, [clave, ancho]);
  return [ancho, setAncho] as const;
}
