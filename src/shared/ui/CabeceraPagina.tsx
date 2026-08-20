import { Typography } from 'antd';
import { PALETA } from '@/theme/theme';
import { ESPACIO, TEXTO } from '@/theme/escala';

export interface CabeceraPaginaProps {
  titulo: string;
  descripcion?: string;
  /** Lo que se puede hacer sobre esta pantalla, alineado a la derecha del título. */
  acciones?: React.ReactNode;
}

/**
 * La cabecera de cualquier módulo. Una sola, y ahí está el punto.
 *
 * Había tres: el área de trabajo, las actas y la bandeja escribían su propio
 * título con tamaños de subtítulo distintos —uno mayor que el cuerpo, otro
 * menor— y márgenes inferiores de 2, 8 y 32 px. Cada pantalla se veía bien por
 * separado y al navegar entre ellas parecían aplicaciones diferentes.
 *
 * El ancho del texto se limita a 62ch: una línea de descripción más larga que
 * eso se lee peor, y estirarla hasta el borde de una pantalla ancha es lo que
 * hacía que la página pareciera desordenada antes de leer una palabra.
 */
export function CabeceraPagina({ titulo, descripcion, acciones }: CabeceraPaginaProps) {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        gap: ESPACIO.md,
      }}
    >
      <div style={{ maxWidth: '62ch' }}>
        <Typography.Title level={2} style={{ margin: 0, fontSize: TEXTO.pagina }}>
          {titulo}
        </Typography.Title>
        {descripcion && (
          <div
            style={{
              fontSize: TEXTO.menor,
              color: PALETA.textoSuave,
              lineHeight: 1.5,
              marginTop: ESPACIO.xs,
            }}
          >
            {descripcion}
          </div>
        )}
      </div>
      {acciones && (
        <div style={{ display: 'flex', gap: ESPACIO.sm, alignItems: 'center', flexWrap: 'wrap' }}>
          {acciones}
        </div>
      )}
    </header>
  );
}
