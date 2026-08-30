import { PALETA } from '@/theme/theme';
import { ESPACIO, TEXTO } from '@/theme/escala';

export interface CampoProps {
  label: string;
  /** Pie de campo: la norma que lo exige, la unidad, el formato esperado. */
  nota?: string;
  children: React.ReactNode;
}

/**
 * Etiqueta encima del control, pie debajo. Vivía copiada en nueve archivos con
 * el margen y el tamaño ligeramente distintos en cada uno, que es por lo que la
 * interfaz no se sentía homogénea aunque cada pantalla por separado se viera
 * bien.
 *
 * La etiqueta va ARRIBA y no dentro del control: un placeholder que hace de
 * etiqueta desaparece al escribir, y aquí el inspector rellena fichas largas
 * que revisa después.
 */
export function Campo({ label, nota, children }: CampoProps) {
  return (
    <div>
      <div style={{ fontSize: TEXTO.menor, color: PALETA.textoSuave, marginBottom: ESPACIO.xs }}>
        {label}
      </div>
      {children}
      {nota && (
        <div style={{ fontSize: TEXTO.nota, color: PALETA.textoTenue, marginTop: ESPACIO.xs }}>
          {nota}
        </div>
      )}
    </div>
  );
}
