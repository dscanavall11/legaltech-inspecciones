import { describe, it, expect } from 'vitest';
import { parseChecklistYaml, derivarEstadoChecklist, type ConfigParaChecklist } from './checklistDespacho';

const YAML_CHECKLIST = `concept_id: inspector-policia-checklist-configuracion-despacho
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

const CONFIG_VACIA: ConfigParaChecklist = {
  municipio: '',
  inspectorNombre: '',
  inspeccion: '',
  membreteDataUrl: null,
  correoNotificaciones: '',
};

describe('parseChecklistYaml — nodo OKF configuracion-despacho.yaml', () => {
  it('parsea los 5 ítems con su label y tipo, en el orden del YAML', () => {
    const items = parseChecklistYaml(YAML_CHECKLIST);
    expect(items.map((i) => i.key)).toEqual([
      'datos-despacho',
      'membrete',
      'correo-notificaciones',
      'plantillas-personalizadas',
    ]);
    expect(items[0].label).toBe('Datos del despacho (municipio, inspección, inspector, turno)');
    expect(items[0].tipo).toBe('formulario');
    expect(items[1].tipo).toBe('archivo');
  });

  it('parsea la lista documentos del ítem plantillas-personalizadas', () => {
    const items = parseChecklistYaml(YAML_CHECKLIST);
    const plantillas = items.find((i) => i.key === 'plantillas-personalizadas');
    expect(plantillas?.documentos).toEqual([
      'auto-avoca-cita-audiencia',
      'auto-decreta-pruebas-suspende',
      'auto-inasistencia',
      'fallo-comparendo',
      'declaracion-testigo',
      'constancia-incumplimiento-pronto-pago',
      'constancia-incumplimiento-actividad-pedagogica',
      'acta-firmeza',
    ]);
  });

  it('devuelve una lista vacía para un documento sin items', () => {
    expect(parseChecklistYaml('concept_id: algo\ntitle: "x"\n')).toEqual([]);
  });
});

describe('derivarEstadoChecklist — done-state de cada ítem', () => {
  const items = parseChecklistYaml(YAML_CHECKLIST);

  it('todo pendiente con la configuración vacía', () => {
    const estado = derivarEstadoChecklist(items, CONFIG_VACIA, 0);
    expect(estado.every((i) => !i.hecho)).toBe(true);
  });

  it('datos-despacho se marca hecho solo cuando los 3 campos están llenos', () => {
    const parcial = derivarEstadoChecklist(
      items,
      { ...CONFIG_VACIA, municipio: 'Manizales', inspectorNombre: 'Juan Pérez' },
      0,
    );
    expect(parcial.find((i) => i.key === 'datos-despacho')?.hecho).toBe(false);

    const completo = derivarEstadoChecklist(
      items,
      { ...CONFIG_VACIA, municipio: 'Manizales', inspectorNombre: 'Juan Pérez', inspeccion: 'Turno Uno' },
      0,
    );
    expect(completo.find((i) => i.key === 'datos-despacho')?.hecho).toBe(true);
  });

  it('membrete se marca hecho solo con membreteDataUrl presente', () => {
    const sinMembrete = derivarEstadoChecklist(items, CONFIG_VACIA, 0);
    expect(sinMembrete.find((i) => i.key === 'membrete')?.hecho).toBe(false);

    const conMembrete = derivarEstadoChecklist(items, { ...CONFIG_VACIA, membreteDataUrl: 'data:image/png;base64,x' }, 0);
    expect(conMembrete.find((i) => i.key === 'membrete')?.hecho).toBe(true);
  });

  it('correo-notificaciones se marca hecho con el campo lleno', () => {
    const completo = derivarEstadoChecklist(items, { ...CONFIG_VACIA, correoNotificaciones: 'inspeccion@municipio.gov.co' }, 0);
    expect(completo.find((i) => i.key === 'correo-notificaciones')?.hecho).toBe(true);
  });

  it('plantillas-personalizadas es opcional: hecho solo si hay al menos una resuelta a nivel oficina/inspector', () => {
    const sinPersonalizar = derivarEstadoChecklist(items, CONFIG_VACIA, 0);
    expect(sinPersonalizar.find((i) => i.key === 'plantillas-personalizadas')?.hecho).toBe(false);

    const conPersonalizadas = derivarEstadoChecklist(items, CONFIG_VACIA, 2);
    expect(conPersonalizadas.find((i) => i.key === 'plantillas-personalizadas')?.hecho).toBe(true);
  });
});
