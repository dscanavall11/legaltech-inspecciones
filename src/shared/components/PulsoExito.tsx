import React, { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Pulso de éxito — onda azul expansiva que se dispara una vez al radicar.
 * Se usa como overlay sobre el botón que lo invocó.
 */
interface PulsoExitoProps {
  /** True para disparar la animación (resetear a false después) */
  activo: boolean;
  /** Referencia al elemento sobre el que centrar el pulso (normalmente el botón) */
  objetivoRef?: React.RefObject<HTMLElement>;
  /** Callback cuando termina la animación */
  onFin?: () => void;
  /** Hijos (el botón u otro elemento) */
  children: ReactNode;
}

export function PulsoExito({ activo, objetivoRef, onFin, children }: PulsoExitoProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activo) return;
    const t = setTimeout(() => {
      onFin?.();
    }, 600);
    return () => clearTimeout(t);
  }, [activo, onFin]);

  // Estilos para centrar el pulso sobre el objetivo
  const overlayStyle: React.CSSProperties = objetivoRef?.current
    ? {
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        pointerEvents: 'none',
        zIndex: 10,
      }
    : {};

  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      {children}
      {activo && <div ref={overlayRef} className="pulso-exito" style={overlayStyle} />}
    </span>
  );
}

/**
 * Hook para usar el pulso fácilmente desde cualquier componente.
 * Retorna { ref, disparar, Pulso } donde:
 * - ref: adjuntar al botón/elemento objetivo
 * - disparar(): llama para activar la animación
 * - Pulso: componente wrapper que renderiza el pulso
 */
export function usePulsoExito() {
  const [activo, setActivo] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  const disparar = () => {
    setActivo(true);
    // Auto-reset después de la animación
    setTimeout(() => setActivo(false), 650);
  };

  return {
    ref,
    activo,
    disparar,
    Pulso: ({ children }: { children: ReactNode }) => (
      <PulsoExito objetivoRef={ref} activo={activo}>
        {children}
      </PulsoExito>
    ),
  };
}

/**
 * Componente wrapper que aplica stagger a sus hijos directos vía --i.
 * Útil para listas/grids que entran escalonadamente.
 */
interface StaggerProps {
  children: ReactNode;
  delayMs?: number;
  durationMs?: number;
}

export function Stagger({ children, delayMs = 40, durationMs = 420 }: StaggerProps) {
  return (
    <div
      className="vista-animada"
      style={{
        '--stagger-delay': `${delayMs}ms`,
        '--anim-dur': `${durationMs}ms`,
      } as React.CSSProperties}
    >
      {React.Children.map(children, (child, i) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, {
              style: {
                ...(child.props.style || {}),
                '--i': i,
              } as React.CSSProperties,
            })
          : child,
      )}
    </div>
  );
}