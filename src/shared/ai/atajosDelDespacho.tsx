import { BookOpen, FileCheck2, FilePlus2, FileText } from 'lucide-react';
import { PALETA } from '@/theme/theme';

export interface AtajoDespacho {
  label: string;
  detalle: string;
  ruta: string;
  icono: React.ReactNode;
  color: string;
  fondo: string;
}

/**
 * Los trámites que el inspector alcanza desde el asistente sin salir a buscar
 * el riel.
 *
 * Vivían dentro de `ChatGeneralPage`, y eran lo único que el chat sencillo
 * tenía y el asistente con skills no. Al compartirlos, el asistente pasa a ser
 * un superconjunto del chat y decidir cuál de los dos se queda deja de
 * significar perder algo.
 */
export const ATAJOS_DESPACHO: readonly AtajoDespacho[] = [
  {
    label: 'Radicar querella',
    detalle: 'Intake conversacional',
    ruta: '/panel/nuevo-caso',
    icono: <FilePlus2 size={16} strokeWidth={1.9} />,
    color: PALETA.azul,
    fondo: PALETA.azulBg,
  },
  {
    label: 'Radicar documento',
    detalle: 'Apelaciones y escritos',
    ruta: '/panel/radicador',
    icono: <FileText size={16} strokeWidth={1.9} />,
    color: PALETA.verde,
    fondo: PALETA.verdeBg,
  },
  {
    label: 'Acta de firmeza',
    detalle: 'Multas en firme (art. 223A)',
    ruta: '/panel/actas-firmeza',
    icono: <FileCheck2 size={16} strokeWidth={1.9} />,
    color: PALETA.naranja,
    fondo: PALETA.naranjaBg,
  },
  {
    label: 'Consultar normas',
    detalle: 'Ley 1801 y normativa',
    ruta: '/panel/normas',
    icono: <BookOpen size={16} strokeWidth={1.9} />,
    color: PALETA.morado,
    fondo: PALETA.moradoBg,
  },
] as const;
