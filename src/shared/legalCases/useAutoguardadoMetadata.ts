import { useEffect, useMemo, useRef, useState } from 'react';
import { useUpdateCaseFields } from './api';
import { buildCaseMetadata, parseCaseMetadata } from './types';

/** Suficiente para no perder trabajo, sin un PATCH por tecla. */
const ESPERA_MS = 1200;

export type EstadoAutoguardado = 'guardado' | 'sin_guardar' | 'guardando' | 'error';

/**
 * Autoguarda una clave de `caseMetadata` con debounce, fusionando siempre con
 * el resto del blob. Lo usaban por separado orientaciones, partes y audiencia
 * con tres copias del mismo mecanismo: mismo debounce, mismo ref de "última
 * versión persistida" y el mismo cuidado de no pisar cambios locales cuando el
 * expediente se refresca.
 *
 * `leer` debe ser estable o memoizada por el llamador — se usa para derivar el
 * valor remoto cada vez que cambia `caseMetadataRaw`.
 */
export function useAutoguardadoMetadata<T>(opts: {
  caseId: string;
  caseMetadataRaw: string | null | undefined;
  /** Clave dentro de caseMetadata donde vive el valor. */
  clave: string;
  /** Extrae el valor guardado del blob crudo. */
  leer: (raw: string | null | undefined) => T;
  /**
   * Se ejecuta cuando el valor quedó realmente persistido. Lo usa quien además
   * de guardar en el blob tiene que proyectar el dato a una tabla propia
   * (p. ej. las partes, que también viven en `case_parties`); así la
   * proyección va atada al guardado y no a un segundo debounce que se
   * desincroniza.
   */
  alGuardar?: (valor: T) => void;
}): { valor: T; setValor: (v: T) => void; estado: EstadoAutoguardado } {
  const { caseId, caseMetadataRaw, clave, leer, alGuardar } = opts;
  const alGuardarRef = useRef(alGuardar);
  alGuardarRef.current = alGuardar;
  const actualizarCampos = useUpdateCaseFields();

  const remoto = useMemo(() => leer(caseMetadataRaw), [leer, caseMetadataRaw]);

  const [valor, setValor] = useState<T>(remoto);
  const [error, setError] = useState(false);
  const persistido = useRef(JSON.stringify(remoto));

  // El expediente puede refrescarse mientras la pestaña está abierta: solo se
  // adopta el valor remoto si no hay cambios locales sin guardar.
  useEffect(() => {
    const sinCambiosLocales = JSON.stringify(valor) === persistido.current;
    persistido.current = JSON.stringify(remoto);
    return sinCambiosLocales ? setValor(remoto) : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoto]);

  useEffect(() => {
    const serializado = JSON.stringify(valor);
    if (serializado === persistido.current) return;

    const temporizador = setTimeout(() => {
      const metaActual = parseCaseMetadata<Record<string, unknown>>(caseMetadataRaw ?? null);
      actualizarCampos.mutate(
        {
          id: caseId,
          fields: { caseMetadata: buildCaseMetadata({ ...metaActual, [clave]: valor }) },
        },
        {
          onSuccess: () => {
            persistido.current = serializado;
            setError(false);
            alGuardarRef.current?.(valor);
          },
          onError: () => setError(true),
        },
      );
    }, ESPERA_MS);

    return () => clearTimeout(temporizador);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor, caseId, clave]);

  const estado: EstadoAutoguardado = error
    ? 'error'
    : actualizarCampos.isPending
      ? 'guardando'
      : JSON.stringify(valor) === persistido.current
        ? 'guardado'
        : 'sin_guardar';

  return { valor, setValor, estado };
}

export const LEYENDA_AUTOGUARDADO: Record<EstadoAutoguardado, string> = {
  guardado: 'Guardado',
  sin_guardar: 'Sin guardar',
  guardando: 'Guardando…',
  error: 'No se pudo guardar',
};
