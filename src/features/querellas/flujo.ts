import type { EstadoQuerella } from './types';

/**
 * Máquina de estados del trámite de una querella (proceso verbal abreviado,
 * Ley 1801). Dado el estado actual, indica el "siguiente paso ideal" para
 * guiar al inspector. La lógica de negocio definitiva y las plantillas las
 * resuelve el backend; aquí modelamos la guía de la interfaz.
 *
 * ⚠️ Las reglas procesales deben validarse con el equipo legal.
 */
export type AccionTipo =
  | 'programar_audiencia'
  | 'registrar_audiencia'
  | 'reagendar_audiencia'
  | 'generar_fallo'
  | 'generar_acta'
  | 'archivar';

export interface Accion {
  tipo: AccionTipo;
  label: string;
  primaria: boolean;
}

export interface PasoFlujo {
  /** Mensaje que contextualiza en qué punto del trámite está el caso. */
  mensaje: string;
  acciones: Accion[];
  /** true cuando el caso ya no requiere acción (firme/archivado). */
  terminal: boolean;
}

export function siguientePaso(estado: EstadoQuerella): PasoFlujo {
  switch (estado) {
    case 'radicada':
    case 'en_tramite':
      return {
        mensaje:
          'La querella está en trámite. El siguiente paso es programar la audiencia pública.',
        acciones: [
          { tipo: 'programar_audiencia', label: 'Programar audiencia', primaria: true },
        ],
        terminal: false,
      };

    case 'audiencia_programada':
      return {
        mensaje:
          'Hay una audiencia programada. Registra su resultado. Si el querellado no comparece, podrás imponer la medida correctiva y proferir el fallo.',
        acciones: [
          { tipo: 'registrar_audiencia', label: 'Registrar audiencia', primaria: true },
          { tipo: 'reagendar_audiencia', label: 'Reagendar', primaria: false },
        ],
        terminal: false,
      };

    case 'fallo_emitido':
      return {
        mensaje:
          'Fallo proferido. Una vez ejecutoriado (vencido el término de recursos), genera el acta de firmeza.',
        acciones: [
          { tipo: 'generar_acta', label: 'Generar acta de firmeza', primaria: true },
        ],
        terminal: false,
      };

    case 'en_firmeza':
      return {
        mensaje:
          'La decisión está en firme. Puedes generar el acta de firmeza o archivar el expediente.',
        acciones: [
          { tipo: 'generar_acta', label: 'Ver acta de firmeza', primaria: true },
          { tipo: 'archivar', label: 'Archivar', primaria: false },
        ],
        terminal: false,
      };

    case 'archivada':
      return {
        mensaje: 'Este expediente está archivado.',
        acciones: [],
        terminal: true,
      };
  }
}
