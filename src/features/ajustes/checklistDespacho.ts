/**
 * Checklist "Configuración del despacho" — renderizado a partir del nodo OKF
 * inspector-policia-checklist-configuracion-despacho (ver okf-bundles/
 * roles-profesionales/inspector-policia/checklists/configuracion-despacho.yaml),
 * nunca hardcodeado en la UI: los 5 ítems y sus etiquetas vienen del YAML.
 *
 * Funciones puras (parseo + derivación de estado) para poder testearlas sin
 * red ni react-query — la página solo las orquesta.
 */

export type TipoItemChecklist = 'formulario' | 'archivo' | 'plantillas';

export interface ChecklistItemOkf {
  key: string;
  label: string;
  tipo: TipoItemChecklist;
  /** Solo presente en el ítem `plantillas-personalizadas` — claves de documentoLegal. */
  documentos?: string[];
}

/**
 * Parser deliberadamente estrecho para la forma fija de este checklist
 * (`items: [{ key, label, tipo, documentos? }]`) — no es un parser YAML
 * genérico. js-yaml no es dependencia del proyecto (ver package.json) y esta
 * forma es simple y estable, así que no vale la pena añadirla solo para esto.
 */
export function parseChecklistYaml(yaml: string): ChecklistItemOkf[] {
  const lineas = yaml.split(/\r?\n/);
  const items: ChecklistItemOkf[] = [];
  let actual: ChecklistItemOkf | null = null;
  let enDocumentos = false;

  for (const linea of lineas) {
    const inicioItem = linea.match(/^\s*-\s+key:\s*(\S+)\s*$/);
    if (inicioItem) {
      if (actual) items.push(actual);
      actual = { key: inicioItem[1], label: '', tipo: 'formulario' };
      enDocumentos = false;
      continue;
    }
    if (!actual) continue;

    const label = linea.match(/^\s+label:\s*"?([^"]*?)"?\s*$/);
    if (label) {
      actual.label = label[1];
      enDocumentos = false;
      continue;
    }

    const tipo = linea.match(/^\s+tipo:\s*(\S+)\s*$/);
    if (tipo) {
      actual.tipo = tipo[1] as TipoItemChecklist;
      enDocumentos = false;
      continue;
    }

    if (/^\s+documentos:\s*$/.test(linea)) {
      actual.documentos = [];
      enDocumentos = true;
      continue;
    }

    if (enDocumentos) {
      const doc = linea.match(/^\s+-\s+(\S+)\s*$/);
      if (doc) {
        actual.documentos!.push(doc[1]);
        continue;
      }
      enDocumentos = false;
    }
  }
  if (actual) items.push(actual);
  return items;
}

/** Subconjunto de ConfigInspeccion que necesita la derivación de estado (desacopla del store). */
export interface ConfigParaChecklist {
  municipio: string;
  inspectorNombre: string;
  inspeccion: string;
  membreteDataUrl: string | null;
  correoNotificaciones: string;
}

export interface ChecklistItemEstado extends ChecklistItemOkf {
  hecho: boolean;
}

const lleno = (v: string | null | undefined): boolean => Boolean(v && v.trim());

/**
 * `plantillasPersonalizadasCount`: cuántas plantillas del despacho (nivel
 * oficina/inspector) resolvió /template-resolution — el ítem es opcional
 * (el checklist lo marca "reemplazan las de sistema"), así que se marca
 * hecho solo cuando el despacho efectivamente personalizó alguna.
 */
export function derivarEstadoChecklist(
  items: ChecklistItemOkf[],
  config: ConfigParaChecklist,
  plantillasPersonalizadasCount: number,
): ChecklistItemEstado[] {
  return items.map((item) => ({ ...item, hecho: estaHecho(item.key, config, plantillasPersonalizadasCount) }));
}

function estaHecho(key: string, config: ConfigParaChecklist, plantillasPersonalizadasCount: number): boolean {
  switch (key) {
    case 'datos-despacho':
      return lleno(config.municipio) && lleno(config.inspectorNombre) && lleno(config.inspeccion);
    case 'membrete':
      return Boolean(config.membreteDataUrl);
    case 'correo-notificaciones':
      return lleno(config.correoNotificaciones);
    case 'plantillas-personalizadas':
      return plantillasPersonalizadasCount > 0;
    default:
      return false;
  }
}
