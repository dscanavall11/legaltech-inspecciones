import type { EstadoQueja } from './types';

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
        mensaje:
          'Avoca conocimiento y cita a las partes a la audiencia de conciliación.',
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
          'Celebrada la audiencia, registra si las partes llegaron a acuerdo.',
        acciones: [
          {
            tipo: 'registrar_conciliacion',
            label: 'Registrar resultado',
            primaria: true,
          },
        ],
        terminal: false,
      };

    case 'conciliada':
      return {
        mensaje:
          'Las partes llegaron a acuerdo. Archiva el expediente o genera el acta.',
        acciones: [
          { tipo: 'archivar', label: 'Archivar expediente', primaria: true },
        ],
        terminal: false,
      };

    case 'sin_acuerdo':
      return {
        mensaje:
          'No hubo acuerdo en conciliación. Puedes convertir el asunto en querella formal o archivar.',
        acciones: [
          {
            tipo: 'convertir_querella',
            label: 'Convertir en querella',
            primaria: true,
          },
          { tipo: 'archivar', label: 'Archivar', primaria: false },
        ],
        terminal: false,
      };

    case 'archivada':
      return {
        mensaje: 'El expediente fue archivado y el trámite se dio por terminado.',
        acciones: [],
        terminal: true,
      };
  }
}
