import { useCallback, useEffect, useRef, useState } from 'react';
import { contextHeaders } from '@/shared/api/client';
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
    const raw = JSON.parse(match[1]) as Record<string, unknown>;
    // El agente unificado de recepción emite "partes" como arreglo de objetos;
    // la ficha de recursos las muestra como una sola línea de texto.
    const partes = Array.isArray(raw.partes)
      ? raw.partes
          .map((p) => {
            const parte = p as { nombre?: string; rol?: string };
            return [parte.nombre, parte.rol ? `(${parte.rol})` : ''].filter(Boolean).join(' ');
          })
          .join(', ')
      : (raw.partes as string | undefined);
    const campos: Partial<RadicacionDraft> = {
      radicadoOrigen: raw.radicadoOrigen as string | undefined,
      partes: partes || undefined,
      fechaDecision: raw.fechaDecision as string | undefined,
      sustento: raw.sustento as string | undefined,
      fundamentos: raw.fundamentos as string | undefined,
    };
    return Object.fromEntries(
      Object.entries(campos).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    ) as Partial<RadicacionDraft>;
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

      setMensajes((prev) => [
        ...prev,
        { rol: 'inspector', texto: texto.trim() },
        { rol: 'agente', texto: '', streaming: true },
      ]);
      setCargando(true);

      try {
        // Chat único de radicación: /legal/recepcion (multipart) atiende
        // querellas, quejas, actas Y recursos — el <case_update> trae las
        // claves de recurso (radicadoOrigen, sustento, ...) cuando aplica.
        const formData = new FormData();
        formData.append('data', `[Trámite: ${tipo}] ${texto.trim()}`);
        const res = await fetch(`${API_BASE}/legal/recepcion`, {
          method: 'POST',
          headers: contextHeaders(),
          body: formData,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { data: respuesta } = (await res.json()) as { data: string };

        const actualiza = parseCaseUpdate(respuesta);
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
    [cargando, flashFields, tipo],
  );

  const completoMinimo =
    draft.radicadoOrigen.trim() !== '' &&
    draft.partes.trim() !== '' &&
    draft.sustento.trim() !== '';

  return { mensajes, draft, setDraft, cargando, recentFields, enviar, completoMinimo };
}
