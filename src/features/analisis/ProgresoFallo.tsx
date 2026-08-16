import { CheckOutlined } from '@ant-design/icons';
import { PALETA } from '@/theme/theme';

export interface PasoFallo {
  titulo: string;
  /** Detalle bajo el título: el estado en palabras, no un porcentaje. */
  detalle: string;
  listo: boolean;
}

/**
 * Franja de progreso del fallo: cuatro pasos en el orden en que se hacen.
 * Sin esto la pantalla era nueve campos de texto apilados y no se sabía por
 * dónde empezar — el inspector necesita ver el camino, no solo los campos.
 */
export function ProgresoFallo({ pasos }: { pasos: PasoFallo[] }) {
  // El paso actual es el primero sin terminar; si están todos, ninguno resalta.
  const indiceActual = pasos.findIndex((p) => !p.listo);

  return (
    <ol
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        listStyle: 'none',
        margin: '0 0 18px',
        padding: 0,
      }}
    >
      {pasos.map((paso, i) => {
        const actual = i === indiceActual;
        const color = paso.listo ? PALETA.verde : actual ? PALETA.azul : PALETA.textoTenue;
        return (
          <li
            key={paso.titulo}
            aria-current={actual ? 'step' : undefined}
            style={{
              flex: '1 1 170px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 12,
              background: PALETA.superficie,
              border: `1px solid ${actual ? PALETA.azul : PALETA.borde}`,
              boxShadow: actual ? `0 0 0 3px ${PALETA.azulSuave}` : 'none',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: paso.listo ? '#fff' : color,
                background: paso.listo ? PALETA.verde : 'transparent',
                border: paso.listo ? 'none' : `1.5px solid ${color}`,
              }}
            >
              {paso.listo ? <CheckOutlined style={{ fontSize: 11 }} /> : i + 1}
            </span>
            <span style={{ minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: actual ? 600 : 500,
                  color: PALETA.texto,
                  lineHeight: 1.25,
                }}
              >
                {paso.titulo}
              </span>
              <span style={{ display: 'block', fontSize: 11.5, color, lineHeight: 1.3 }}>
                {paso.detalle}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
