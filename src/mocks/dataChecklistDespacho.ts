/**
 * Mocks solo se sirven si VITE_ENABLE_MOCKS=true — Task 12 (Configuración del
 * Despacho). Espejo del nodo OKF sincronizado en legalcase (Task 5) y de la
 * resolución de plantillas (Task 7, TemplateResolutionService). El backend
 * real vive en legalcase; la orchestrator BFF aún no expone passthrough para
 * /knowledge-nodes/** ni /template-resolution — se verifica/añade en Task 13.
 */

// Espejo de okf-bundles/roles-profesionales/inspector-policia/checklists/
// configuracion-despacho.yaml — igual al documentBody que legalcase sincroniza
// en legal_knowledge_nodes.
export const CHECKLIST_DESPACHO_YAML = `concept_id: inspector-policia-checklist-configuracion-despacho
title: "Configuración del despacho del inspector"
type: checklist
cerebro: derecho-policia-convivencia
nucleo: checklists
ia_enabled: false
version: "1.0"
items:
  - key: datos-despacho
    label: "Datos del despacho (municipio, inspección, inspector, turno)"
    tipo: formulario
  - key: membrete
    label: "Membrete del despacho (PNG/JPG 800x200, fondo transparente)"
    tipo: archivo
  - key: correo-notificaciones
    label: "Correo institucional para notificaciones electrónicas"
    tipo: formulario
  - key: plantillas-personalizadas
    label: "Plantillas propias del despacho (opcional: reemplazan las de sistema)"
    tipo: plantillas
    documentos:
      - auto-avoca-cita-audiencia
      - auto-decreta-pruebas-suspende
      - auto-inasistencia
      - fallo-comparendo
      - declaracion-testigo
      - constancia-incumplimiento-pronto-pago
      - constancia-incumplimiento-actividad-pedagogica
      - acta-firmeza
`;

export const CHECKLIST_DESPACHO_NODE_MOCK = {
  conceptId: 'inspector-policia-checklist-configuracion-despacho',
  title: 'Configuración del despacho del inspector',
  conceptType: 'checklist',
  brainId: 'derecho-policia-convivencia',
  workspaceType: 'inspector-policia',
  iaEnabled: false,
  lastVerified: null,
  version: '1.0',
  metadataConfig: '{}',
  documentBody: CHECKLIST_DESPACHO_YAML,
  linksTo: '[]',
  sourceKey: 'roles-profesionales/inspector-policia/checklists/configuracion-despacho.yaml',
  syncedAt: '2026-07-01T08:00:00',
};

// Demo de los 3 niveles de la cascada inspector -> oficina -> sistema
// (TemplateResolutionService): 2 documentos personalizados a nivel oficina,
// 1 a nivel inspector y el resto resuelto por la plantilla de sistema.
export const TEMPLATE_RESOLUTION_MOCK = [
  {
    documentKey: 'auto-avoca-cita-audiencia',
    resolvedConceptId: 'workspaces/demo-manizales/formatos/auto-avoca-cita-audiencia/v1',
    resolvedSourceKey: 'workspaces/demo-manizales/formatos/auto-avoca-cita-audiencia/v1.yaml',
    level: 'oficina',
  },
  {
    documentKey: 'auto-decreta-pruebas-suspende',
    resolvedConceptId: 'roles-profesionales/inspector-policia/plantillas/auto-decreta-pruebas-suspende',
    resolvedSourceKey: 'roles-profesionales/inspector-policia/plantillas/auto-decreta-pruebas-suspende.yaml',
    level: 'sistema',
  },
  {
    documentKey: 'auto-inasistencia',
    resolvedConceptId: 'roles-profesionales/inspector-policia/plantillas/auto-inasistencia',
    resolvedSourceKey: 'roles-profesionales/inspector-policia/plantillas/auto-inasistencia.yaml',
    level: 'sistema',
  },
  {
    documentKey: 'fallo-comparendo',
    resolvedConceptId: 'workspaces/demo-manizales/instancias/turno-1/inspectores/demo/formatos/fallo-comparendo/v1',
    resolvedSourceKey:
      'workspaces/demo-manizales/instancias/turno-1/inspectores/demo/formatos/fallo-comparendo/v1.yaml',
    level: 'inspector',
  },
  {
    documentKey: 'declaracion-testigo',
    resolvedConceptId: 'roles-profesionales/inspector-policia/plantillas/declaracion-testigo',
    resolvedSourceKey: 'roles-profesionales/inspector-policia/plantillas/declaracion-testigo.yaml',
    level: 'sistema',
  },
  {
    documentKey: 'constancia-incumplimiento-pronto-pago',
    resolvedConceptId: 'roles-profesionales/inspector-policia/plantillas/constancia-incumplimiento-pronto-pago',
    resolvedSourceKey: 'roles-profesionales/inspector-policia/plantillas/constancia-incumplimiento-pronto-pago.yaml',
    level: 'sistema',
  },
  {
    documentKey: 'constancia-incumplimiento-actividad-pedagogica',
    resolvedConceptId:
      'workspaces/demo-manizales/formatos/constancia-incumplimiento-actividad-pedagogica/v1',
    resolvedSourceKey:
      'workspaces/demo-manizales/formatos/constancia-incumplimiento-actividad-pedagogica/v1.yaml',
    level: 'oficina',
  },
  {
    documentKey: 'acta-firmeza',
    resolvedConceptId: 'roles-profesionales/inspector-policia/plantillas/acta-firmeza',
    resolvedSourceKey: 'roles-profesionales/inspector-policia/plantillas/acta-firmeza.yaml',
    level: 'sistema',
  },
];
