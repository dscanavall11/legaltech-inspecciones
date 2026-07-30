import { describe, it, expect } from 'vitest';
import { siguientePasoComparendo, ESTADO_DESTINO_RESOLVER_RECURSOS, CONVERSION_ACTA_FIRMEZA } from '@/derecho';
import type { EstadoComparendo } from '@/derecho';

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
