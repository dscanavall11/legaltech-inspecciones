import { useParams, useNavigate } from 'react-router-dom';
import { Button, Skeleton, Result } from 'antd';
import { useComparendo } from '../api';
import { parseCaseMetadata } from '@/shared/legalCases/types';
import type { ComparendoMetadata } from '../types';
import { generarDocumentoComparendo, tipoDocumentoComparendoDesdeParam } from './documentoComparendo';
import { documentoLegalAAcapites, aplicarAcapitesADocumentoLegal } from '@/shared/documentos/documentoLegalAcapites';
import { generarDocumentoLegalBlob } from '@/shared/documentos/documentoLegalPdf';
import { generarDocumentoLegalDocxBlob } from '@/shared/documentos/documentoLegalDocx';
import { NOMBRE_PLANTILLA } from '@/shared/documentos/ejemploPlantillas';
import { DocumentoEditorPage } from '@/shared/documentos/DocumentoEditorPage';
import { useInspeccionStore } from '@/store/inspeccionStore';
import { resumirDocumento } from '@/features/analisis/api';

/**
 * Wrapper delgado de comparendos sobre el editor de documentos compartido
 * (Task 18, deliverable 3) — /panel/comparendos/:id/documento/:tipo. A
 * diferencia de querellas/documento/DocumentoPage, el documento no viene
 * "por acápites" de fábrica: se genera con datos REALES del expediente
 * (documentoComparendo.ts) como un DocumentoLegal (autos/fallo/constancias) y
 * se convierte a acápites con documentoLegalAcapites.ts — el mismo puente que
 * podrá reutilizar cualquier futuro trámite basado en DocumentoLegal.
 */
export function DocumentoComparendoPage() {
  const { id = '', tipo } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useComparendo(id);
  const membreteDataUrl = useInspeccionStore((s) => s.config.membreteDataUrl);

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }
  if (isError || !data) {
    return (
      <Result
        status="404"
        title="Comparendo no encontrado"
        extra={
          <Button type="primary" onClick={() => navigate('/panel/comparendos')}>
            Volver a comparendos
          </Button>
        }
      />
    );
  }

  const tipoDocumento = tipoDocumentoComparendoDesdeParam(tipo);
  const meta = parseCaseMetadata<ComparendoMetadata>(data.caseMetadataRaw ?? null);
  const doc = tipoDocumento ? generarDocumentoComparendo(tipoDocumento, data, meta) : null;

  if (!tipoDocumento || !doc) {
    return (
      <Result
        status="warning"
        title="Este documento aún no está disponible"
        subTitle="La actuación que lo produce todavía no se ha registrado en este expediente."
        extra={
          <Button type="primary" onClick={() => navigate(`/panel/comparendos/${id}`)}>
            Volver al expediente
          </Button>
        }
      />
    );
  }

  const titulo = NOMBRE_PLANTILLA[tipoDocumento] ?? doc.tituloDocumento;

  return (
    <DocumentoEditorPage
      caseId={id}
      documentoKey={tipoDocumento}
      radicado={data.radicado}
      titulo={titulo}
      encabezado={doc.entidad}
      acapites={documentoLegalAAcapites(doc)}
      caseMetadataRaw={data.caseMetadataRaw}
      volverA={`/panel/comparendos/${id}`}
      volverLabel="Volver al expediente"
      generarBlob={(acapitesEfectivos) =>
        generarDocumentoLegalBlob(aplicarAcapitesADocumentoLegal(doc, acapitesEfectivos), membreteDataUrl)
      }
      generarDocx={(acapitesEfectivos) =>
        generarDocumentoLegalDocxBlob(aplicarAcapitesADocumentoLegal(doc, acapitesEfectivos), membreteDataUrl)
      }
      nombreArchivo={() => `${titulo} ${data.radicado}.pdf`}
      generarResumen={resumirDocumento}
    />
  );
}
