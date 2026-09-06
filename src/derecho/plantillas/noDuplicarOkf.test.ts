import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Trinquete contra la duplicación de plantillas.
 *
 * El texto jurídico vive en OKF, donde un abogado puede leerlo y corregirlo en un
 * PR, y desde donde alimenta el RAG. Cuando además se escribe a mano en
 * TypeScript, esa copia sale del circuito: deja de ser revisable por el experto y
 * las dos versiones divergen en silencio.
 *
 * Este test NO exige que la deuda se pague hoy. Exige que no crezca: la lista de
 * abajo solo puede encoger. Si añades un generador de TS para una plantilla que
 * ya existe en OKF, esto se pone rojo.
 *
 * Ojo con la dirección de la migración antes de borrar nada: hay plantillas donde
 * el TypeScript va por delante de OKF, incluso en la norma aplicable. Ver
 * docs/MAESTRO.md, sección 7.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const OKF = join(AQUI, '../../../../okf-bundles/roles-profesionales/inspector-policia/plantillas');

/**
 * Pares OKF↔TS que ya existían al levantar el trinquete (16 ago 2026): clave OKF →
 * archivo del generador que la reescribe. Esta tabla SOLO puede encoger. No añadas
 * entradas: migra a OKF.
 *
 * Casi todos mapean por nombre, pero no todos —`constanciasIncumplimiento.ts` cubre
 * dos plantillas—, así que el par se declara y no se adivina.
 */
const DUPLICADOS_CONOCIDOS: Record<string, string> = {
  'acta-conmutacion': 'actaConmutacion',
  'acta-firmeza': 'actaFirmeza',
  'acta-pronto-pago': 'actaProntoPago',
  'auto-avoca-cita-audiencia': 'autoAvocaCitaAudiencia',
  'auto-decreta-pruebas-suspende': 'autoDecretaPruebasSuspende',
  'auto-inasistencia': 'autoInasistencia',
  'constancia-comparecencia-solicitud': 'constanciaComparecenciaSolicitud',
  'constancia-incumplimiento-actividad-pedagogica': 'constanciasIncumplimiento',
  'constancia-incumplimiento-pronto-pago': 'constanciasIncumplimiento',
  'declaracion-testigo': 'declaracionTestigo',
  'expediente-previo': 'expedientePrevio',
  'fallo-comparendo': 'falloComparendo',
};

/** `acta-pronto-pago` → `actaProntoPago`, que es como se nombran los generadores. */
function aCamelCase(key: string): string {
  return key
    .split('-')
    .map((parte, i) => (i === 0 ? parte : parte.charAt(0).toUpperCase() + parte.slice(1)))
    .join('');
}

function keysDeOkf(): string[] {
  return readdirSync(OKF)
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => f.replace(/\.yaml$/, ''));
}

function generadoresTs(): string[] {
  return readdirSync(AQUI)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
    .map((f) => f.replace(/\.ts$/, ''));
}

describe.skipIf(!existsSync(OKF))('las plantillas OKF no se reescriben en TypeScript', () => {
  it('no aparecen duplicados nuevos', () => {
    const enTs = new Set(generadoresTs());
    const nuevos = keysDeOkf()
      .filter((key) => enTs.has(aCamelCase(key)))
      .filter((key) => !(key in DUPLICADOS_CONOCIDOS));

    expect(
      nuevos,
      'Estas plantillas ya viven en OKF y volvieron a escribirse en TypeScript. ' +
        'Consúmelas por GET /api/template-resolution en vez de duplicarlas.',
    ).toEqual([]);
  });

  it('la lista de deuda no miente: cada entrada sigue siendo un duplicado real', () => {
    const enTs = new Set(generadoresTs());
    const yaResueltos = Object.entries(DUPLICADOS_CONOCIDOS)
      .filter(([, generador]) => !enTs.has(generador))
      .map(([key]) => key);

    expect(
      yaResueltos,
      'Estas plantillas ya no están duplicadas en TypeScript. Bórralas de ' +
        'DUPLICADOS_CONOCIDOS para que el trinquete no las siga tolerando.',
    ).toEqual([]);
  });

  it('encuentra el directorio de plantillas OKF', () => {
    expect(keysDeOkf().length).toBeGreaterThan(0);
  });
});
