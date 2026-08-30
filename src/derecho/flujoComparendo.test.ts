import { describe, it, expect } from 'vitest';
import {
  siguientePasoComparendo,
  ESTADO_DESTINO_RESOLVER_RECURSOS,
  CONVERSION_ACTA_FIRMEZA,
  TRANSICIONES_COMPARENDO,
} from '@/derecho';
import type { EstadoComparendo, AccionComparendoTipo } from '@/derecho';

const TODOS_LOS_EVENTOS: AccionComparendoTipo[] = [
  'verificar_comparendo',
  'abrir_termino_objecion',
  'registrar_impugnacion',
  'suscribir_acta_pronto_pago',
  'suscribir_acta_conmutacion',
  'constancia_no_objecion',
  'generar_acta_firmeza',
  'avocar_y_citar_audiencia',
  'reagendar_audiencia',
  'instalar_audiencia',
  'decretar_pruebas',
  'constancia_inasistencia',
  'emitir_fallo',
  'reanudar_audiencia',
  'admitir_justa_causa',
  'fallo_por_inasistencia',
  'conceder_recursos',
  'constancia_ejecutoria',
  'resolver_recursos',
  'confirmar_pago',
  'constancia_incumplimiento_pago',
  'confirmar_actividad',
  'constancia_incumplimiento_actividad',
  'remitir_cobro_coactivo',
  'archivar',
  'terminar_por_inactividad',
];

const TODOS_LOS_ESTADOS: EstadoComparendo[] = [
  'recibido',
  'verificado',
  'en_espera_objecion',
  'objetado',
  'pronto_pago_acordado',
  'conmutacion_acordada',
  'sin_objecion',
  'audiencia_programada',
  'en_audiencia',
  'suspendida_pruebas',
  'suspendida_inasistencia',
  'fallo_emitido',
  'en_recurso',
  'en_firmeza',
  'incumplimiento_constatado',
  'terminado_inactividad',
  'archivado',
];

describe('siguientePasoComparendo — comparendo (arts. 180, 222, 223, 223A Ley 1801/2016)', () => {
  it('en espera de objeción ofrece exactamente 4 acciones', () => {
    const paso = siguientePasoComparendo('en_espera_objecion');
    expect(paso.acciones).toHaveLength(4);
    expect(paso.terminal).toBe(false);
  });

  it('la guía de registrar_impugnacion advierte la pérdida del pronto pago', () => {
    const paso = siguientePasoComparendo('en_espera_objecion');
    expect(paso.mensaje).toContain('se pierde el beneficio del descuento por pronto pago');
  });

  it('objetado propone una única acción primaria: avocar_y_citar_audiencia', () => {
    const paso = siguientePasoComparendo('objetado');
    expect(paso.acciones).toHaveLength(1);
    expect(paso.acciones[0].tipo).toBe('avocar_y_citar_audiencia');
    expect(paso.acciones[0].primaria).toBe(true);
  });

  it('suspendida por inasistencia ofrece admitir justa causa o fallar de fondo', () => {
    const tipos = siguientePasoComparendo('suspendida_inasistencia').acciones.map((a) => a.tipo);
    expect(tipos).toContain('admitir_justa_causa');
    expect(tipos).toContain('fallo_por_inasistencia');
  });

  it('archivado es un estado terminal sin acciones', () => {
    const paso = siguientePasoComparendo('archivado');
    expect(paso.terminal).toBe(true);
    expect(paso.acciones).toHaveLength(0);
  });

  it('todo estado no terminal ofrece al menos una acción', () => {
    for (const estado of TODOS_LOS_ESTADOS) {
      const paso = siguientePasoComparendo(estado);
      if (!paso.terminal) {
        expect(paso.acciones.length).toBeGreaterThan(0);
      }
    }
  });
});

// Pin del mapa evento -> estado (comparendo) contra la máquina declarativa en
// okf-bundles/brains/derecho-policia-convivencia/maquinas-estado.yaml.
// SiguientePasoComparendo.tsx consume estas mismas constantes — un cambio
// accidental del destino de una transición rompe este test antes de llegar a
// producción.
describe('mapa evento -> estado (comparendo) — espejo de maquinas-estado.yaml', () => {
  it('resolver_recursos destina siempre a en_firmeza (única transición del YAML para en_recurso)', () => {
    expect(ESTADO_DESTINO_RESOLVER_RECURSOS).toBe('en_firmeza');
  });

  it('generar_acta_firmeza es convierte_a (caseType + estado inicial), no una transición in-place', () => {
    expect(CONVERSION_ACTA_FIRMEZA).toEqual({ caseType: 'acta_firmeza', estadoInicial: 'pendiente' });
    // El bug corregido: no debe fijar el comparendo en_firmeza directamente.
    expect(CONVERSION_ACTA_FIRMEZA.estadoInicial).not.toBe('en_firmeza');
  });
});

// TRANSICIONES_COMPARENDO (Task 15 — mapa navegable): espejo declarativo de
// las 27 entradas del bloque `comparendo` en maquinas-estado.yaml. Una sola
// entrada agrupa `de: [audiencia_programada, en_audiencia, suspendida_pruebas]`
// para terminar_por_inactividad; expandida da 27 - 1 + 3 = 29 filas.
describe('TRANSICIONES_COMPARENDO — espejo de maquinas-estado.yaml (comparendo)', () => {
  it('tiene exactamente 29 transiciones (27 del YAML, con el de: agrupado expandido)', () => {
    expect(TRANSICIONES_COMPARENDO).toHaveLength(29);
  });

  it('todo EstadoComparendo aparece al menos una vez, como origen o como destino', () => {
    const mencionados = new Set(
      TRANSICIONES_COMPARENDO.flatMap((t) => [t.de, t.a]).filter((e): e is EstadoComparendo => e !== 'acta_firmeza'),
    );
    for (const estado of TODOS_LOS_ESTADOS) {
      expect(mencionados.has(estado)).toBe(true);
    }
  });

  it('todo evento referenciado existe en AccionComparendoTipo', () => {
    const eventosValidos = new Set(TODOS_LOS_EVENTOS);
    for (const t of TRANSICIONES_COMPARENDO) {
      expect(eventosValidos.has(t.evento)).toBe(true);
    }
  });

  it('resolver_recursos (en_recurso -> en_firmeza) está presente — mismo destino que ESTADO_DESTINO_RESOLVER_RECURSOS', () => {
    const transicion = TRANSICIONES_COMPARENDO.find((t) => t.evento === 'resolver_recursos');
    expect(transicion?.de).toBe('en_recurso');
    expect(transicion?.a).toBe(ESTADO_DESTINO_RESOLVER_RECURSOS);
  });

  it('generar_acta_firmeza destina a la marca acta_firmeza, no a un EstadoComparendo', () => {
    const transicion = TRANSICIONES_COMPARENDO.find((t) => t.evento === 'generar_acta_firmeza');
    expect(transicion?.de).toBe('sin_objecion');
    expect(transicion?.a).toBe('acta_firmeza');
  });

  it('terminar_por_inactividad expande a sus tres orígenes agrupados en el YAML', () => {
    const origenes = TRANSICIONES_COMPARENDO.filter((t) => t.evento === 'terminar_por_inactividad').map((t) => t.de);
    expect(origenes.sort()).toEqual(['audiencia_programada', 'en_audiencia', 'suspendida_pruebas'].sort());
  });
});
