import { useState, type ReactNode } from 'react';
import { Tooltip } from 'antd';

interface DockIconProps {
  icon: ReactNode;
  label: string;
  color: string;
  destacado?: boolean;
  activo?: boolean;
  onClick: () => void;
}

/**
 * Item del riel de navegación. Un solo énfasis por estado: activo = fondo
 * tintado + glifo en el color de su sección; el destacado = relleno sólido en
 * el color de su sección, mismo tamaño que los demás. Nada de gradientes,
 * labels bajo el icono ni puntos indicadores.
 */
export function DockIcon({ icon, label, color, destacado, activo, onClick }: DockIconProps) {
  const [hover, setHover] = useState(false);

  return (
    <Tooltip title={label} placement="right">
      <button
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        aria-label={label}
        aria-current={activo ? 'page' : undefined}
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
          position: 'relative',
          background: destacado
            ? color
            : activo
              ? 'var(--accent-light)'
              : hover
                ? 'var(--surface-2)'
                : 'transparent',
          color: destacado ? '#fff' : activo ? color : 'var(--text-secondary)',
          transition: 'background 150ms ease, color 150ms ease',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      </button>
    </Tooltip>
  );
}
