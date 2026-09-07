import { describe, it, expect } from 'vitest';
import { generarTextoCierreActa, textoCierrePlano, type DatosCierreActa } from './textoCierreActa';

const BASE: DatosCierreActa = {
  nombre: 'ANDRÉS FELIPE CÁRDENAS AGUIRRE',
  queja: '2026-12371',
  fechaActaLetras: 'siete (07) de septiembre de dos mil veintiséis (2026)',
  tipoMulta: 4,
  causal: 'ninguna',
};

describe('generarTextoCierreActa — plantilla determinística exacta suministrada por el despacho, sin IA', () => {
  it('sin reincidencia: texto exacto', () => {
    const texto = textoCierrePlano(generarTextoCierreActa(BASE)!);
    expect(texto).toBe(
      'Una vez cumplido el término establecido en el literal e) del Artículo 223A de la Ley 1801, ' +
        'ante la no objeción de la medida correctiva de multa por parte del (la) ciudadano(a) ANDRÉS FELIPE CÁRDENAS AGUIRRE, ' +
        'el despacho mediante acta Nro. 2026-12371 de fecha siete (07) de septiembre de dos mil veintiséis (2026), ' +
        'DECLARA LA FIRMEZA de la multa general tipo 4.',
    );
  });

  it('reincidencia 50% (después del año): texto exacto', () => {
    const texto = textoCierrePlano(generarTextoCierreActa({ ...BASE, causal: 'reiteracion_despues_del_anio' })!);
    expect(texto).toBe(
      'Una vez cumplido el término establecido en el literal e) del Artículo 223A de la Ley 1801, ' +
        'ante la no objeción de la medida correctiva de multa por parte del (la) ciudadano(a) ANDRÉS FELIPE CÁRDENAS AGUIRRE, ' +
        'el despacho mediante acta Nro. 2026-12371 de fecha siete (07) de septiembre de dos mil veintiséis (2026), ' +
        'DECLARA LA FIRMEZA de la multa general tipo 4, la cual, de conformidad con lo dispuesto en los literales i) y j) ' +
        'del artículo Ibídem, se incrementa en un 50% por reincidencia.',
    );
  });

  it('reincidencia 75% (dentro del año): texto exacto', () => {
    const texto = textoCierrePlano(generarTextoCierreActa({ ...BASE, causal: 'reiteracion_dentro_del_anio' })!);
    expect(texto).toBe(
      'Una vez cumplido el término establecido en el literal e) del Artículo 223A de la Ley 1801, ' +
        'ante la no objeción de la medida correctiva de multa por parte del (la) ciudadano(a) ANDRÉS FELIPE CÁRDENAS AGUIRRE, ' +
        'el despacho mediante acta Nro. 2026-12371 de fecha siete (07) de septiembre de dos mil veintiséis (2026), ' +
        'DECLARA LA FIRMEZA de la multa general tipo 4, la cual, de conformidad con lo dispuesto en los literales i) y j) ' +
        'del artículo Ibídem, se incrementa en un 75% por reincidencia en el mismo comportamiento dentro del mismo año.',
    );
  });

  it('moroso_bdme: no hay redacción suministrada por el despacho — no se inventa, devuelve null', () => {
    expect(generarTextoCierreActa({ ...BASE, causal: 'moroso_bdme' })).toBeNull();
  });

  it('marca en negrilla exactamente NOMBRE, QUEJA, FECHA_ACTA, "DECLARA LA FIRMEZA", TIPO_MULTA y el porcentaje', () => {
    const segmentos = generarTextoCierreActa({ ...BASE, causal: 'reiteracion_dentro_del_anio' })!;
    const negrilla = segmentos.filter((s) => s.negrilla).map((s) => s.texto);
    expect(negrilla).toEqual(['ANDRÉS FELIPE CÁRDENAS AGUIRRE', '2026-12371', 'siete (07) de septiembre de dos mil veintiséis (2026)', 'DECLARA LA FIRMEZA', 'tipo 4', '75%']);
  });

  it('reutiliza exactamente el nombre/queja/tipo/causal recibidos — no vuelve a pedir ni recalcula nada', () => {
    const otro: DatosCierreActa = { nombre: 'OTRO NOMBRE', queja: '2026-1', fechaActaLetras: 'x', tipoMulta: 2, causal: 'ninguna' };
    const texto = textoCierrePlano(generarTextoCierreActa(otro)!);
    expect(texto).toContain('OTRO NOMBRE');
    expect(texto).toContain('2026-1');
    expect(texto).toContain('tipo 2');
  });
});
