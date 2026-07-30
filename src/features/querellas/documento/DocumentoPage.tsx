import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Typography,
  Space,
  Skeleton,
  Result,
  Tooltip,
  App,
} from 'antd';
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  DownloadOutlined,
  CheckOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { Sparkles } from 'lucide-react';
import { useQuerella } from '../api';
import { construirDocumento, type Acapite, type TipoDocumento } from './acapites';
import { descargarDocumentoPdf, documentoPdfBlob, nombreArchivoDocumento } from './documentoPdf';
import { ResumenLateral } from './ResumenLateral';
import { useUploadCaseDocument } from '@/shared/documentos/api';
import { useChangeCaseState } from '@/shared/legalCases/api';
import { ELEVACION, PALETA } from '@/theme/theme';

// Estado al que avanza el caso cuando se expide la constancia de ejecutoria
// (ver flujoQuerella: fallo_emitido --constancia_ejecutoria--> en_firmeza).
const ESTADO_TRAS_FIRMA: Partial<Record<TipoDocumento, string>> = { constancia: 'en_firmeza' };

const { Title, Text } = Typography;

export function DocumentoPage() {
  const { id = '', tipo = 'fallo' } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { data, isLoading, isError } = useQuerella(id);
  const [activo, setActivo] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const [firmando, setFirmando] = useState(false);
  const subir = useUploadCaseDocument(id);
  const cambiarEstado = useChangeCaseState();

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

  const irAAcapite = (acapiteId: string) => {
    setActivo(acapiteId);
    document
      .getElementById(`acap-${acapiteId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const descargarPdf = async () => {
    setExportando(true);
    try {
      await descargarDocumentoPdf(doc, data.radicado);
    } catch {
      message.error('No se pudo generar el PDF.');
    } finally {
      setExportando(false);
    }
  };

  // Sube el PDF al expediente S3: cada llamada crea una nueva versión (el
  // ledger ordena por fecha), permitiendo re-redactar y versionar la pieza.
  const guardarVersion = async () => {
    const blob = await documentoPdfBlob(doc, data.radicado);
    const archivo = new File([blob], nombreArchivoDocumento(doc, data.radicado), { type: 'application/pdf' });
    await subir.mutateAsync(archivo);
  };

  const guardarEnExpediente = async () => {
    try {
      await guardarVersion();
      message.success('Nueva versión archivada en el expediente.');
    } catch {
      message.error('No se pudo archivar la versión en el expediente.');
    }
  };

  const aprobarYFirmar = async () => {
    setFirmando(true);
    try {
      await guardarVersion();
      const estadoDestino = ESTADO_TRAS_FIRMA[tipo as TipoDocumento];
      await Promise.resolve(estadoDestino && cambiarEstado.mutateAsync({ id, state: estadoDestino }));
      message.success('Documento firmado y archivado como versión en el expediente.');
      navigate(`/panel/querellas/${id}`);
    } catch {
      message.error('No se pudo firmar y archivar el documento.');
    } finally {
      setFirmando(false);
    }
  };

  return (
    <div>
      {/* Barra superior */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/panel/querellas/${id}`)}
            style={{ paddingLeft: 0, marginBottom: 4 }}
          >
            Volver al expediente
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            {doc.titulo}
          </Title>
          <Text type="secondary">Radicado {data.radicado}</Text>
        </div>
        <Space wrap>
          <Button icon={<DownloadOutlined />} loading={exportando} onClick={descargarPdf}>
            Descargar PDF
          </Button>
          <Button icon={<SaveOutlined />} loading={subir.isPending} onClick={guardarEnExpediente}>
            Guardar versión
          </Button>
          <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
            Imprimir
          </Button>
          <Button type="primary" icon={<CheckOutlined />} loading={firmando} onClick={aprobarYFirmar}>
            Aprobar y firmar
          </Button>
        </Space>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Previsualización del documento (tipo PDF) */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              background: '#fff',
              maxWidth: 820,
              margin: '0 auto',
              padding: '56px 64px',
              borderRadius: 12,
              boxShadow: ELEVACION.media,
              fontFamily: 'Georgia, "Times New Roman", serif',
              color: '#1a1a1a',
              lineHeight: 1.7,
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ fontSize: 13, letterSpacing: 1, color: '#444' }}>
                REPÚBLICA DE COLOMBIA
              </div>
              <div style={{ fontWeight: 700, marginTop: 4 }}>{doc.inspeccion}</div>
              <div
                style={{
                  marginTop: 18,
                  fontWeight: 700,
                  fontSize: 17,
                  textTransform: 'uppercase',
                }}
              >
                {doc.titulo}
              </div>
              <div style={{ fontSize: 13, color: '#444', marginTop: 4 }}>
                Radicado N.º {data.radicado}
              </div>
            </div>

            {doc.acapites.map((a: Acapite) => (
              <section
                key={a.id}
                id={`acap-${a.id}`}
                style={{
marginBottom: 26,
                scrollMarginTop: 16,
                background:
                  activo === a.id ? PALETA.azulSuave : 'transparent',
                  transition: 'background 0.5s',
                  borderRadius: 12,
                  padding: activo === a.id ? '8px 10px' : '8px 0',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{a.titulo}</div>
                {a.parrafos.map((p, i) => (
                  <p key={i} style={{ margin: '0 0 8px', textAlign: 'justify' }}>
                    {p}
                  </p>
                ))}
              </section>
            ))}

            <div
              style={{
                marginTop: 48,
                paddingTop: 16,
                borderTop: '1px solid #ddd',
                fontSize: 13,
                color: '#444',
              }}
            >
              ____________________________________
              <div>Inspector(a) de Policía</div>
            </div>
          </div>
        </div>

        {/* Sidebar de acápites */}
        <aside
          style={{
            width: 300,
            flexShrink: 0,
            position: 'sticky',
            top: 84,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
          className="acapites-sidebar"
        >
          <ResumenLateral
            tipoDocumento={doc.titulo}
            texto={doc.acapites
              .map((a) => `${a.titulo}\n${a.parrafos.join('\n')}`)
              .join('\n\n')}
          />
          <Text type="secondary" style={{ fontSize: 12, letterSpacing: 0.3, padding: '0 8px 6px' }}>
            ACÁPITES DEL DOCUMENTO
          </Text>
          {doc.acapites.map((a) => (
            <button
              key={a.id}
              onClick={() => irAAcapite(a.id)}
              style={{
                textAlign: 'left',
                border: 'none',
                background: activo === a.id ? PALETA.azulSuave : 'transparent',
                borderRadius: 10,
                padding: '10px 12px',
                cursor: 'pointer',
                width: '100%',
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 500,
                  color: activo === a.id ? PALETA.azulOscuro : PALETA.texto,
                }}
              >
                <span style={{ flex: 1 }}>{a.titulo}</span>
                {a.fuente === 'ia' && (
                  <Tooltip title="Redactado con IA. Requiere revisión">
                    <Sparkles size={13} strokeWidth={1.75} style={{ color: PALETA.azul }} />
                  </Tooltip>
                )}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: PALETA.textoTenue,
                  marginTop: 2,
                }}
              >
                {a.resumen}
              </div>
            </button>
          ))}
        </aside>
      </div>
    </div>
  );
}
