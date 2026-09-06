import { PALETA } from '@/theme/theme';
import { ESPACIO, RADIO, TEXTO } from '@/theme/escala';
import type { LegalCase } from '@/shared/legalCases/types';
import type { PasoExpediente } from './tipos';

export interface RielPasosProps {
  pasos: readonly PasoExpediente[];
  activo: number;
  onElegir: (i: number) => void;
  /** Ausente = todavía no hay expediente: el riel se ve, pero no se puede entrar. */
  caso?: LegalCase;
}

/**
 * El índice del expediente. Ocupa el tercio izquierdo y dice, sin abrir nada,
 * en qué va cada paso: cuántos documentos hay, si las partes están
 * identificadas, si el fallo ya se redactó.
 *
 * Existe porque el recorrido antes se pintaba entero —cinco tarjetas a ancho
 * completo, una debajo de otra— y el inspector tenía delante todo el
 * expediente para hacer una sola cosa. Aquí el estado se consulta de un
 * vistazo y el trabajo ocurre en un solo sitio.
 */
export function RielPasos({ pasos, activo, onElegir, caso }: RielPasosProps) {
  return (
    <nav aria-label="Pasos del expediente" style={{ display: 'grid', gap: 2 }}>
      {pasos.map((paso, i) => {
        const esActivo = i === activo;
        return (
          <button
            key={paso.clave}
            type="button"
            disabled={!caso}
            aria-current={esActivo ? 'step' : undefined}
            onClick={() => onElegir(i)}
            className="riel-paso"
            style={{
              display: 'grid',
              gridTemplateColumns: '22px 1fr',
              gap: ESPACIO.sm,
              alignItems: 'start',
              width: '100%',
              textAlign: 'left',
              border: 'none',
              background: esActivo ? 'var(--accent-light)' : 'transparent',
              borderRadius: RADIO.control,
              padding: `${ESPACIO.sm}px ${ESPACIO.md}px`,
              cursor: caso ? 'pointer' : 'default',
              opacity: caso ? 1 : 0.45,
              transition: 'background 180ms ease',
            }}
          >
            <span
              aria-hidden
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 20,
                height: 20,
                marginTop: 1,
                borderRadius: 6,
                background: esActivo ? PALETA.azul : 'var(--surface-2)',
                color: esActivo ? '#fff' : PALETA.textoSuave,
                fontSize: TEXTO.nota,
                fontWeight: 600,
              }}
            >
              {i + 1}
            </span>
            <span style={{ minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontSize: TEXTO.base,
                  fontWeight: esActivo ? 600 : 500,
                  color: esActivo ? PALETA.azulOscuro : PALETA.texto,
                  lineHeight: 1.35,
                }}
              >
                {paso.titulo}
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: TEXTO.nota,
                  color: PALETA.textoSuave,
                  lineHeight: 1.4,
                }}
              >
                {caso && paso.Resumen ? <paso.Resumen caso={caso} /> : paso.ayuda}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
