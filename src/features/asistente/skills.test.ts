import { describe, it, expect } from 'vitest';
import {
  REGLA_NO_INVENTAR,
  SKILLS,
  SKILLS_SUGERIDAS,
  buscarSkill,
  filtrarSkills,
  leerCampos,
  plantillaEntrada,
  type EntradaSkill,
} from './skills';

const DESPACHO = {
  municipio: 'Manizales',
  inspeccion: 'Inspección Permanente de Convivencia y Paz Turno Uno',
  inspectorNombre: 'INSPECTOR DE PRUEBA',
  inspectorCargo: 'Inspector Permanente de Convivencia y Paz',
};

const entrada = (texto: string): EntradaSkill => ({ texto, despacho: DESPACHO, hoy: '2026-06-01' });

describe('registro de skills', () => {
  it('cada clave es un slash command en kebab, único en el registro', () => {
    const claves = SKILLS.map((s) => s.clave);
    expect(new Set(claves).size).toBe(claves.length);
    for (const clave of claves) expect(clave).toMatch(/^\/[a-z]+(-[a-z]+)*$/);
  });

  it('construirPrompt lleva el texto del inspector y la regla de no inventar', () => {
    for (const skill of SKILLS) {
      const prompt = skill.construirPrompt(entrada('Necesito ayuda con el radicado 2026-0001.'));
      expect(prompt).toContain('Necesito ayuda con el radicado 2026-0001.');
      expect(prompt).toContain(REGLA_NO_INVENTAR);
    }
  });

  it('las skills sugeridas en la UI existen en el registro', () => {
    for (const clave of SKILLS_SUGERIDAS) expect(buscarSkill(clave)).toBeDefined();
  });

  it('el menú del compositor solo ofrece skills del registro', () => {
    expect(filtrarSkills('fallo').every((s) => SKILLS.includes(s))).toBe(true);
    expect(filtrarSkills('fallo').map((s) => s.clave)).toContain('/fallo-queja');
    expect(filtrarSkills('')).toHaveLength(SKILLS.length);
  });

  it('la plantilla del compositor pide los campos en el orden declarado', () => {
    const skill = buscarSkill('/fallo-querella')!;
    const lineas = plantillaEntrada(skill).split('\n');
    expect(lineas[0]).toBe('/fallo-querella');
    expect(lineas.slice(1)).toEqual(skill.campos!.map((c) => `${c.etiqueta}: `));
  });

  it('prellena con lo que el caso activo ya sabe y deja pedir el resto', () => {
    const skill = buscarSkill('/fallo-querella')!;
    const lineas = plantillaEntrada(skill, { Radicado: '2026-0007', Querellante: 'JUANA DE PRUEBA' }).split('\n');
    expect(lineas).toContain('Radicado: 2026-0007');
    expect(lineas).toContain('Querellante: JUANA DE PRUEBA');
    expect(lineas).toContain('Querellado: ');
  });

  it('con caso activo el prompt lleva el expediente delante, sin tocar la regla de no inventar', () => {
    const prompt = buscarSkill('/norma')!.construirPrompt({
      ...entrada('¿Qué término tengo?'),
      caso: 'Radicado: 2026-0007\nTipo: querella',
    });
    expect(prompt).toContain('=== EXPEDIENTE ACTIVO ===');
    expect(prompt).toContain('Radicado: 2026-0007');
    expect(prompt.indexOf('EXPEDIENTE ACTIVO')).toBeLessThan(prompt.indexOf('Mensaje del inspector'));
    expect(prompt).toContain(REGLA_NO_INVENTAR);
  });
});

describe('leerCampos', () => {
  it('lee los pares Etiqueta: valor ignorando tildes y mayúsculas', () => {
    const campos = leerCampos('/fallo-querella\nRadicado: 2026-0001\nCÉDULA del querellado: 1.000.000');
    expect(campos.radicado).toBe('2026-0001');
    expect(campos.ceduladelquerellado).toBe('1.000.000');
  });
});

describe('artefactos', () => {
  it('marca como faltante todo dato que el inspector no aportó, sin inventarlo', () => {
    const { documento, faltantes } = buscarSkill('/fallo-querella')!.generarArtefacto!(
      entrada('/fallo-querella\nRadicado: 2026-0001\nQuerellante: JUANA DE PRUEBA'),
    );
    expect(documento?.proceso).toBe('2026-0001');
    expect(faltantes).toContain('Querellado');
    expect(JSON.stringify(documento)).toContain('[FALTA: Querellado]');
  });

  it('no arma el acta de firmeza sin el tipo de multa: no hay valor por defecto que liquidar', () => {
    const skill = buscarSkill('/acta-firmeza')!;
    const sinTipo = skill.generarArtefacto!(entrada('/acta-firmeza\nNro. de comparendo: 123'));
    expect(sinTipo.documento).toBeNull();
    expect(sinTipo.faltantes.join(' ')).toMatch(/Tipo de multa/);

    const conTipo = skill.generarArtefacto!(entrada('/acta-firmeza\nNro. de comparendo: 123\nTipo de multa: 2'));
    expect(conTipo.documento?.tituloDocumento).toBe('ACTA DE FIRMEZA');
    // La liquidación la hace multas.ts, no el prompt: el acta ya trae el valor en letras.
    expect(JSON.stringify(conTipo.documento)).toContain('cuatro (04) salarios mínimos');
  });

  it('el fallo de queja exige el sentido de la decisión: el asistente no la toma por el inspector', () => {
    const skill = buscarSkill('/fallo-queja')!;
    const sinDecision = skill.generarArtefacto!(entrada('/fallo-queja\nTipo de multa: 2'));
    expect(sinDecision.documento).toBeNull();

    const conDecision = skill.generarArtefacto!(
      entrada('/fallo-queja\nTipo de multa: 2\nSentido de la decisión: absuelve\nArtículo y numeral: Artículo 27 Numeral 3'),
    );
    expect(conDecision.documento?.tituloDocumento).toBe('AUDIENCIA DE FALLO');
    // El bien jurídico sale del catálogo del repo, no de la imaginación del modelo.
    expect(JSON.stringify(conDecision.documento)).toContain('vida e integridad');
  });
});
