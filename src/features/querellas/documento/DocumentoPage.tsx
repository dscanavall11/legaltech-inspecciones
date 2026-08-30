import { useParams, useNavigate } from 'react-router-dom';
import { Button, Skeleton, Result } from 'antd';
import { useQuerella } from '../api';
import { construirDocumento, type TipoDocumento } from './acapites';
import { documentoPdfBlob, nombreArchivoDocumento } from './documentoPdf';
import { DocumentoEditorPage } from '@/shared/documentos/DocumentoEditorPage';
import { resumirDocumento } from '@/features/analisis/api';

// Estado al que avanza el caso cuando se expide la constancia de ejecutoria
// (ver flujoQuerella: fallo_emitido --constancia_ejecutoria--> en_firmeza).
const ESTADO_TRAS_FIRMA: Partial<Record<TipoDocumento, string>> = { constancia: 'en_firmeza' };

/**
 * Wrapper delgado de querellas sobre el editor de documentos compartido
 * (Task 18) — mismo URL y UX de siempre (/panel/querellas/:id/documento/:tipo,
 * navegación de acápites + Resumen IA), ahora con edición humana por acápite.
 * El único conocimiento de "querella" que queda aquí es construir el
 * DocumentoGenerado a partir del expediente y su pipeline de PDF
 * (documentoPdf.ts) — el resto vive en DocumentoEditorPage.
 */
export function DocumentoPage() {
  const { id = '', tipo = 'fallo' } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuerella(id);

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }
  if (isError || !data) {
    return (
      <Result
        status="404"
        title="Expediente no encontrado"
        extra={
          <Button type="primary" onClick={() => navigate('/panel/querellas')}>
            Volver a querellas
          </Button>
        }
      />
    );
  }

  const doc = construirDocumento(tipo as TipoDocumento, data);
  const estadoDestino = ESTADO_TRAS_FIRMA[tipo as TipoDocumento];

  return (
    <DocumentoEditorPage
      caseId={id}
      documentoKey={tipo}
      radicado={data.radicado}
      titulo={doc.titulo}
      encabezado={doc.inspeccion}
      acapites={doc.acapites}
      caseMetadataRaw={data.caseMetadataRaw}
      volverA={`/panel/querellas/${id}`}
      volverLabel="Volver al expediente"
      generarBlob={(acapitesEfectivos) => documentoPdfBlob({ ...doc, acapites: acapitesEfectivos }, data.radicado)}
      nombreArchivo={(acapitesEfectivos) => nombreArchivoDocumento({ ...doc, acapites: acapitesEfectivos }, data.radicado)}
      generarResumen={resumirDocumento}
      aprobarYFirmar={{
        estadoDestino,
        navigateTrasFirmar: `/panel/querellas/${id}`,
        mensajeExito: 'Documento firmado y archivado como versión en el expediente.',
      }}
    />
  );
}
