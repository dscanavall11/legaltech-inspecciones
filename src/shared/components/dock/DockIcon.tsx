import { useState, type ReactNode } from 'react';
import { Tooltip } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { PALETA } from '@/theme/palette';

interface DockIconProps {
  icon: ReactNode;
  label: string;
  color: string;
  destacado?: boolean;
  enConstruccion?: boolean;
  activo?: boolean;
  onClick: () => void;
}

/**
 * Item del riel de navegación. Un solo énfasis por estado: activo = fondo
 * tintado + glifo en el color de su sección; Radicar (destacado) = relleno
 * sólido azul, mismo tamaño que los demás. Nada de gradientes, labels bajo
 * el icono ni puntos indicadores.
 */
export function DockIcon({ icon, label, color, destacado, enConstruccion, activo, onClick }: DockIconProps) {
  const [hover, setHover] = useState(false);

  return (
    <Tooltip title={enConstruccion ? `${label} (en construcción)` : label} placement="right">
      <button
        onClick={onClick}
        disabled={enConstruccion}
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
          cursor: enConstruccion ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
          position: 'relative',
          opacity: enConstruccion ? 0.5 : 1,
          background: destacado
            ? PALETA.azul
            : activo
              ? 'var(--accent-light)'
              : hover
                ? 'var(--surface-2)'
                : 'transparent',
          color: destacado ? '#fff' : activo ? color : 'var(--text-secondary)',
          transition: 'background 150ms ease, color 150ms ease',
        }}
      >
        <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
          {enConstruccion && (
            <span
              style={{
                position: 'absolute',
                bottom: -2,
                right: -4,
                fontSize: 8,
                color: 'var(--text-disabled)',
              }}
            >
              <LockOutlined />
            </span>
          )}
        </span>
      </button>
    </Tooltip>
  );
}
