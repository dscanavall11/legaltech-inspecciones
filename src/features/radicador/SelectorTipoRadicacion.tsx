import { TIPOS_RADICACION, type TipoRadicacion } from './tipoRadicacion';
import { PALETA } from '@/theme/theme';
import { TEXTO } from '@/theme/escala';

/**
 * Selector de tipo de radicación: los 4 iconos reciclados en pequeño, arriba de
 * la ficha. Al elegir uno, el chat y los campos de la derecha cambian al tipo.
 */
export function SelectorTipoRadicacion({
  tipo,
  onChange,
}: {
  tipo: TipoRadicacion;
  onChange: (t: TipoRadicacion) => void;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: TEXTO.nota,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: PALETA.textoTenue,
          marginBottom: 8,
        }}
      >
        Tipo de radicación
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {TIPOS_RADICACION.map((t) => {
          const activo = t.tipo === tipo;
          return (
            <button
              key={t.tipo}
              onClick={() => onChange(t.tipo)}
              aria-pressed={activo}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '9px 11px',
                borderRadius: 14,
                border: `1px solid ${activo ? t.color : 'transparent'}`,
                background: activo ? t.fondo : '#f6f7f9',
                color: activo ? t.color : PALETA.textoSuave,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease',
                fontWeight: activo ? 600 : 500,
                fontSize: TEXTO.menor,
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 9,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: activo ? '#ffffff' : '#eceef1',
                  color: t.color,
                  fontSize: TEXTO.base,
                  flexShrink: 0,
                }}
              >
                {t.icono}
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.titulo}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
