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
  | 'conceder_apelacion'
  | 'resolver_alzada'
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

export interface TransicionQuerella {
  de: EstadoQuerella;
  a: EstadoQuerella;
  /** No siempre es un AccionTipo (avocar_conocimiento/archivar_anticipado son automáticos, sin botón propio) — string suelto, mismo criterio que evento aquí es solo documentación. */
  evento: string;
  label: string;
}

/**
 * Espejo declarativo — para el mapa navegable (Task 20, mismo patrón que
 * TRANSICIONES_COMPARENDO en flujoComparendo.ts) — de las 15 transiciones del
 * bloque `querella` en maquinas-estado.yaml, expandiendo las 4 entradas con
 * `de:`/`a:` agrupados. `siguientePaso` sigue siendo la fuente de la guía
 * procesal; este arreglo sólo añade la forma de grafo (de -> a).
 */
export const TRANSICIONES_QUERELLA: ReadonlyArray<TransicionQuerella> = [
  { de: 'radicada', a: 'en_tramite', evento: 'avocar_conocimiento', label: 'Avocar conocimiento' },
  { de: 'radicada', a: 'audiencia_programada', evento: 'programar_audiencia', label: 'Citar a audiencia pública' },
  { de: 'en_tramite', a: 'audiencia_programada', evento: 'programar_audiencia', label: 'Citar a audiencia pública' },
  { de: 'audiencia_programada', a: 'audiencia_programada', evento: 'reagendar_audiencia', label: 'Aplazar audiencia' },
  {
    de: 'audiencia_programada',
    a: 'fallo_emitido',
    evento: 'registrar_audiencia',
    label: 'Consignar acta de audiencia',
  },
  { de: 'fallo_emitido', a: 'en_firmeza', evento: 'constancia_ejecutoria', label: 'Expedir constancia de ejecutoria' },
  { de: 'fallo_emitido', a: 'apelado', evento: 'conceder_apelacion', label: 'Conceder recurso de apelación' },
  { de: 'apelado', a: 'confirmado', evento: 'resolver_alzada', label: 'Registrar decisión de segunda instancia' },
  { de: 'apelado', a: 'revocado', evento: 'resolver_alzada', label: 'Registrar decisión de segunda instancia' },
  { de: 'confirmado', a: 'archivada', evento: 'archivar', label: 'Ordenar archivo' },
  { de: 'revocado', a: 'archivada', evento: 'archivar', label: 'Ordenar archivo' },
  { de: 'en_firmeza', a: 'archivada', evento: 'archivar', label: 'Ordenar archivo' },
  { de: 'radicada', a: 'archivada', evento: 'archivar_anticipado', label: 'Ordenar archivo (anticipado)' },
  { de: 'en_tramite', a: 'archivada', evento: 'archivar_anticipado', label: 'Ordenar archivo (anticipado)' },
  { de: 'audiencia_programada', a: 'archivada', evento: 'archivar_anticipado', label: 'Ordenar archivo (anticipado)' },
];

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
          { tipo: 'generar_fallo', label: 'Ver / editar fallo', primaria: false },
          { tipo: 'conceder_apelacion', label: 'Conceder recurso de apelación', primaria: false },
        ],
        terminal: false,
      };

    case 'apelado':
      return {
        mensaje:
          'Recurso de apelación concedido y remitido a segunda instancia. Al resolverse la alzada, registre si la decisión fue confirmada o revocada por el superior.',
        acciones: [
          { tipo: 'resolver_alzada', label: 'Registrar decisión de segunda instancia', primaria: true },
        ],
        terminal: false,
      };

    case 'confirmado':
    case 'revocado':
      return {
        mensaje:
          estado === 'revocado'
            ? 'Decisión revocada en segunda instancia. Dé cumplimiento a lo resuelto por el superior y ordene el archivo del expediente.'
            : 'Decisión confirmada en segunda instancia y en firme. Verifique el cumplimiento de la medida y ordene el archivo del expediente.',
        acciones: [
          { tipo: 'archivar', label: 'Ordenar archivo', primaria: true },
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
