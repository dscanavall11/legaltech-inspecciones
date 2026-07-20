import { forwardRef, useState, type ReactNode, type CSSProperties } from 'react';
import { Tooltip } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { PALETA } from '@/theme/palette';
import { glassAccentSheen } from '@/theme/glass';

interface DockIconProps {
  icon: ReactNode;
  label: string;
  color: string;
  destacado?: boolean;
  enConstruccion?: boolean;
  activo?: boolean;
  onClick: () => void;
}

const TAMANO_BASE = 44;
const TAMANO_DESTACADO = 56;

/**
 * Item del dock. No usa motion/react para la magnificacion — Dock.tsx toma
 * el <button> por ref y anima su `scale` directamente con gsap.quickTo
 * (misma tecnica que demos.gsap.com/demo/macos-dock-effect), asi que este
 * componente no sabe nada de la posicion del cursor.
 *
 * Estilo de fila/activo fiel al patron real de resguardo-saas (.nav-item):
 * el fondo activo es siempre accent-light + texto accent, sin importar el
 * color de la seccion — solo el glifo del icono toma `color` cuando esta
 * activo; inactivo, el glifo es gris (--text-disabled).
 */
export const DockIcon = forwardRef<HTMLButtonElement, DockIconProps>(function DockIcon(
  { icon, label, color, destacado, enConstruccion, activo, onClick },
  ref,
) {
  const [hover, setHover] = useState(false);
  const [spot, setSpot] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  const tamano = destacado ? TAMANO_DESTACADO : TAMANO_BASE;

  function onMove(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setSpot({ x: e.clientX - rect.left, y: e.clientY - rect.top, visible: true });
  }

  const spotStyle: CSSProperties = spot.visible
    ? {
        background: `radial-gradient(100px circle at ${spot.x}px ${spot.y}px, rgba(255, 255, 255, 0.35), transparent 70%)`,
      }
    : { background: 'transparent' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%' }}>
      <Tooltip
        title={enConstruccion ? `${label} (en construcción)` : label}
        placement="right"
      >
        <button
          ref={ref}
          onClick={onClick}
          disabled={enConstruccion}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => {
            setHover(false);
            setSpot((s) => ({ ...s, visible: false }));
          }}
          onMouseMove={onMove}
          onFocus={() => setHover(true)}
          onBlur={() => setHover(false)}
          aria-label={label}
          aria-current={activo ? 'page' : undefined}
          style={{
            width: tamano,
            height: tamano,
            borderRadius: destacado ? 16 : 999,
            border: 'none',
            cursor: enConstruccion ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: destacado ? 22 : 18,
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
            opacity: enConstruccion ? 0.5 : 1,
            // Patron resguardo-saas: fondo activo/hover siempre accent-light,
            // el color de seccion solo tiñe el glifo. Radicar es la unica
            // excepcion (gradiente propio), pedida explicitamente.
            background: destacado
              ? `linear-gradient(135deg, ${PALETA.azul}, ${PALETA.azulOscuro})`
              : activo
                ? 'var(--accent-light)'
                : hover
                  ? 'var(--surface-2)'
                  : 'transparent',
            color: destacado ? '#fff' : activo ? color : 'var(--text-disabled)',
            transition: 'background 150ms ease, color 150ms ease',
          }}
        >
          {destacado && (
            <span
              aria-hidden
              style={{ position: 'absolute', inset: 0, background: glassAccentSheen(PALETA.azul), pointerEvents: 'none' }}
            />
          )}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              ...spotStyle,
              pointerEvents: 'none',
              transition: 'background 120ms ease',
            }}
          />
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
      {destacado && (
        <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1 }}>{label}</span>
      )}
      <span
        aria-hidden
        style={{
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: activo ? color : 'transparent',
          transition: 'background 0.15s',
        }}
      />
    </div>
  );
});
