import { PALETA, ELEVACION } from '@/theme/theme';
import { ESPACIO, RADIO, RELLENO } from '@/theme/escala';

export interface TarjetaProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * La superficie de primer nivel de un área de trabajo. Había tres copias con
 * radio 16 o 20, relleno 18×20 o 24×28 y sombras distintas —una con borde y
 * otra sin él—, así que dos secciones contiguas de la misma pantalla no
 * coincidían en nada. Dentro va {@link Bloque}, que ya no lleva sombra propia.
 */
export function Tarjeta({ children, style }: TarjetaProps) {
  return (
    <div
      style={{
        background: PALETA.superficie,
        border: `1px solid ${PALETA.borde}`,
        borderRadius: RADIO.tarjeta,
        boxShadow: ELEVACION.base,
        padding: RELLENO.tarjeta,
        marginBottom: ESPACIO.md,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
