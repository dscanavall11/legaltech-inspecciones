import { useCallback, useEffect, useRef, useState } from 'react';
import { DESPACHO } from '@/derecho';
import { pedirRecepcion } from '@/shared/recepcion/api';
import { leerCaseFiled, leerCaseUpdate, limpiarMarcadores } from '@/shared/recepcion/marcadores';

export interface CasoParte {
  rol: string;
  tipoId: string | null;
  numeroId: string | null;
  nombre: string;
}

// Espeja el <case_update> que emite legal/recepcionRules.st (ver
// IntakeCaseCreationGate.IntakeUpdate) campo a campo. Es solo lectura: el
// inspector ve el progreso que la IA va extrayendo de la conversación, no lo
// edita a mano - el estado real vive en legalcase una vez radicado.
export interface CasoDraft {
  tipoSolicitud: string | null;
  listoParaRadicar: boolean;
  radicado: string | null;
  juzgado: string | null;
  ciudad: string | null;
  hechos: string | null;
  pretension: string | null;
  partes: CasoParte[];
  estadoSugerido: string | null;
  categorias: string[];
  observaciones: string | null;
}

export interface ChatMessage {
  rol: 'agente' | 'inspector';
  texto: string;
  streaming?: boolean;
}

export interface CasoRadicado {
  id: string;
  filingNumber: string;
  currentStateCode: string;
  readyForFallo: boolean;
}

const DRAFT_INICIAL: CasoDraft = {
  tipoSolicitud: null,
  listoParaRadicar: false,
  radicado: null,
  juzgado: null,
  ciudad: null,
  hechos: null,
  pretension: null,
  partes: [],
  estadoSugerido: null,
  categorias: [],
  observaciones: null,
};

export function useIntakeChat() {
  const [mensajes, setMensajes] = useState<ChatMessage[]>([
    {
      rol: 'agente',
      texto:
        `Buenos días. Soy el asistente de radicación de la ${DESPACHO.nombre}. ¿Cuál es el motivo de su solicitud hoy?`,
    },
  ]);
  const [draft, setDraft] = useState<CasoDraft>(DRAFT_INICIAL);
  const [cargando, setCargando] = useState(false);
  const [recentFields, setRecentFields] = useState<Set<keyof CasoDraft>>(new Set());
  const [casoRadicado, setCasoRadicado] = useState<CasoRadicado | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    },
    [],
  );

  const flashFields = useCallback((campos: (keyof CasoDraft)[]) => {
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
        // Sin caseId: este ES el chat de radicacion, el unico que puede abrir
        // el expediente cuando el agente marca listoParaRadicar.
        const respuesta = await pedirRecepcion({ texto: texto.trim(), archivos });

        const actualiza = leerCaseUpdate<CasoDraft>(respuesta) ?? {};
        const radicado = leerCaseFiled<CasoRadicado>(respuesta);
        const visible = limpiarMarcadores(respuesta);

        setMensajes((prev) => {
          const copia = [...prev];
          copia[copia.length - 1] = { rol: 'agente', texto: visible };
          return copia;
        });

        if (Object.keys(actualiza).length > 0) {
          setDraft((prev) => ({ ...prev, ...actualiza }));
          flashFields(Object.keys(actualiza) as (keyof CasoDraft)[]);
        }
        if (radicado) setCasoRadicado(radicado);
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

  return { mensajes, draft, cargando, recentFields, enviar, casoRadicado };
}
