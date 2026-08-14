import { useState } from 'react';
import dayjs from 'dayjs';
import { CalendarCheck, X } from 'lucide-react';
import type { FilaProceso } from '@/shared/procesos/types';
import { PALETA } from '@/theme/palette';
import { guardarFecha, leerFecha, olvidarFecha, sugerirActuacion, yaPaso } from './agenda';

/**
 * La fecha la propone el chat, no una agenda: según la etapa procesal del caso
 * abierto, el asistente sugiere la actuación siguiente y una fecha en días
 * hábiles. El inspector la acepta, la cambia o la descarta.
 *
 * Lo aceptado se guarda solo en este navegador — no se radica, no se notifica
 * y no se da por ocurrido. Cuando la fecha ya pasó, el asistente pregunta qué
 * pasó y pide las pruebas o el audio de la audiencia.
 */
export function SugerenciaFecha({
  caso,
  onResponder,
}: {
  caso: FilaProceso;
  onResponder: (texto: string) => void;
}) {
  const [acordada, setAcordada] = useState(() => leerFecha(caso.id));
  const [descartada, setDescartada] = useState(false);
  const sugerida = sugerirActuacion(caso);
  const [fecha, setFecha] = useState(sugerida?.fecha ?? '');

  const quitar = () => {
    olvidarFecha(caso.id);
    setAcordada(null);
    setDescartada(true);
  };

  if (acordada) {
    const vencida = yaPaso(acordada);
    return (
      <div style={{ ...estilos.caja, background: vencida ? PALETA.amarilloBg : 'transparent' }}>
        <CalendarCheck size={15} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={estilos.titulo}>
            {acordada.accion} — {dayjs(acordada.fecha).format('DD/MM/YYYY')}
          </div>
          <p style={estilos.texto}>
            Anotado el {dayjs(acordada.anotadaEn).format('DD/MM/YYYY')} solo en este navegador: no quedó en el
            expediente y nadie fue notificado.
            {vencida && ' Esa fecha ya pasó; el asistente no sabe si la actuación ocurrió.'}
          </p>
          {vencida && (
            <button
              type="button"
              style={estilos.btn}
              onClick={() =>
                onResponder(
                  `Sobre el expediente ${caso.radicado}: el ${dayjs(acordada.fecha).format('DD/MM/YYYY')} estaba anotada la actuación "${acordada.accion}".\n` +
                    'Qué ocurrió: \n' +
                    'Adjunto (acta, audio de la audiencia o pruebas recaudadas): ',
                )
              }
            >
              Contar qué pasó y adjuntar
            </button>
          )}
        </div>
        <button type="button" style={estilos.iconBtn} onClick={quitar} aria-label="Quitar la anotación">
          <X size={14} />
        </button>
      </div>
    );
  }

  if (descartada || !sugerida) return null;

  return (
    <div style={estilos.caja}>
      <CalendarCheck size={15} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={estilos.titulo}>Siguiente actuación: {sugerida.accion}</div>
        <p style={estilos.texto}>{sugerida.mensaje}</p>
        {sugerida.fecha ? (
          <p style={estilos.texto}>
            Propuesta a {sugerida.dias} días hábiles ({sugerida.fuenteDias}).
          </p>
        ) : (
          <p style={estilos.texto}>
            La etapa no tiene término conocido en el expediente: pon tú la fecha, el asistente no la supone.
          </p>
        )}
        <div style={estilos.acciones}>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={estilos.input}
            aria-label="Fecha de la actuación"
          />
          <button
            type="button"
            disabled={!fecha}
            style={{ ...estilos.btn, ...(fecha ? estilos.btnActivo : estilos.btnInactivo) }}
            onClick={() => {
              const nueva = { accion: sugerida.accion, fecha, anotadaEn: dayjs().format('YYYY-MM-DD') };
              guardarFecha(caso.id, nueva);
              setAcordada(nueva);
            }}
          >
            Anotar
          </button>
          <button type="button" style={estilos.btn} onClick={() => setDescartada(true)}>
            Descartar
          </button>
        </div>
      </div>
    </div>
  );
}

const estilos: Record<string, React.CSSProperties> = {
  caja: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 9,
    margin: '0 0 18px',
    padding: '11px 13px',
    border: `1px solid ${PALETA.borde}`,
    borderRadius: 12,
    color: PALETA.texto,
  },
  titulo: { fontSize: 13, fontWeight: 600 },
  texto: { margin: '3px 0 0', fontSize: 12.5, lineHeight: 1.55, color: PALETA.textoSuave },
  acciones: { display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 9 },
  input: {
    border: `1px solid ${PALETA.borde}`,
    borderRadius: 8,
    padding: '5px 8px',
    background: 'transparent',
    fontFamily: 'inherit',
    fontSize: 12.5,
    color: PALETA.texto,
  },
  btn: {
    padding: '6px 12px',
    border: `1px solid ${PALETA.borde}`,
    borderRadius: 8,
    background: 'transparent',
    color: PALETA.texto,
    fontSize: 12.5,
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  btnActivo: { background: PALETA.morado, borderColor: PALETA.morado, color: '#fff' },
  btnInactivo: { color: PALETA.textoTenue, cursor: 'not-allowed' },
  iconBtn: {
    border: 'none',
    background: 'transparent',
    color: PALETA.textoSuave,
    cursor: 'pointer',
    padding: 4,
    display: 'inline-flex',
  },
};
