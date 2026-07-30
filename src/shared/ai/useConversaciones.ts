import { useCallback, useEffect, useRef, useState } from 'react';
import { uid } from '@/shared/util/uid';
import { enviarMensajeIA, type MensajeChat } from './useAiChat';

export interface Conversacion {
  id: string;
  titulo: string;
  mensajes: MensajeChat[];
  actualizadoEn: string; // ISO
}

const STORAGE_KEY = 'norma-conversaciones';
const MAX_TITULO = 48;

function cargar(): Conversacion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Conversacion[]) : [];
  } catch {
    return [];
  }
}

function guardar(conversaciones: Conversacion[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversaciones));
  } catch {
    // localStorage lleno o no disponible - la conversación sigue funcionando en memoria.
  }
}

function tituloDesde(texto: string): string {
  const limpio = texto.trim().replace(/\s+/g, ' ');
  return limpio.length > MAX_TITULO ? `${limpio.slice(0, MAX_TITULO)}…` : limpio;
}

/**
 * Historial de conversaciones con Norma, tipo ChatGPT: varias conversaciones
 * en paralelo, cada una con su propio hilo. El backend real (legal/chat) no
 * tiene concepto de "conversación" - solo un log continuo por sesión (ver
 * legaltech-chat-history) - así que el historial vive en localStorage, por
 * navegador. Cambiar de conversación reordena la vista; no aísla el
 * contexto que el modelo recuerda server-side por sesión.
 */
export function useConversaciones() {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>(cargar);
  const [activaId, setActivaId] = useState<string | null>(() => cargar()[0]?.id ?? null);
  const [enviando, setEnviando] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    guardar(conversaciones);
  }, [conversaciones]);

  const nueva = useCallback(() => {
    const id = uid();
    setConversaciones((prev) => [
      { id, titulo: 'Nueva conversación', mensajes: [], actualizadoEn: new Date().toISOString() },
      ...prev,
    ]);
    setActivaId(id);
    return id;
  }, []);

  const seleccionar = useCallback((id: string) => setActivaId(id), []);

  const enviar = useCallback(
    async (texto: string, archivos?: File[]) => {
      if (!texto.trim() || enviando) return;

      let id = activaId;
      const esNueva = !id || !conversaciones.some((c) => c.id === id);
      if (esNueva) {
        id = uid();
        setActivaId(id);
      }
      const conversacionId = id as string;

      const idUsuario = uid();
      const idAsistente = uid();

      setConversaciones((prev) => {
        const existe = prev.some((c) => c.id === conversacionId);
        const base: Conversacion = existe
          ? prev.find((c) => c.id === conversacionId)!
          : { id: conversacionId, titulo: tituloDesde(texto), mensajes: [], actualizadoEn: new Date().toISOString() };
        const actualizada: Conversacion = {
          ...base,
          titulo: base.mensajes.length === 0 ? tituloDesde(texto) : base.titulo,
          mensajes: [
            ...base.mensajes,
            { id: idUsuario, rol: 'usuario', contenido: texto },
            { id: idAsistente, rol: 'asistente', contenido: '' },
          ],
          actualizadoEn: new Date().toISOString(),
        };
        const resto = prev.filter((c) => c.id !== conversacionId);
        return [actualizada, ...resto];
      });
      setEnviando(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const respuesta = await enviarMensajeIA(texto, archivos, controller.signal);
        setConversaciones((prev) =>
          prev.map((c) =>
            c.id === conversacionId
              ? { ...c, mensajes: c.mensajes.map((m) => (m.id === idAsistente ? { ...m, contenido: respuesta } : m)) }
              : c,
          ),
        );
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setConversaciones((prev) =>
            prev.map((c) =>
              c.id === conversacionId
                ? {
                    ...c,
                    mensajes: c.mensajes.map((m) =>
                      m.id === idAsistente
                        ? { ...m, contenido: 'Lo siento, hubo un problema al consultar a Norma. Intenta de nuevo.' }
                        : m,
                    ),
                  }
                : c,
            ),
          );
        }
      } finally {
        setEnviando(false);
        abortRef.current = null;
      }
    },
    [activaId, conversaciones, enviando],
  );

  const detener = useCallback(() => abortRef.current?.abort(), []);

  const activa = conversaciones.find((c) => c.id === activaId) ?? null;

  return { conversaciones, activa, activaId, nueva, seleccionar, enviar, detener, enviando };
}
