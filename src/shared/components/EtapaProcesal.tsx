import { Fragment } from 'react';
import { PALETA } from '@/theme/theme';
import { TEXTO } from '@/theme/escala';

/**
 * Riel de etapas del trámite. Codifica la secuencia procesal real:
 * - Querella (proceso verbal abreviado, art. 223 Ley 1801 de 2016):
 *   Radicación → Audiencia pública → Decisión → Firmeza → Archivo
 * - Queja (mediación / conciliación, arts. 231–233):
 *   Radicación → Conciliación → Resultado → Archivo
 */
export function EtapaProcesal({
  etapas,
  activa,
}: {
  etapas: string[];
  activa: number; // índice de la etapa en curso
}) {
  return (
    <div
      role="list"
      aria-label="Etapas del trámite"
      style={{ display: 'flex', alignItems: 'flex-start', maxWidth: 560, marginTop: 18 }}
    >
      {etapas.map((etapa, i) => {
        const completada = i < activa;
        const enCurso = i === activa;
        return (
          <Fragment key={etapa}>
            {i > 0 && (
              <div
                aria-hidden
                style={{
                  flex: 1,
                  height: 2,
                  borderRadius: 999,
                  background: i <= activa ? PALETA.azul : PALETA.borde,
                  marginTop: 9,
                  minWidth: 18,
                  transition: 'background 0.4s ease',
                }}
              />
            )}
            <div
              role="listitem"
              aria-current={enCurso ? 'step' : undefined}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 7,
                padding: '0 8px',
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: enCurso ? PALETA.azulSuave : 'transparent',
                  boxShadow: enCurso ? `0 0 0 1.5px ${PALETA.azul} inset` : 'none',
                }}
              >
                <span
                  style={{
                    width: completada || enCurso ? 8 : 7,
                    height: completada || enCurso ? 8 : 7,
                    borderRadius: '50%',
                    background: completada || enCurso ? PALETA.azul : '#d6d9de',
                    transition: 'background 0.4s ease',
                  }}
                />
              </span>
              <span
                style={{
                  fontSize: TEXTO.nota,
                  fontWeight: enCurso ? 600 : 500,
                  color: enCurso ? PALETA.azulOscuro : completada ? PALETA.textoSuave : PALETA.textoTenue,
                  whiteSpace: 'nowrap',
                }}
              >
                {etapa}
              </span>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
