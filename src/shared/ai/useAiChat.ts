import { useCallback, useRef, useState } from 'react';
import { contextHeaders } from '@/shared/api/client';
import { uid } from '@/shared/util/uid';
import { cargarContextoCaso } from './contextoCaso';

export interface MensajeChat {
  id: string;
  rol: 'usuario' | 'asistente';
  contenido: string;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Llamada cruda a /api/legal/chat (Norma) - reusada por useAiChat y
 * useConversaciones. Multipart siempre (como /recepcion): Norma corre sobre
 * Gemini Flash, que admite archivos adjuntos (imagen, PDF, texto) en el
 * mismo turno de chat.
 */
export async function enviarMensajeIA(texto: string, archivos?: File[], signal?: AbortSignal): Promise<string> {
  const body = new FormData();
  body.append('data', texto);
  (archivos ?? []).forEach((archivo) => body.append('files', archivo, archivo.name));
  const res = await fetch(`${BASE_URL}/legal/chat`, {
    method: 'POST',
    headers: contextHeaders(),
    body,
    signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { data } = (await res.json()) as ApiEnvelope<string>;
  return data;
}

/**
 * Hook del asistente IA. Habla con /api/legal/chat (LegalProcessService.
 * complementChat: flash agent, Gemini, con contexto OKF de la oficina
 * resuelto server-side por sesión) - un único ApiResponse<String>, no hay
 * endpoint de streaming en el backend real todavía.
 *
 * El backend no acepta un caseId/tipo aparte (complementChat solo toma el
 * texto), así que el contexto del expediente se antepone al mensaje mismo -
 * no es tan preciso como un parámetro dedicado, pero es honesto: la IA sí
 * lo lee, a diferencia de la promesa de "RAG situado" que había antes.
 */
export function useAiChat(contextoCaso?: { tipo: string; id: string }) {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [enviando, setEnviando] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  // Contexto del expediente resuelto una vez por caso (datos + digest saneado).
  const contextoRef = useRef<{ id: string; ctx: string | null } | null>(null);

  const enviar = useCallback(
    async (texto: string, archivos?: File[]) => {
      if (!texto.trim() || enviando) return;

      const idUsuario = uid();
      const idAsistente = uid();

      setMensajes((prev) => [
        ...prev,
        { id: idUsuario, rol: 'usuario', contenido: texto },
        { id: idAsistente, rol: 'asistente', contenido: '' },
      ]);
      setEnviando(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        let contexto: string | null = null;
        if (contextoCaso) {
          if (contextoRef.current?.id !== contextoCaso.id) {
            contextoRef.current = { id: contextoCaso.id, ctx: await cargarContextoCaso(contextoCaso.id) };
          }
          contexto = contextoRef.current.ctx;
        }

        const mensajeConContexto =
          contextoCaso && contexto
            ? `Actúa como asistente jurídico del inspector y responde su consulta apoyándote en este expediente.\n\n=== EXPEDIENTE (${contextoCaso.tipo}) ===\n${contexto}\n=== FIN DEL EXPEDIENTE ===\n\nConsulta: ${texto}`
            : contextoCaso
              ? `Sobre el caso ${contextoCaso.tipo} ${contextoCaso.id}: ${texto}`
              : texto;

        const respuesta = await enviarMensajeIA(mensajeConContexto, archivos, controller.signal);

        setMensajes((prev) =>
          prev.map((m) => (m.id === idAsistente ? { ...m, contenido: respuesta } : m)),
        );
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setMensajes((prev) =>
            prev.map((m) =>
              m.id === idAsistente
                ? {
                    ...m,
                    contenido:
                      'Lo siento, hubo un problema al consultar el asistente. Intenta de nuevo.',
                  }
                : m,
            ),
          );
        }
      } finally {
        setEnviando(false);
        abortRef.current = null;
      }
    },
    [contextoCaso, enviando],
  );

  const detener = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { mensajes, enviar, detener, enviando };
}
