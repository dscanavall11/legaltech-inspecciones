// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from 'antd';
import { DocumentosExpediente } from './DocumentosExpediente';
import type { CaseDocument } from './types';

/**
 * Prueba de la corrección pedida por ChatGPT sobre PR #2 (inspecciones-redesign):
 * un expediente FINALIZADO debe seguir permitiendo consultar (ver, descargar)
 * pero no mutar (subir, retirar). No hay bloqueo global de eventos -- cada
 * paso decide qué ocultar según `readOnly` (ver shared/expediente/tipos.ts).
 * Se mockea `./api` para no arrastrar React Query: lo que se prueba es la UI
 * condicional de DocumentosExpediente, no la red.
 */

const documentoFijo: CaseDocument = {
  id: 'd1',
  fileName: 'querella.pdf',
  fileType: 'PDF',
  origin: 'radicacion',
  date: '2026-08-01',
  fileSize: null,
  storageKey: 'key-1',
};

vi.mock('./api', () => ({
  useCaseDocuments: () => ({ data: [documentoFijo], isLoading: false, isError: false }),
  useUploadCaseDocument: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteCaseDocument: () => ({ mutate: vi.fn(), isPending: false }),
  getCaseDocumentDownloadUrl: vi.fn().mockResolvedValue('https://example.com/doc.pdf'),
}));

// VisorLateral arrastra pdfjs-dist, que en su import de nivel de módulo asume
// un canvas de navegador (DOMMatrix) que jsdom no provee. Este test no abre
// el visor -- solo importa el módulo por composición -- así que se mockea.
vi.mock('./VisorLateral', () => ({
  VisorLateral: () => null,
}));

afterEach(cleanup);

function renderar(readOnly: boolean) {
  return render(
    <App>
      <DocumentosExpediente caseId="c1" readOnly={readOnly} />
    </App>,
  );
}

describe('DocumentosExpediente respeta readOnly sin bloquear la consulta', () => {
  it('con readOnly: Ver y Descargar siguen habilitados', () => {
    renderar(true);
    const ver = screen.getByLabelText('Ver querella.pdf') as HTMLButtonElement;
    const descargar = screen.getByLabelText('Descargar querella.pdf') as HTMLButtonElement;
    expect(ver.disabled).toBe(false);
    expect(descargar.disabled).toBe(false);
  });

  it('con readOnly: no hay control para subir ni para retirar el documento', () => {
    renderar(true);
    expect(screen.queryByText('Incorporar documento')).toBeNull();
    expect(screen.queryByLabelText('Retirar querella.pdf del expediente')).toBeNull();
  });

  it('sin readOnly: los controles de mutación sí están presentes', () => {
    renderar(false);
    expect(screen.queryByText('Incorporar documento')).not.toBeNull();
    expect(screen.queryByLabelText('Retirar querella.pdf del expediente')).not.toBeNull();
  });
});
