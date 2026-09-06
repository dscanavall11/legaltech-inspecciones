import { PALETA } from '@/theme/theme';
import { ESPACIO, RADIO, RELLENO, TEXTO } from '@/theme/escala';

export interface BloqueProps {
  titulo?: string;
  ayuda?: string;
  /** Se pinta arriba a la derecha, a la altura del título: estado, contador, acción. */
  extra?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Panel interior: la ficha de una parte, un grupo de campos, una sección del
 * borrador. Un solo nivel de superficie dentro de la tarjeta del paso, sin
 * sombra — la sombra ya la pone la tarjeta y apilarlas hacía que cada bloque
 * pareciera flotar por su cuenta.
 */
export function Bloque({ titulo, ayuda, extra, children, style }: BloqueProps) {
  return (
    <div
      style={{
        background: PALETA.superficie,
        border: `1px solid ${PALETA.borde}`,
        borderRadius: RADIO.bloque,
        padding: RELLENO.bloque,
        ...style,
      }}
    >
      {(titulo || extra) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: ESPACIO.sm,
            marginBottom: ayuda ? 0 : ESPACIO.md,
          }}
        >
          {titulo && <div style={{ fontSize: TEXTO.titulo, fontWeight: 600 }}>{titulo}</div>}
          {extra}
        </div>
      )}
      {ayuda && (
        <div
          style={{
            fontSize: TEXTO.menor,
            color: PALETA.textoSuave,
            margin: `${ESPACIO.xs}px 0 ${ESPACIO.md}px`,
          }}
        >
          {ayuda}
        </div>
      )}
      {children}
    </div>
  );
}
