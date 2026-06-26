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
  RobotOutlined,
} from '@ant-design/icons';
import { useQuerella } from '../api';
import { construirDocumento, type Acapite, type TipoDocumento } from './acapites';
import { ELEVACION, PALETA } from '@/theme/theme';

const { Title, Text } = Typography;

export function DocumentoPage() {
  const { id = '', tipo = 'fallo' } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { data, isLoading, isError } = useQuerella(id);
  const [activo, setActivo] = useState<string | null>(null);

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }
  if (isError || !data) {
    return (
      <Result
        status="404"
        title="Expediente no encontrado"
        extra={
          <Button type="primary" onClick={() => navigate('/querellas')}>
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
            onClick={() => navigate(`/querellas/${id}`)}
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
          <Button icon={<DownloadOutlined />} onClick={() => message.info('El PDF se generará desde el backend.')}>
            Descargar PDF
          </Button>
          <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
            Imprimir
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => {
              message.success('Documento aprobado y firmado.');
              navigate(`/querellas/${id}`);
            }}
          >
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
              borderRadius: 6,
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
                  borderRadius: 6,
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
                  <Tooltip title="Redactado con IA — requiere revisión">
                    <RobotOutlined style={{ color: PALETA.azul, fontSize: 13 }} />
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
