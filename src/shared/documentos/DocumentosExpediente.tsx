import { useState } from 'react';
import { Button, Upload, Typography, App, Tooltip, Skeleton, Alert, Popconfirm } from 'antd';
import {
  FilePdfOutlined,
  FileWordOutlined,
  FileImageOutlined,
  AudioOutlined,
  FileOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import dayjs from 'dayjs';
import { CASE_DOCUMENT_ORIGIN_LABEL, type CaseDocument, type CaseDocumentType } from './types';
import {
  useCaseDocuments,
  useDeleteCaseDocument,
  useUploadCaseDocument,
  getCaseDocumentDownloadUrl,
} from './api';
import { VisorLateral } from './VisorLateral';
import { PALETA } from '@/theme/theme';
import { RADIO, TEXTO } from '@/theme/escala';
import {
  ACEPTA_EXPEDIENTE,
  avisoDeRechazo,
  avisoDeTamano,
  esFormatoDeExpediente,
  excedeElTope,
} from './formatos';

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
  onEliminar,
  eliminando,
}: {
  doc: CaseDocument;
  onVer: () => void;
  onDescargar: () => void;
  onEliminar: () => void;
  eliminando: boolean;
}) {
  const estilo = TYPE_STYLE[doc.fileType];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 14px',
        borderRadius: RADIO.bloque,
        transition: 'background 0.2s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f7f9fc')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: RADIO.control,
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
        <div style={{ fontSize: TEXTO.nota, color: PALETA.textoTenue }}>
          {doc.origin ? CASE_DOCUMENT_ORIGIN_LABEL[doc.origin] : 'Origen no registrado'}
          {doc.date ? ` · ${dayjs(doc.date).format('D [de] MMMM, YYYY')}` : ''}
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
      {/* Se confirma porque no hay deshacer: el archivo y su gemelo Markdown
          salen de S3, no van a una papelera. */}
      <Popconfirm
        title="Retirar del expediente"
        description={`«${doc.fileName}» dejará de estar en el expediente y de pesar en el proyecto de fallo. No se puede deshacer.`}
        okText="Retirar"
        cancelText="Cancelar"
        okButtonProps={{ danger: true, loading: eliminando }}
        onConfirm={onEliminar}
      >
        <Tooltip title="Retirar del expediente">
          <Button
            type="text"
            shape="circle"
            danger
            icon={<DeleteOutlined />}
            aria-label={`Retirar ${doc.fileName} del expediente`}
          />
        </Tooltip>
      </Popconfirm>
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
  const eliminar = useDeleteCaseDocument(caseId);
  const [docEnVista, setDocEnVista] = useState<CaseDocument | null>(null);
  const [urlVista, setUrlVista] = useState<string | null>(null);

  async function verDocumento(doc: CaseDocument) {
    if (!doc.storageKey) {
      message.error('Este documento no tiene un archivo asociado.');
      return;
    }
    setDocEnVista(doc);
    try {
      setUrlVista(await getCaseDocumentDownloadUrl(caseId, doc.storageKey));
    } catch {
      message.error('No se pudo abrir el documento.');
      setDocEnVista(null);
    }
  }

  async function descargarDocumento(doc: CaseDocument) {
    if (!doc.storageKey) {
      message.error('Este documento no tiene un archivo asociado.');
      return;
    }
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
              eliminando={eliminar.isPending}
              onEliminar={() =>
                eliminar.mutate(d.id, {
                  onSuccess: () => message.success(`«${d.fileName}» retirado del expediente.`),
                  onError: (e) =>
                    message.error(
                      `No se pudo retirar «${d.fileName}»: ${e instanceof Error ? e.message : 'error del servidor'}.`,
                    ),
                })
              }
            />
          ))}
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <Upload
          multiple
          accept={ACEPTA_EXPEDIENTE}
          showUploadList={false}
          beforeUpload={(file) => {
            // El aviso es el punto: `accept` descartaba en silencio y el
            // inspector veia que "no se deja cargar" sin que nada se lo dijera.
            if (!esFormatoDeExpediente(file.name)) {
              message.error(avisoDeRechazo([file]));
              return false;
            }
            if (excedeElTope(file.size)) {
              message.error(avisoDeTamano(file.name, file.size));
              return false;
            }
            subir.mutate(file, {
              onSuccess: () => message.success(`«${file.name}» incorporado al expediente.`),
              onError: (e) =>
                message.error(
                  `No se pudo subir «${file.name}»: ${e instanceof Error ? e.message : 'error del servidor'}.`,
                ),
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
