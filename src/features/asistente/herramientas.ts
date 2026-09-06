import {
  BookOpen,
  CalendarClock,
  Calculator,
  FileText,
  FolderOpen,
  Network,
  Paperclip,
  Route,
  type LucideIcon,
} from 'lucide-react';
import { TIPOS_PROCESO, type TipoProceso } from '@/shared/procesos/types';

/**
 * Catálogo de herramientas que el inspector monta a la derecha del hilo. Cada
 * una monta un componente o un módulo que ya existe en el repo (el mapa
 * clave → componente vive en PilaHerramientas.tsx, para que este módulo se
 * pueda probar sin React).
 *
 * La disponibilidad depende del caso activo: lo que no aplica no se oculta,
 * se muestra deshabilitado con el motivo.
 */

export type ClaveHerramienta =
  | 'documento'
  | 'pruebas'
  | 'documentos'
  | 'multas'
  | 'etapa'
  | 'contador'
  | 'grafo'
  | 'norma';

export interface Herramienta {
  clave: ClaveHerramienta;
  nombre: string;
  descripcion: string;
  icono: LucideIcon;
  /** Requiere un caso activo de cualquier tipo. Implícito cuando hay `tipos`. */
  requiereCaso?: boolean;
  /** Tipos de proceso a los que aplica. Ausente = aplica a cualquiera. */
  tipos?: TipoProceso[];
}

export const HERRAMIENTAS: readonly Herramienta[] = [
  {
    clave: 'documento',
    nombre: 'Documento generado',
    descripcion: 'El proyecto que arma la skill, con su vista previa y la descarga en PDF o Word.',
    icono: FileText,
  },
  {
    clave: 'pruebas',
    nombre: 'Pruebas del expediente',
    descripcion: 'Las pruebas registradas en el caso: consultarlas, verlas y agregar nuevas.',
    icono: Paperclip,
    requiereCaso: true,
  },
  {
    clave: 'documentos',
    nombre: 'Documentos del expediente',
    descripcion: 'Los documentos radicados en el caso, con su visor y su descarga.',
    icono: FolderOpen,
    requiereCaso: true,
  },
  {
    clave: 'multas',
    nombre: 'Liquidador de multas',
    descripcion: 'Valor de la multa general por tipo y causal, con plazos y descuento de pronto pago.',
    icono: Calculator,
    tipos: ['queja', 'comparendo'],
  },
  {
    clave: 'etapa',
    nombre: 'Etapa procesal',
    descripcion: 'El mapa del trámite: en qué estado va el expediente y qué sigue.',
    icono: Route,
    // Solo estos dos trámites tienen su grafo de transiciones modelado en @/derecho.
    tipos: ['querella', 'comparendo'],
  },
  {
    clave: 'contador',
    nombre: 'Contador de términos',
    descripcion: 'Del caso abierto: días hábiles restantes y qué vence.',
    icono: CalendarClock,
    requiereCaso: true,
  },
  {
    clave: 'grafo',
    nombre: 'Grafo argumental',
    descripcion: 'Hechos del expediente y pruebas registradas, con lo que sustenta qué.',
    icono: Network,
    requiereCaso: true,
  },
  {
    clave: 'norma',
    nombre: 'Norma y comportamiento',
    descripcion: 'Catálogo de comportamientos contrarios a la convivencia, con bien jurídico y medidas.',
    icono: BookOpen,
  },
];

// Los labels de TIPOS_PROCESO son singulares; en el motivo se enumeran en
// plural. Vale para querella/queja/comparendo, que son los tipos restringidos.
function enPlural(tipos: TipoProceso[]): string {
  const nombres = tipos.map((t) => `${TIPOS_PROCESO[t].label.toLowerCase()}s`);
  return nombres.length <= 1 ? nombres.join('') : `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`;
}

/** Motivo por el que la herramienta no está disponible, o null si lo está. */
export function motivoNoDisponible(herramienta: Herramienta, tipoCasoActivo: string | null): string | null {
  if (!herramienta.requiereCaso && !herramienta.tipos) return null;
  if (!tipoCasoActivo) return 'Requiere un caso activo';
  if (herramienta.tipos && !herramienta.tipos.includes(tipoCasoActivo as TipoProceso)) {
    return `Solo aplica a ${enPlural(herramienta.tipos)}`;
  }
  return null;
}

export function buscarHerramienta(clave: string): Herramienta | undefined {
  return HERRAMIENTAS.find((h) => h.clave === clave);
}
