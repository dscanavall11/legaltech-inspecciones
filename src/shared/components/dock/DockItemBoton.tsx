import { useState, type ReactNode } from 'react';
import { PALETA } from '@/theme/palette';
import { TEXTO } from '@/theme/escala';

interface DockItemBotonProps {
  icon: ReactNode;
  label: string;
  ayuda?: string;
  color: string;
  destacado?: boolean;
  activo?: boolean;
  onClick: () => void;
  compacto?: boolean;
}

/**
 * Entrada del riel. El nombre va siempre visible y, debajo, una línea que dice
 * para qué sirve: quien usa esto es un inspector, no alguien dispuesto a pasar
 * el mouse por encima de íconos para descubrir qué hace cada uno. Antes el
 * riel era solo íconos con tooltip.
 *
 * Un solo énfasis por estado. Activo: fondo tintado del color de su sección
 * más una barra en el borde izquierdo. Destacado (Firmeza, el trámite más
 * usado): un punto del color de la sección, que no compite con el activo.
 */
export function DockItemBoton({
  icon,
  label,
  ayuda,
  color,
  destacado,
  activo,
  onClick,
  compacto,
}: DockItemBotonProps) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      aria-current={activo ? 'page' : undefined}
      title={compacto ? label : undefined}
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: compacto ? 'center' : undefined,
        gap: compacto ? 0 : 11,
        padding: compacto ? '10px 4px' : '8px 12px 8px 14px',
        borderRadius: 10,
        border: 'none',
        textAlign: 'left',
        cursor: 'pointer',
        background: activo ? `${color}14` : hover ? 'var(--surface-2)' : 'transparent',
        color: activo ? color : PALETA.texto,
        transition: 'background 150ms ease, color 150ms ease',
      }}
    >
      {activo && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: 7,
            bottom: 7,
            width: 3,
            borderRadius: '0 3px 3px 0',
            background: color,
          }}
        />
      )}

      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: activo ? color : PALETA.textoSuave,
        }}
      >
        {icon}
      </span>

      {!compacto && (
        <span style={{ minWidth: 0, flex: 1 }}>
          <span
            style={{
              display: 'block',
              fontSize: TEXTO.base,
              fontWeight: activo ? 600 : 500,
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
          {ayuda && (
            <span
              style={{
                display: 'block',
                fontSize: TEXTO.nota,
                lineHeight: 1.35,
                marginTop: 1,
                color: PALETA.textoTenue,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {ayuda}
            </span>
          )}
        </span>
      )}

      {!compacto && destacado && !activo && (
        <span
          aria-hidden
          style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }}
        />
      )}
    </button>
  );
}
