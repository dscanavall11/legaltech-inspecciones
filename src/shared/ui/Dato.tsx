import { PALETA } from '@/theme/theme';
import { ESPACIO, TEXTO } from '@/theme/escala';

export interface DatoProps {
  label: string;
  children: React.ReactNode;
}

/**
 * El par etiqueta/valor de solo lectura de las fichas de detalle. Mismo rótulo
 * que {@link Campo}: la ficha que se lee y la que se edita son la misma ficha,
 * y hasta ahora se veían distintas porque cada pantalla se había escrito su
 * propia versión con el tamaño y el margen a ojo.
 */
export function Dato({ label, children }: DatoProps) {
  return (
    <div>
      <div style={{ fontSize: TEXTO.menor, color: PALETA.textoSuave, marginBottom: ESPACIO.xs }}>
        {label}
      </div>
      <div style={{ color: PALETA.texto }}>{children}</div>
    </div>
  );
}
