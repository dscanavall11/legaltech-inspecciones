import { useCallback, useEffect, useRef, useState } from 'react';
import { DESPACHO } from '@/derecho';
import { pedirRecepcion, type ParteRecepcion } from '@/shared/recepcion/api';
import { leerCaseUpdate, limpiarMarcadores, soloLoQueTrae } from '@/shared/recepcion/marcadores';

export interface RadicacionDraft {
  radicadoOrigen: string;
  partes: string;
  fechaDecision: string;
  sustento: string;
  fundamentos: string;
}

export interface ChatMessageIA {
  rol: 'agente' | 'inspector';
  texto: string;
  streaming?: boolean;
}

const DRAFT_INICIAL: RadicacionDraft = {
  radicadoOrigen: '',
  partes: '',
  fechaDecision: '',
  sustento: '',
  fundamentos: '',
};

/** El `<case_update>` del agente, con las claves propias del recurso. */
interface CaseUpdateRecurso {
  radicadoOrigen?: string;
  partes?: ParteRecepcion[] | string;
  fechaDecision?: string;
  sustento?: string;
  fundamentos?: string;
}

/**
 * El agente devuelve las partes como arreglo de objetos; la ficha del recurso
 * las muestra en una sola línea.
 */
const partesEnUnaLinea = (partes: CaseUpdateRecurso['partes']): string | undefined =>
  Array.isArray(partes)
    ? partes
        .map((p) => [p.nombre, p.rol ? `(${p.rol})` : ''].filter(Boolean).join(' '))
        .filter((linea) => linea.trim().length > 0)
        .join(', ')
    : partes;

function camposDeLaRespuesta(respuesta: string): Partial<RadicacionDraft> {
  const bruto = leerCaseUpdate<CaseUpdateRecurso>(respuesta);
  if (!bruto) return {};
  return soloLoQueTrae<RadicacionDraft>({
    radicadoOrigen: bruto.radicadoOrigen,
    partes: partesEnUnaLinea(bruto.partes),
    fechaDecision: bruto.fechaDecision,
    sustento: bruto.sustento,
    fundamentos: bruto.fundamentos,
  } as RadicacionDraft);
}

/**
 * Chat guiado para radicar la apelación. Habla con el mismo agente de
 * recepción que el chat de querellas y quejas —mismo protocolo de marcadores,
 * en `shared/recepcion`— y lo que cambia es la ficha que se llena.
 *
 * HITL: el humano aporta los hechos; la IA redacta la fundamentación jurídica.
 */
export function useRadicacionIA() {
  const [mensajes, setMensajes] = useState<ChatMessageIA[]>([
    {
      rol: 'agente',
      texto: `Buenos días. Soy el asistente de radicación de la ${DESPACHO.nombre}. Voy a ayudarle a radicar la apelación. Adjunte el escrito del recurso y la decisión apelada, o cuénteme los hechos: ¿cuál es el radicado de la decisión de primera instancia y quiénes son las partes?`,
    },
  ]);
  const [draft, setDraft] = useState<RadicacionDraft>(DRAFT_INICIAL);
  const [cargando, setCargando] = useState(false);
  const [recentFields, setRecentFields] = useState<Set<keyof RadicacionDraft>>(new Set());
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    },
    [],
  );

  const flashFields = useCallback((campos: (keyof RadicacionDraft)[]) => {
    if (campos.length === 0) return;
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setRecentFields(new Set(campos));
    flashTimerRef.current = setTimeout(() => setRecentFields(new Set()), 2200);
  }, []);

  const enviar = useCallback(
    async (texto: string, archivos?: File[]) => {
      if (!texto.trim() || cargando) return;

      setMensajes((prev) => [
        ...prev,
        { rol: 'inspector', texto: texto.trim() },
        { rol: 'agente', texto: '', streaming: true },
      ]);
      setCargando(true);

      try {
        // Los adjuntos VIAJAN. Antes se quedaban en la pantalla: el inspector
        // subía el escrito del recurso, el agente nunca lo veía y la ficha
        // seguía vacía sin que nada explicara por qué.
        const respuesta = await pedirRecepcion({
          texto: `[Trámite: apelacion] ${texto.trim()}`,
          archivos,
        });

        const actualiza = camposDeLaRespuesta(respuesta);
        const visible = limpiarMarcadores(respuesta);
        setMensajes((prev) => {
          const copia = [...prev];
          copia[copia.length - 1] = { rol: 'agente', texto: visible };
          return copia;
        });

        if (Object.keys(actualiza).length > 0) {
          setDraft((prev) => ({ ...prev, ...actualiza }));
          flashFields(Object.keys(actualiza) as (keyof RadicacionDraft)[]);
        }
      } catch {
        setMensajes((prev) => {
          const copia = [...prev];
          copia[copia.length - 1] = {
            rol: 'agente',
            texto: 'Hubo un error al procesar la solicitud. Por favor intente de nuevo.',
          };
          return copia;
        });
      } finally {
        setCargando(false);
      }
    },
    [cargando, flashFields],
  );

  const completoMinimo =
    draft.radicadoOrigen.trim() !== '' &&
    draft.partes.trim() !== '' &&
    draft.sustento.trim() !== '';

  return { mensajes, draft, setDraft, cargando, recentFields, enviar, completoMinimo };
}
