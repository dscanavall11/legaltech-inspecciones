import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TRANSICIONES_COMPARENDO, TRANSICIONES_QUERELLA } from '@/derecho';

/**
 * Drift guard: the hand-mirrored TRANSICIONES_* arrays in this package must
 * stay in sync with the system-of-record machine definition in
 * okf-bundles/brains/derecho-policia-convivencia/maquinas-estado.yaml.
 *
 * This reads that YAML at test time and parses ONLY the `de:`/`a:`/`evento:`
 * rows of the `maquinas.<name>.transiciones` block (a tiny purpose-built
 * parser, not a general YAML parser — js-yaml isn't a project dependency and
 * the file's transition blocks use a single, stable block-style shape).
 * `__convertir__` targets are mapped to 'acta_firmeza', mirroring how the
 * hand-written arrays already model that conversion.
 *
 * Skips gracefully when the sibling okf-bundles checkout isn't present.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BUNDLE_PATH = path.resolve(HERE, '../../../okf-bundles/brains/derecho-policia-convivencia/maquinas-estado.yaml');
const BUNDLE_EXISTS = fs.existsSync(BUNDLE_PATH);

interface YamlTransicion {
  de: string;
  a: string;
  evento: string;
}

/** Strips a leading '- ' list marker, surrounding quotes, and [bracket] list syntax. */
function parseYamlValue(raw: string): string[] {
  const trimmed = raw.trim();
  const unquoted = trimmed.replace(/^["']|["']$/g, '');
  return unquoted.startsWith('[')
    ? unquoted
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim().replace(/^["']|["']$/g, ''))
    : [unquoted];
}

/** Extracts the raw text block of `maquinas.<machineName>` (from its header to the next sibling machine or EOF). */
function extractMachineBlock(yamlText: string, machineName: string): string {
  const lines = yamlText.split(/\r?\n/);
  const startIndex = lines.findIndex((line) => new RegExp(`^  ${machineName}:\\s*$`).test(line));
  if (startIndex === -1) {
    throw new Error(`Machine '${machineName}' not found in ${BUNDLE_PATH}`);
  }
  const afterStart = lines.slice(startIndex + 1);
  const relativeEnd = afterStart.findIndex((line) => /^  \S/.test(line));
  const blockLines = relativeEnd === -1 ? afterStart : afterStart.slice(0, relativeEnd);
  return blockLines.join('\n');
}

/**
 * Parses the `transiciones:` list of a machine block into individual
 * (de, a, evento) rows, expanding any grouped `de:`/`a:` flow lists into
 * the cross product — the same expansion the hand-mirrored arrays apply.
 */
function parseTransitions(machineBlock: string): YamlTransicion[] {
  const transitionsHeaderIndex = machineBlock.indexOf('    transiciones:');
  const transitionsText = machineBlock.slice(transitionsHeaderIndex);
  const lines = transitionsText.split('\n').slice(1);

  const entries: string[][] = [];
  lines.forEach((line) => {
    const isNewEntry = /^\s*-\s*de:/.test(line);
    if (isNewEntry) {
      entries.push([line]);
    } else if (entries.length > 0) {
      entries[entries.length - 1].push(line);
    }
  });

  return entries.flatMap((entryLines) => {
    const fields = new Map<string, string>();
    entryLines.forEach((line) => {
      const match = line.trim().replace(/^-\s*/, '').match(/^(de|a|evento):\s*(.+)$/);
      if (match) {
        fields.set(match[1], match[2]);
      }
    });

    const des = parseYamlValue(fields.get('de') ?? '');
    const targets = parseYamlValue(fields.get('a') ?? '').map((target) =>
      target === '__convertir__' ? 'acta_firmeza' : target,
    );
    const evento = fields.get('evento') ?? '';

    return des.flatMap((de) => targets.map((a) => ({ de, a, evento })));
  });
}

function sortedTriples(transiciones: ReadonlyArray<{ de: string; a: string; evento: string }>): string[] {
  return transiciones.map(({ de, a, evento }) => `${de}|${a}|${evento}`).sort();
}

describe.skipIf(!BUNDLE_EXISTS)('OKF drift guard — maquinas-estado.yaml transitions', () => {
  const bundleText = BUNDLE_EXISTS ? fs.readFileSync(BUNDLE_PATH, 'utf-8') : '';

  it('TRANSICIONES_COMPARENDO matches the comparendo machine in the OKF bundle', () => {
    const expected = parseTransitions(extractMachineBlock(bundleText, 'comparendo'));
    expect(sortedTriples(TRANSICIONES_COMPARENDO)).toEqual(sortedTriples(expected));
  });

  it('TRANSICIONES_QUERELLA matches the querella machine in the OKF bundle', () => {
    const expected = parseTransitions(extractMachineBlock(bundleText, 'querella'));
    expect(sortedTriples(TRANSICIONES_QUERELLA)).toEqual(sortedTriples(expected));
  });
});

if (!BUNDLE_EXISTS) {
  // eslint-disable-next-line no-console
  console.info(
    `[okfMaquinasEstadoDrift.test.ts] Skipped: sibling okf-bundles checkout not found at ${BUNDLE_PATH}.`,
  );
}
