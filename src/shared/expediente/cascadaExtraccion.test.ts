import { beforeEach, describe, expect, it, vi } from 'vitest';

// pdfjs trae un worker que no arranca en el entorno de test; lo que se prueba
// aquí es el ORDEN de la cascada, no el parseo del PDF (eso ya lo cubre
// features/actas).
const extraerComparendoPdf = vi.fn();
vi.mock('@/features/actas/extraerComparendoPdf', () => ({
  extraerComparendoPdf: (a: File) => extraerComparendoPdf(a),
}));

const buscarEnBd = vi.fn();
vi.mock('@/shared/comparendos/store', () => ({ buscarEnBd: (n?: string) => buscarEnBd(n) }));

const { leerDocumentoSinIa, leerDocumentosSinIa } = await import('./cascadaExtraccion');

const pdf = (nombre = 'comparendo.pdf') => new File(['%PDF'], nombre);

const DEL_PDF = {
  datos: { comparendo: '17-001-6-2026-1234', solicitado: 'QUIEN OBJETO', cedula: '1000000001' },
  camposDetectados: [],
  textoDisponible: true,
};

beforeEach(() => {
  extraerComparendoPdf.mockReset();
  buscarEnBd.mockReset().mockReturnValue(undefined);
});

describe('leerDocumentoSinIa', () => {
  it('lee el comparendo del texto del PDF, sin gastar el modelo', async () => {
    extraerComparendoPdf.mockResolvedValue(DEL_PDF);
    const r = await leerDocumentoSinIa(pdf());
    expect(r?.fuente).toBe('documento');
    expect(r?.partes[0].fullName).toBe('QUIEN OBJETO');
    expect(r?.comparendo?.comparendo).toBe('17-001-6-2026-1234');
  });

  // La base del despacho trae más campos y son los suyos, no los que se
  // pudieron adivinar de una página.
  it('cuando el comparendo ya está en la base, gana la base', async () => {
    extraerComparendoPdf.mockResolvedValue(DEL_PDF);
    buscarEnBd.mockReturnValue({
      comparendo: '17-001-6-2026-1234',
      solicitado: 'NOMBRE DE LA BASE',
      cedula: '9',
      articuloNumeral: 'Artículo 27 Numeral 1',
      solicitante: 'CAI CENTRO',
    });
    const r = await leerDocumentoSinIa(pdf());
    expect(r?.fuente).toBe('bd');
    expect(r?.partes[0].fullName).toBe('NOMBRE DE LA BASE');
    expect(r?.comparendo?.articuloNumeral).toBe('Artículo 27 Numeral 1');
  });

  // Un escaneo sin capa de texto es justo el caso en que hace falta la IA:
  // devolver null es lo que deja que la cascada siga.
  it('un PDF sin texto extraíble cede el turno', async () => {
    extraerComparendoPdf.mockResolvedValue({ datos: {}, camposDetectados: [], textoDisponible: false });
    expect(await leerDocumentoSinIa(pdf())).toBeNull();
  });

  it('un PDF legible del que no sale nada útil también cede el turno', async () => {
    extraerComparendoPdf.mockResolvedValue({ datos: {}, camposDetectados: [], textoDisponible: true });
    expect(await leerDocumentoSinIa(pdf())).toBeNull();
  });

  it('lo que no es PDF ni se intenta', async () => {
    expect(await leerDocumentoSinIa(new File(['x'], 'acta.docx'))).toBeNull();
    expect(extraerComparendoPdf).not.toHaveBeenCalled();
  });
});

describe('leerDocumentosSinIa', () => {
  it('se queda con el primer documento que sí se deja leer', async () => {
    extraerComparendoPdf
      .mockResolvedValueOnce({ datos: {}, camposDetectados: [], textoDisponible: false })
      .mockResolvedValueOnce(DEL_PDF);
    const r = await leerDocumentosSinIa([pdf('escaneo.pdf'), pdf('comparendo.pdf')]);
    expect(r?.partes[0].fullName).toBe('QUIEN OBJETO');
  });

  // Un PDF corrupto no puede tumbar la extracción de los demás.
  it('un documento que revienta no arrastra al resto', async () => {
    extraerComparendoPdf
      .mockRejectedValueOnce(new Error('pdf corrupto'))
      .mockResolvedValueOnce(DEL_PDF);
    expect((await leerDocumentosSinIa([pdf('roto.pdf'), pdf('bueno.pdf')]))?.fuente).toBe('documento');
  });

  it('sin nada legible devuelve null y le toca a la IA', async () => {
    extraerComparendoPdf.mockResolvedValue({ datos: {}, camposDetectados: [], textoDisponible: false });
    expect(await leerDocumentosSinIa([pdf()])).toBeNull();
  });
});
