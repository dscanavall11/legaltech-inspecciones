import { useId } from 'react';
import { PALETA } from '@/theme/theme';

/**
 * Marca de Legal, la mascota IA de la plataforma: una "L" geométrica de trazo
 * continuo, con un acento (el punto) en vez del sparkle genérico que usan
 * todos los chats de IA. Comparte el lenguaje del badge del logo LegalTech
 * (cuadrado redondeado, degradado azul) — Legal es de la misma familia visual,
 * no un ícono de librería genérico.
 */
export function NormaMark({ size = 32 }: { size?: number }) {
  const gradientId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="10" fill={`url(#${gradientId})`} />
      <path
        d="M11.5 9.5V22H21"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="22.5" cy="9.5" r="1.8" fill="white" />
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor={PALETA.morado} />
          <stop offset="1" stopColor={PALETA.moradoOscuro} />
        </linearGradient>
      </defs>
    </svg>
  );
}
