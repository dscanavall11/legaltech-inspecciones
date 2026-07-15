import type { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Tag,
  Typography,
  Timeline,
  Tabs,
  Progress,
  Button,
  Skeleton,
  Result,
  Row,
  Col,
  Space,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useQuerella } from './api';
import {
  ESTADO_COLOR,
  ESTADO_LABEL,
  type Actuacion,
  type TipoActuacion,
} from './types';
import { calcularTermino } from '@/shared/terminos/diasHabiles';
import { CaseAssistant } from '@/shared/ai/CaseAssistant';
import { SiguientePaso } from './SiguientePaso';
import { DocumentosExpediente } from '@/shared/documentos/DocumentosExpediente';
import { EtapaProcesal } from '@/shared/components/EtapaProcesal';
import { ETAPAS_QUERELLA, ETAPA_QUERELLA_ACTIVA } from '@/derecho';
import { ELEVACION, PALETA } from '@/theme/theme';

const { Title, Text } = Typography;

const COLOR_ACTUACION: Record<TipoActuacion, string> = {
  radicacion: PALETA.azul,
  auto: '#9aa0a6',
  notificacion: PALETA.amarillo,
  audiencia: '#9334e6',
  fallo: PALETA.azulOscuro,
  firmeza: PALETA.verde,
};

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: PALETA.textoTenue, marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ color: PALETA.texto }}>{children}</div>
    </div>
  );
}

function TerminoCard({
  fechaRadicacion,
  diasTermino,
}: {
  fechaRadicacion: string;
  diasTermino: number;
}) {
  const t = calcularTermino(dayjs(fechaRadicacion), diasTermino);
  const porcentaje = Math.min(
    100,
    Math.round((t.diasTranscurridos / diasTermino) * 100),
  );
  const semaforo = t.vencido
    ? { color: PALETA.rojo, tag: 'error' as const, texto: 'Término vencido' }
    : t.diasRestantes <= 3
      ? { color: PALETA.amarillo, tag: 'warning' as const, texto: 'Por vencer' }
      : { color: PALETA.verde, tag: 'success' as const, texto: 'En tiempo' };

  return (
    <Card variant="borderless" style={{ boxShadow: ELEVACION.base }}>
      <Text type="secondary" style={{ fontSize: 12, letterSpacing: 0.3 }}>
        TÉRMINO PROCESAL
      </Text>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 12 }}>
        <Progress
          type="circle"
          percent={porcentaje}
          size={86}
          strokeColor={semaforo.color}
          format={() => (
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: PALETA.texto }}>
                {t.vencido ? 0 : t.diasRestantes}
              </div>
              <div style={{ fontSize: 11, color: PALETA.textoTenue }}>días háb.</div>
            </div>
          )}
        />
        <div>
          <Tag color={semaforo.tag} style={{ fontWeight: 500 }}>
            {semaforo.texto}
          </Tag>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, color: PALETA.textoTenue }}>Vence el</div>
            <Text strong>{t.fechaVencimiento.format('D [de] MMMM, YYYY')}</Text>
          </div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: PALETA.textoTenue, marginTop: 12 }}>
        {t.diasTranscurridos} de {diasTermino} días hábiles · cálculo sujeto a
        validación jurídica.
      </div>
    </Card>
  );
}

export function QuerellaDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuerella(id);

  if (isLoading) {
    return (
      <Card variant="borderless" style={{ boxShadow: ELEVACION.base }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Result
        status="404"
        title="Querella no encontrada"
        subTitle="El expediente que buscas no existe o fue archivado."
        extra={
          <Button type="primary" onClick={() => navigate('/panel/querellas')}>
            Volver a querellas
          </Button>
        }
      />
    );
  }

  const tabs = [
    {
      key: 'info',
      label: 'Información',
      children: (
        <Row gutter={[24, 18]} style={{ marginTop: 4 }}>
          <Col xs={24} sm={12}>
            <Campo label="Querellante">{data.querellante}</Campo>
          </Col>
          <Col xs={24} sm={12}>
            <Campo label="Querellado">{data.querellado}</Campo>
          </Col>
          <Col xs={24}>
            <Campo label="Asunto">{data.asunto}</Campo>
          </Col>
          <Col xs={24}>
            <Campo label="Inmueble / dirección">
              {data.direccionInmueble ?? 'Sin registro'}
            </Campo>
          </Col>
          <Col xs={24} sm={12}>
            <Campo label="Fecha de radicación">
              {dayjs(data.fechaRadicacion).format('D [de] MMMM, YYYY')}
            </Campo>
          </Col>
          <Col xs={24} sm={12}>
            <Campo label="Término aplicable">{data.diasTermino} días hábiles</Campo>
          </Col>
        </Row>
      ),
    },
    {
      key: 'actuaciones',
      label: `Actuaciones (${data.actuaciones.length})`,
      children: (
        <Timeline
          style={{ marginTop: 12 }}
          items={data.actuaciones.map((a: Actuacion) => ({
            color: COLOR_ACTUACION[a.tipo],
            children: (
              <div>
                <Text strong>{a.titulo}</Text>
                <div style={{ fontSize: 12, color: PALETA.textoTenue }}>
                  {dayjs(a.fecha).format('D [de] MMMM, YYYY')}
                </div>
                {a.descripcion && (
                  <div style={{ marginTop: 2 }}>
                    <Text type="secondary">{a.descripcion}</Text>
                  </div>
                )}
              </div>
            ),
          }))}
        />
      ),
    },
    {
      key: 'documentos',
      label: `Documentos (${data.documentos?.length ?? 0})`,
      children: <DocumentosExpediente iniciales={data.documentos ?? []} />,
    },
  ];

  return (
    <div>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/panel/querellas')}
        style={{ marginBottom: 10, paddingLeft: 0 }}
      >
        Volver a querellas
      </Button>

      <Space align="center" size={10} wrap style={{ marginBottom: 2 }}>
        <Title level={2} style={{ margin: 0 }}>
          Radicado {data.radicado}
        </Title>
        <Tag color={ESTADO_COLOR[data.estado]}>{ESTADO_LABEL[data.estado]}</Tag>
      </Space>
      <div>
        <Text type="secondary" style={{ fontSize: 15 }}>
          {data.asunto}
        </Text>
      </div>

      <div style={{ marginBottom: 26 }}>
        <EtapaProcesal etapas={[...ETAPAS_QUERELLA]} activa={ETAPA_QUERELLA_ACTIVA[data.estado]} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <SiguientePaso id={data.id} estado={data.estado} />
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={15}>
          <Card variant="borderless" style={{ boxShadow: ELEVACION.base }}>
            <Tabs items={tabs} />
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <TerminoCard
              fechaRadicacion={data.fechaRadicacion}
              diasTermino={data.diasTermino}
            />
            <CaseAssistant
              contexto={{ tipo: 'querella', id: data.id }}
              radicado={data.radicado}
            />
          </Space>
        </Col>
      </Row>
    </div>
  );
}
