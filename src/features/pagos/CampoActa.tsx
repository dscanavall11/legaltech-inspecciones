import type { ReactNode } from 'react';
import { PALETA } from '@/theme/theme';

/** Etiqueta en versalitas sobre el control — el rótulo de campo del área de trabajo. */
export function CampoActa({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: PALETA.textoSuave,
          marginBottom: 6,
          paddingLeft: 2,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

/** Bloque del formulario. */
export function Tarjeta({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: PALETA.superficie,
        borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        padding: '24px 28px',
        marginBottom: 24,
        border: `1px solid ${PALETA.borde}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
