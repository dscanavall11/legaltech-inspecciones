import { useState } from 'react';
import { Button, Upload, Typography, App } from 'antd';
import {
  FilePdfOutlined,
  FileImageOutlined,
  FileTextOutlined,
  FileOutlined,
  DownloadOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import dayjs from 'dayjs';
import {
  ORIGEN_DOCUMENTO_LABEL,
  tipoDesdeNombre,
  type DocumentoCaso,
  type TipoDocumento,
} from './types';
import { PALETA } from '@/theme/theme';

const { Text } = Typography;

const ESTILO_TIPO: Record<TipoDocumento, { icono: ReactNode; color: string; fondo: string }> = {
  pdf: { icono: <FilePdfOutlined />, color: PALETA.rojo, fondo: '#fdecea' },
  imagen: { icono: <FileImageOutlined />, color: PALETA.verde, fondo: '#e6f4ea' },
  texto: { icono: <FileTextOutlined />, color: PALETA.azul, fondo: PALETA.azulSuave },
  otro: { icono: <FileOutlined />, color: PALETA.textoSuave, fondo: '#f1f3f4' },
};

function FilaDocumento({ doc }: { doc: DocumentoCaso }) {
  const estilo = ESTILO_TIPO[doc.tipo];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '10px 14px',
        borderRadius: 16,
        transition: 'background 0.2s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f7f9fc')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 13,
          background: estilo.fondo,
          color: estilo.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
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
          {doc.nombre}
        </div>
        <div style={{ fontSize: 12, color: PALETA.textoTenue }}>
          {ORIGEN_DOCUMENTO_LABEL[doc.origen]} · {dayjs(doc.fecha).format('D [de] MMMM, YYYY')}
          {doc.tamano ? ` · ${doc.tamano}` : ''}
        </div>
      </div>
      <Button type="text" shape="circle" icon={<DownloadOutlined />} aria-label={`Descargar ${doc.nombre}`} />
    </div>
  );
}

/**
 * Pestaña de documentos del expediente: lista las piezas procesales y permite
 * incorporar nuevas (PDF, imágenes o texto). En modo demo las incorporaciones
 * viven en memoria; el backend definitivo las persiste en el archivo digital.
 */
export function DocumentosExpediente({ iniciales }: { iniciales: DocumentoCaso[] }) {
  const { message } = App.useApp();
  const [incorporados, setIncorporados] = useState<DocumentoCaso[]>([]);
  const documentos = [...iniciales, ...incorporados];

  return (
    <div style={{ marginTop: 4 }}>
      {documentos.length === 0 ? (
        <div style={{ padding: '28px 0 20px', textAlign: 'center' }}>
          <Text type="secondary">
            El expediente aún no tiene documentos. Incorpora la primera pieza procesal.
          </Text>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, margin: '0 -14px' }}>
          {documentos.map((d) => (
            <FilaDocumento key={d.id} doc={d} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <Upload
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx"
          showUploadList={false}
          beforeUpload={(file) => {
            const doc: DocumentoCaso = {
              id: `doc-${crypto.randomUUID().slice(0, 8)}`,
              nombre: file.name,
              tipo: tipoDesdeNombre(file.name),
              origen: 'incorporado',
              fecha: new Date().toISOString().slice(0, 10),
              tamano: `${Math.max(1, Math.round(file.size / 1024))} KB`,
            };
            setIncorporados((prev) => [...prev, doc]);
            message.success(`«${file.name}» incorporado al expediente.`);
            return false; // modo demo: sin subida real al servidor
          }}
        >
          <Button icon={<PlusOutlined />}>Incorporar documento</Button>
        </Upload>
      </div>
    </div>
  );
}
