import { useCallback, useRef, useState } from 'react';

export interface MensajeChat {
  id: string;
  rol: 'usuario' | 'asistente';
  contenido: string;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

/**
 * Hook del asistente IA. Habla con el backend Spring AI por streaming
 * (respuesta token-a-token vía ReadableStream), para que el inspector vea
 * la respuesta aparecer en vivo en lugar de esperar en blanco.
 *
 * Contrato esperado del backend: POST /ai/chat -> text/plain en streaming.
 * El payload incluye el contexto del caso para respuestas situadas (RAG).
 */
export function useAiChat(contextoCaso?: { tipo: string; id: string }) {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [enviando, setEnviando] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const enviar = useCallback(
    async (texto: string) => {
      if (!texto.trim() || enviando) return;

      const idUsuario = crypto.randomUUID();
      const idAsistente = crypto.randomUUID();

      setMensajes((prev) => [
        ...prev,
        { id: idUsuario, rol: 'usuario', contenido: texto },
        { id: idAsistente, rol: 'asistente', contenido: '' },
      ]);
      setEnviando(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`${BASE_URL}/legal/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mensaje: texto, contexto: contextoCaso }),
          signal: controller.signal,
        });

        if (!res.body) throw new Error('Respuesta sin cuerpo');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMensajes((prev) =>
            prev.map((m) =>
              m.id === idAsistente
                ? { ...m, contenido: m.contenido + chunk }
                : m,
            ),
          );
        }
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
