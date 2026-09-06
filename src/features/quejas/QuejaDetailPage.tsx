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
import { NormaMark } from '@/shared/ai/NormaMark';
import { NORMA } from '@/shared/ai/identity';
import dayjs from 'dayjs';
import { useQueja } from './api';
import {
  ESTADO_QUEJA_COLOR,
  ESTADO_QUEJA_LABEL,
  CATEGORIA_QUEJA_LABEL,
  type TipoActuacionQueja,
  type ActuacionQueja,
} from './types';
import { calcularTermino } from '@/shared/terminos/diasHabiles';
import { SiguientePasoQueja } from './SiguientePasoQueja';
import { DocumentosExpediente } from '@/shared/documentos/DocumentosExpediente';
import { PruebasExpediente } from '@/shared/pruebas/PruebasExpediente';
import { OrientacionesInspector } from '@/shared/orientaciones/OrientacionesInspector';
import { EtapaProcesal } from '@/shared/components/EtapaProcesal';
import { ETAPAS_QUEJA, ETAPA_QUEJA_ACTIVA } from '@/derecho';
import { ELEVACION, PALETA } from '@/theme/theme';
import { Dato } from '@/shared/ui/Dato';
import { TEXTO } from '@/theme/escala';

const { Title, Text } = Typography;

const COLOR_ACTUACION: Record<TipoActuacionQueja, string> = {
  radicacion: PALETA.azul,
  avoca: '#9aa0a6',
  citacion: PALETA.amarillo,
  conciliacion: '#9334e6',
  acuerdo: PALETA.verde,
  sin_acuerdo: PALETA.rojo,
  archivo: PALETA.textoTenue,
};

function TerminoCard({
  fechaRadicacion,
  diasTermino,
  cerrado,
}: {
  fechaRadicacion: string;
  diasTermino: number;
  cerrado: boolean;
}) {
  const t = calcularTermino(dayjs(fechaRadicacion), diasTermino);
  const porcentaje = Math.min(
    100,
    Math.round((t.diasTranscurridos / diasTermino) * 100),
  );
  const semaforo = cerrado
    ? { color: PALETA.textoTenue, tag: 'default' as const, texto: 'Cerrado' }
    : t.vencido
      ? { color: PALETA.rojo, tag: 'error' as const, texto: 'Término vencido' }
      : t.diasRestantes <= 2
        ? { color: PALETA.amarillo, tag: 'warning' as const, texto: 'Por vencer' }
        : { color: PALETA.verde, tag: 'success' as const, texto: 'En tiempo' };

  return (
    <Card variant="borderless" style={{ boxShadow: ELEVACION.base }}>
      <Text type="secondary" style={{ fontSize: TEXTO.menor, letterSpacing: 0.3 }}>
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
                {cerrado || t.vencido ? 0 : t.diasRestantes}
              </div>
              <div style={{ fontSize: TEXTO.nota, color: PALETA.textoTenue }}>días háb.</div>
            </div>
          )}
        />
        <div>
          <Tag color={semaforo.tag} style={{ fontWeight: 500 }}>
            {semaforo.texto}
          </Tag>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: TEXTO.menor, color: PALETA.textoTenue }}>Vence el</div>
            <Text strong>{t.fechaVencimiento.format('D [de] MMMM, YYYY')}</Text>
          </div>
        </div>
      </div>
      <div style={{ fontSize: TEXTO.menor, color: PALETA.textoTenue, marginTop: 12 }}>
        {t.diasTranscurridos} de {diasTermino} días hábiles · cálculo sujeto a
        validación jurídica.
      </div>
    </Card>
  );
}

export function QuejaDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQueja(id);

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
        title="Queja no encontrada"
        subTitle="El expediente que buscas no existe o fue archivado."
        extra={
          <Button type="primary" onClick={() => navigate('/panel/procesos')}>
            Volver a mis procesos
          </Button>
        }
      />
    );
  }

  const cerrado = data.estado === 'archivada';

  const tabs = [
    {
      key: 'info',
      label: 'Información',
      children: (
        <Row gutter={[24, 18]} style={{ marginTop: 4 }}>
          <Col xs={24} sm={12}>
            <Dato label="Quejoso">{data.quejoso}</Dato>
          </Col>
          <Col xs={24} sm={12}>
            <Dato label="Acusado">{data.acusado}</Dato>
          </Col>
          <Col xs={24} sm={12}>
            <Dato label="Categoría">{CATEGORIA_QUEJA_LABEL[data.categoria]}</Dato>
          </Col>
          <Col xs={24} sm={12}>
            <Dato label="Asunto">{data.asunto}</Dato>
          </Col>
          {data.descripcionHechos && (
            <Col xs={24}>
              <Dato label="Descripción de los hechos">
                {data.descripcionHechos}
              </Dato>
            </Col>
          )}
          <Col xs={24} sm={12}>
            <Dato label="Fecha de radicación">
              {dayjs(data.fechaRadicacion).format('D [de] MMMM, YYYY')}
            </Dato>
          </Col>
          <Col xs={24} sm={12}>
            <Dato label="Término aplicable">{data.diasTermino} días hábiles</Dato>
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
          items={data.actuaciones.map((a: ActuacionQueja) => ({
            color: COLOR_ACTUACION[a.tipo],
            children: (
              <div>
                <Text strong>{a.titulo}</Text>
                <div style={{ fontSize: TEXTO.menor, color: PALETA.textoTenue }}>
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
      label: 'Documentos',
      children: <DocumentosExpediente caseId={data.id} />,
    },
    {
      key: 'pruebas',
      label: 'Pruebas',
      children: <PruebasExpediente caseId={data.id} />,
    },
    {
      key: 'orientaciones',
      label: 'Orientaciones',
      children: <OrientacionesInspector caseId={data.id} caseMetadataRaw={data.caseMetadataRaw} />,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/panel/procesos')}
          style={{ marginBottom: 10, paddingLeft: 0 }}
        >
          Volver a mis procesos
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
        <Tag color={ESTADO_QUEJA_COLOR[data.estado]}>
          {ESTADO_QUEJA_LABEL[data.estado]}
        </Tag>
      </Space>
      <div>
        <Text type="secondary" style={{ fontSize: TEXTO.titulo }}>
          {data.asunto}
        </Text>
      </div>

      <div style={{ marginBottom: 26 }}>
        <EtapaProcesal etapas={[...ETAPAS_QUEJA]} activa={ETAPA_QUEJA_ACTIVA[data.estado]} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <SiguientePasoQueja queja={data} />
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
            cerrado={cerrado}
          />
        </Col>
      </Row>
    </div>
  );
}
