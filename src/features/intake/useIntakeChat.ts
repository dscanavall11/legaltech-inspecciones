import { useCallback, useEffect, useRef, useState } from 'react';
import { tokenActual } from '@/shared/auth/auth';
import { DESPACHO } from '@/derecho';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export interface CasoDraft {
  tipo: '' | 'querella' | 'queja';
  viaProcesal: '' | 'verbal_abreviado' | 'verbal';
  querellante: string;
  querellado: string;
  comportamiento: string;
  articuloInfringido: string;
  direccion: string;
  proximoPaso: string;
  anotaciones: string;
}

export interface ChatMessage {
  rol: 'agente' | 'inspector';
  texto: string;
  streaming?: boolean;
}

const DRAFT_INICIAL: CasoDraft = {
  tipo: '',
  viaProcesal: '',
  querellante: '',
  querellado: '',
  comportamiento: '',
  articuloInfringido: '',
  direccion: '',
  proximoPaso: '',
  anotaciones: '',
};

const CASE_UPDATE_RE = /<case_update>([\s\S]*?)<\/case_update>/;

function parseCaseUpdate(texto: string): Partial<CasoDraft> {
  const match = CASE_UPDATE_RE.exec(texto);
  if (!match) return {};
  try {
    return JSON.parse(match[1]) as Partial<CasoDraft>;
  } catch {
    return {};
  }
}

function limpiarMarcadores(texto: string): string {
  // Remove complete markers first
  let result = texto.replace(/<case_update>[\s\S]*?<\/case_update>/g, '');
  // Remove any partial/open marker still being streamed (no closing tag yet)
  result = result.replace(/<case_update>[\s\S]*/, '');
  return result.trim();
}

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
        const token = tokenActual();
        // legal's /api/legal/recepcion (intakeChat) is multipart (data part +
        // optional files) and returns one ApiResponse<String> reply, not a
        // token stream - no streaming endpoint exists in the real backend yet.
        const body = new FormData();
        body.append('data', texto.trim());
        (archivos ?? []).forEach((archivo) => body.append('files', archivo, archivo.name));
        const res = await fetch(`${API_BASE}/legal/recepcion`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body,
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
          flashFields(Object.keys(actualiza) as (keyof CasoDraft)[]);
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
    draft.tipo !== '' &&
    draft.querellante.trim() !== '' &&
    draft.querellado.trim() !== '' &&
    draft.comportamiento.trim() !== '';

  return { mensajes, draft, setDraft, cargando, recentFields, enviar, completoMinimo };
}
