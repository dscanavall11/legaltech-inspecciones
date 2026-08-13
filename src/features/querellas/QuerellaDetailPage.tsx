import type { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Tag,
  Typography,
  Tabs,
  Progress,
  Button,
  Skeleton,
  Result,
  Row,
  Col,
  Space,
  Collapse,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { NormaMark } from '@/shared/ai/NormaMark';
import { NORMA } from '@/shared/ai/identity';
import dayjs from 'dayjs';
import { useQuerella } from './api';
import { ESTADO_COLOR, ESTADO_LABEL } from './types';
import { calcularTermino } from '@/shared/terminos/diasHabiles';
import { SiguientePaso } from './SiguientePaso';
import { LineaTiempoEstados } from './LineaTiempoEstados';
import { DocumentosExpediente } from '@/shared/documentos/DocumentosExpediente';
import { PruebasExpediente } from '@/shared/pruebas/PruebasExpediente';
import { EtapaProcesal } from '@/shared/components/EtapaProcesal';
import { FlujoNavegable } from '@/shared/components/FlujoNavegable';
import {
  ETAPAS_QUERELLA,
  ETAPA_QUERELLA_ACTIVA,
  TODOS_LOS_ESTADOS_QUERELLA,
  TRANSICIONES_QUERELLA,
  siguientePaso,
} from '@/derecho';
import { ELEVACION, PALETA } from '@/theme/theme';

const { Title, Text } = Typography;

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
        <LineaTiempoEstados caseId={data.id} actuaciones={data.actuaciones} estadoActual={data.estado} />
      ),
    },
    {
      key: 'documentos',
      label: 'Documentos',
      children: <DocumentosExpediente caseId={data.id} />,
    },
    {
      key: 'pruebas',
      label: 'Pruebas',
      children: <PruebasExpediente caseId={data.id} />,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/panel/querellas')}
          style={{ marginBottom: 10, paddingLeft: 0 }}
        >
          Volver a querellas
        </Button>
        <Button
          icon={<NormaMark size={17} />}
          onClick={() => navigate('/panel/chat', { state: { radicado: data.radicado } })}
        >
          Preguntarle a {NORMA.nombre}
        </Button>
      </div>

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

      <Collapse
        defaultActiveKey={['mapa']}
        style={{ marginBottom: 24, background: 'transparent', border: 'none' }}
        items={[
          {
            key: 'mapa',
            label: <Text strong>Mapa del trámite (todos los estados)</Text>,
            children: (
              <FlujoNavegable
                id={data.id}
                estadoActual={data.estado}
                actuaciones={data.actuaciones}
                todosLosEstados={TODOS_LOS_ESTADOS_QUERELLA}
                transiciones={TRANSICIONES_QUERELLA}
                etapas={ETAPAS_QUERELLA}
                etapaActivaPorEstado={ETAPA_QUERELLA_ACTIVA}
                estadoLabel={ESTADO_LABEL}
                siguientePaso={siguientePaso}
                descripcionMapa="Los 9 estados de la querella (proceso verbal abreviado, art. 223, Ley 1801/2016) y dónde está este expediente."
              />
            ),
            style: { border: 'none', padding: 0 },
          },
        ]}
      />

      <div style={{ marginBottom: 24 }}>
        <SiguientePaso id={data.id} estado={data.estado} caseMetadata={data.caseMetadataRaw} caso={data} />
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={15}>
          <Card variant="borderless" style={{ boxShadow: ELEVACION.base }}>
            <Tabs items={tabs} />
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <TerminoCard
            fechaRadicacion={data.fechaRadicacion}
            diasTermino={data.diasTermino}
          />
        </Col>
      </Row>
    </div>
  );
}
