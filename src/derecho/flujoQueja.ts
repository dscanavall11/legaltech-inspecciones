import type { EstadoQueja } from '@/features/quejas/types';
import { ARTICULOS } from './normativa';

/**
 * Máquina de estados del trámite de una queja (mediación y conciliación
 * ante el inspector, Ley 1801 de 2016, arts. 231 a 233). Si la conciliación
 * fracasa, el asunto puede tomar la vía de querella por proceso verbal
 * abreviado.
 *
 * ⚠️ Las reglas procesales deben validarse con el equipo legal.
 */
export type AccionQuejaTipo =
  | 'citar_conciliacion'
  | 'registrar_conciliacion'
  | 'convertir_querella'
  | 'archivar';

export interface AccionQueja {
  tipo: AccionQuejaTipo;
  label: string;
  primaria: boolean;
}

export interface PasoFlujoQueja {
  mensaje: string;
  acciones: AccionQueja[];
  terminal: boolean;
}

export function siguientePasoQueja(estado: EstadoQueja): PasoFlujoQueja {
  switch (estado) {
    case 'radicada':
    case 'en_tramite':
      return {
        mensaje: `Queja radicada. Avoque conocimiento y cite a las partes a audiencia de conciliación (${ARTICULOS.conciliacion}).`,
        acciones: [
          {
            tipo: 'citar_conciliacion',
            label: 'Citar a conciliación',
            primaria: true,
          },
        ],
        terminal: false,
      };

    case 'conciliacion_programada':
      return {
        mensaje:
          'Audiencia de conciliación citada. Celebrada la diligencia, suscriba el acta de conciliación o deje constancia de no acuerdo.',
        acciones: [
          {
            tipo: 'registrar_conciliacion',
            label: 'Suscribir acta de conciliación',
            primaria: true,
          },
        ],
        terminal: false,
      };

    case 'conciliada':
      return {
        mensaje:
          'Las partes conciliaron. El acta presta mérito ejecutivo y hace tránsito a cosa juzgada; ordene el archivo del expediente.',
        acciones: [
          { tipo: 'archivar', label: 'Ordenar archivo', primaria: true },
        ],
        terminal: false,
      };

    case 'sin_acuerdo':
      return {
        mensaje:
          'No hubo ánimo conciliatorio. Puede dar a la queja trámite de querella mediante proceso verbal abreviado, u ordenar el archivo.',
        acciones: [
          {
            tipo: 'convertir_querella',
            label: 'Dar trámite de querella',
            primaria: true,
          },
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
