import { describe, it, expect } from 'vitest';
import { nombreArchivoActaFirmezaOficial } from './actaFirmezaOficial';

describe('nombreArchivoActaFirmezaOficial — capitalización exacta "Acta de FIRMEZA" (compartida por individual y masivo)', () => {
  it('coincide EXACTAMENTE con el ejemplo pedido por el despacho', () => {
    expect(nombreArchivoActaFirmezaOficial('2026-12371', 'ANDRES FELIPE CARDENAS AGUIRRE')).toBe(
      'Acta de FIRMEZA. QUEJA 2026-12371. ANDRES FELIPE CARDENAS AGUIRRE.docx',
    );
  });

  it('"Acta de" en capitalización normal y "FIRMEZA" en mayúsculas, sin importar el nombre/queja', () => {
    const nombre = nombreArchivoActaFirmezaOficial('2026-1', 'otro nombre');
    expect(nombre.startsWith('Acta de FIRMEZA. QUEJA ')).toBe(true);
    expect(nombre).not.toMatch(/^ACTA DE FIRMEZA/);
    expect(nombre).not.toMatch(/^Acta de Firmeza/);
  });

  it('conserva el resto del patrón: número de queja, nombre completo en mayúsculas, extensión .docx', () => {
    expect(nombreArchivoActaFirmezaOficial('2026-6829', 'ANDRÉS FELIPE CÁRDENAS AGUIRRE')).toBe(
      'Acta de FIRMEZA. QUEJA 2026-6829. ANDRES FELIPE CARDENAS AGUIRRE.docx',
    );
  });
});
