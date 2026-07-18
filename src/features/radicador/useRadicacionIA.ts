import { useCallback, useEffect, useRef, useState } from 'react';
import { tokenActual } from '@/shared/auth/auth';
import { DESPACHO } from '@/derecho';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export type TipoRadicacionIA = 'apelacion' | 'fallo';

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

const CASE_UPDATE_RE = /<case_update>([\s\S]*?)<\/case_update>/;

function parseCaseUpdate(texto: string): Partial<RadicacionDraft> {
  const match = CASE_UPDATE_RE.exec(texto);
  if (!match) return {};
  try {
    return JSON.parse(match[1]) as Partial<RadicacionDraft>;
  } catch {
    return {};
  }
}

function limpiarMarcadores(texto: string): string {
  let result = texto.replace(/<case_update>[\s\S]*?<\/case_update>/g, '');
  result = result.replace(/<case_update>[\s\S]*/, '');
  return result.trim();
}

/**
 * Hook de chat guiado para radicar Apelación y Fallo de 2ª instancia.
 * Replica el patrón de useIntakeChat (streaming + <case_update>) pero con
 * los campos propios de estos trámites. HITL: el humano aporta los datos
 * fácticos; la IA solo redacta la fundamentación jurídica (campo sustento).
 */
export function useRadicacionIA(tipo: TipoRadicacionIA) {
  const titulo = tipo === 'apelacion' ? 'apelación' : 'fallo de segunda instancia';
  const [mensajes, setMensajes] = useState<ChatMessageIA[]>([
    {
      rol: 'agente',
      texto: `Buenos días. Soy el asistente de radicación de la ${DESPACHO.nombre}. Voy a ayudarle a redactar la ${titulo}. Cuénteme los hechos: ¿cuál es el radicado de la decisión de primera instancia y quiénes son las partes?`,
    },
  ]);
  const [draft, setDraft] = useState<RadicacionDraft>(DRAFT_INICIAL);
  const [cargando, setCargando] = useState(false);
  const [recentFields, setRecentFields] = useState<Set<keyof RadicacionDraft>>(new Set());
  const turnoRef = useRef(0);
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
    async (texto: string) => {
      if (!texto.trim() || cargando) return;
      const turno = turnoRef.current;
      turnoRef.current += 1;

      setMensajes((prev) => [
        ...prev,
        { rol: 'inspector', texto: texto.trim() },
        { rol: 'agente', texto: '', streaming: true },
      ]);
      setCargando(true);

      try {
        const token = tokenActual();
        const res = await fetch(`${API_BASE}/intake/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ mensaje: texto.trim(), turno, tipo }),
        });

        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acumulado = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acumulado += decoder.decode(value, { stream: true });
          const visible = limpiarMarcadores(acumulado);
          setMensajes((prev) => {
            const copia = [...prev];
            copia[copia.length - 1] = { rol: 'agente', texto: visible, streaming: true };
            return copia;
          });
        }

        const actualiza = parseCaseUpdate(acumulado);
        const visible = limpiarMarcadores(acumulado);
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
    [cargando, flashFields, tipo],
  );

  const completoMinimo =
    draft.radicadoOrigen.trim() !== '' &&
    draft.partes.trim() !== '' &&
    draft.sustento.trim() !== '';

  return { mensajes, draft, setDraft, cargando, recentFields, enviar, completoMinimo };
}
