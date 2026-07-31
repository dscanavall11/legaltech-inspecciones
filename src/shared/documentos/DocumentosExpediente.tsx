import { useState } from 'react';
import { Button, Upload, Typography, App, Tooltip, Skeleton, Alert } from 'antd';
import {
  FilePdfOutlined,
  FileWordOutlined,
  FileImageOutlined,
  AudioOutlined,
  FileOutlined,
  DownloadOutlined,
  PlusOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import dayjs from 'dayjs';
import { CASE_DOCUMENT_ORIGIN_LABEL, type CaseDocument, type CaseDocumentType } from './types';
import { useCaseDocuments, useUploadCaseDocument, getCaseDocumentDownloadUrl } from './api';
import { VisorLateral } from './VisorLateral';
import { PALETA } from '@/theme/theme';

const { Text } = Typography;

const TYPE_STYLE: Record<CaseDocumentType, { icono: ReactNode; color: string; fondo: string }> = {
  PDF: { icono: <FilePdfOutlined />, color: PALETA.rojo, fondo: PALETA.rojoBg },
  WORD: { icono: <FileWordOutlined />, color: PALETA.azul, fondo: PALETA.azulBg },
  IMAGEN: { icono: <FileImageOutlined />, color: PALETA.verde, fondo: PALETA.verdeBg },
  AUDIO: { icono: <AudioOutlined />, color: PALETA.morado, fondo: PALETA.moradoBg },
  OTRO: { icono: <FileOutlined />, color: PALETA.textoSuave, fondo: '#efede7' },
};

function FilaDocumento({
  doc,
  onVer,
  onDescargar,
}: {
  doc: CaseDocument;
  onVer: () => void;
  onDescargar: () => void;
}) {
  const estilo = TYPE_STYLE[doc.fileType];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 14px',
        borderRadius: 16,
        transition: 'background 0.2s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f7f9fc')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 13,
          background: estilo.fondo,
          color: estilo.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 19,
          flexShrink: 0,
        }}
      >
        {estilo.icono}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: PALETA.texto,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {doc.fileName}
        </div>
        <div style={{ fontSize: 12, color: PALETA.textoTenue }}>
          {CASE_DOCUMENT_ORIGIN_LABEL[doc.origin]} · {dayjs(doc.date).format('D [de] MMMM, YYYY')}
          {doc.fileSize ? ` · ${doc.fileSize}` : ''}
        </div>
      </div>
      {doc.fileType === 'PDF' && (
        <Tooltip title="Ver">
          <Button type="text" shape="circle" icon={<EyeOutlined />} onClick={onVer} aria-label={`Ver ${doc.fileName}`} />
        </Tooltip>
      )}
      <Tooltip title="Descargar">
        <Button
          type="text"
          shape="circle"
          icon={<DownloadOutlined />}
          onClick={onDescargar}
          aria-label={`Descargar ${doc.fileName}`}
        />
      </Tooltip>
    </div>
  );
}

/**
 * Explorador de documentos del expediente: lista lo archivado en S3 (via
 * legaltech-tools, correlacionado en legalcase) y permite incorporar nuevas
 * piezas. Sin estado local que finja ser el expediente - todo viene del
 * backend real.
 */
export function DocumentosExpediente({ caseId }: { caseId: string }) {
  const { message } = App.useApp();
  const { data: documentos, isLoading, isError } = useCaseDocuments(caseId);
  const subir = useUploadCaseDocument(caseId);
  const [docEnVista, setDocEnVista] = useState<CaseDocument | null>(null);
  const [urlVista, setUrlVista] = useState<string | null>(null);

  async function verDocumento(doc: CaseDocument) {
    setDocEnVista(doc);
    try {
      setUrlVista(await getCaseDocumentDownloadUrl(caseId, doc.storageKey));
    } catch {
      message.error('No se pudo abrir el documento.');
      setDocEnVista(null);
    }
  }

  async function descargarDocumento(doc: CaseDocument) {
    try {
      const url = await getCaseDocumentDownloadUrl(caseId, doc.storageKey);
      window.open(url, '_blank', 'noopener');
    } catch {
      message.error('No se pudo descargar el documento.');
    }
  }

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} style={{ marginTop: 4 }} />;
  }

  if (isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="No se pudo cargar el expediente digital."
        style={{ marginTop: 4 }}
      />
    );
  }

  return (
    <div style={{ marginTop: 4 }}>
      {!documentos || documentos.length === 0 ? (
        <div style={{ padding: '28px 0 20px', textAlign: 'center' }}>
          <Text type="secondary">
            El expediente aún no tiene documentos. Incorpora la primera pieza procesal.
          </Text>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, margin: '0 -14px' }}>
          {documentos.map((d) => (
            <FilaDocumento
              key={d.id}
              doc={d}
              onVer={() => verDocumento(d)}
              onDescargar={() => descargarDocumento(d)}
            />
          ))}
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <Upload
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx,.mp3,.wav"
          showUploadList={false}
          beforeUpload={(file) => {
            subir.mutate(file, {
              onSuccess: () => message.success(`«${file.name}» incorporado al expediente.`),
              onError: () => message.error(`No se pudo subir «${file.name}».`),
            });
            return false; // subimos nosotros mismos via useUploadCaseDocument
          }}
        >
          <Button icon={<PlusOutlined />} loading={subir.isPending}>
            Incorporar documento
          </Button>
        </Upload>
      </div>

      <VisorLateral
        titulo={docEnVista?.fileName}
        abierto={docEnVista !== null}
        archivo={urlVista}
        onCerrar={() => {
          setDocEnVista(null);
          setUrlVista(null);
        }}
      />
    </div>
  );
}
