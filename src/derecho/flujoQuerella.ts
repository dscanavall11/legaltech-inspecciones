import type { EstadoQuerella } from '@/features/querellas/types';
import { ARTICULOS } from './normativa';

/**
 * Máquina de estados del trámite de una querella (proceso verbal abreviado,
 * Ley 1801 de 2016, art. 223). Dado el estado actual, indica la próxima
 * actuación procesal para guiar al inspector. La lógica de negocio
 * definitiva y las plantillas las resuelve el backend; aquí modelamos la
 * guía de la interfaz.
 *
 * ⚠️ Las reglas procesales deben validarse con el equipo legal.
 */
export type AccionTipo =
  | 'programar_audiencia'
  | 'registrar_audiencia'
  | 'reagendar_audiencia'
  | 'generar_fallo'
  | 'constancia_ejecutoria'
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
  /** true cuando el caso ya no requiere actuación (firme/archivado). */
  terminal: boolean;
}

export function siguientePaso(estado: EstadoQuerella): PasoFlujo {
  switch (estado) {
    case 'radicada':
    case 'en_tramite':
      return {
        mensaje: `Querella radicada. Profiera el auto que avoca conocimiento y cite a las partes a audiencia pública (${ARTICULOS.procesoVerbalAbreviado}).`,
        acciones: [
          { tipo: 'programar_audiencia', label: 'Citar a audiencia pública', primaria: true },
        ],
        terminal: false,
      };

    case 'audiencia_programada':
      return {
        mensaje:
          'Audiencia pública citada. En la diligencia: invite a las partes a conciliar, decrete y practique las pruebas, escuche los alegatos y profiera la decisión de fondo.',
        acciones: [
          { tipo: 'registrar_audiencia', label: 'Consignar acta de audiencia', primaria: true },
          { tipo: 'reagendar_audiencia', label: 'Aplazar audiencia', primaria: false },
        ],
        terminal: false,
      };

    case 'fallo_emitido':
      return {
        mensaje:
          'Decisión proferida y notificada en estrados. Proceden reposición y apelación; ejecutoriada la decisión, expida la constancia de ejecutoria.',
        acciones: [
          { tipo: 'constancia_ejecutoria', label: 'Expedir constancia de ejecutoria', primaria: true },
        ],
        terminal: false,
      };

    case 'en_firmeza':
      return {
        mensaje:
          'Decisión ejecutoriada y en firme. Verifique el cumplimiento de la orden de policía o medida correctiva impuesta y ordene el archivo del expediente.',
        acciones: [
          { tipo: 'constancia_ejecutoria', label: 'Ver constancia de ejecutoria', primaria: true },
          { tipo: 'archivar', label: 'Ordenar archivo', primaria: false },
        ],
        terminal: false,
      };

    case 'archivada':
      return {
        mensaje: 'Expediente archivado. El trámite concluyó.',
        acciones: [],
        terminal: true,
      };
  }
}
