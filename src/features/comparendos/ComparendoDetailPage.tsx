import type { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Tag,
  Typography,
  Timeline,
  Tabs,
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
import { useComparendo } from './api';
import { ESTADO_COMPARENDO_COLOR, ESTADO_COMPARENDO_LABEL, type ActuacionComparendo, type TipoActuacionComparendo } from './types';
import { SiguientePasoComparendo } from './SiguientePasoComparendo';
import { FlujoNavegable } from '@/shared/components/FlujoNavegable';
import { DocumentosExpediente } from '@/shared/documentos/DocumentosExpediente';
import { EtapaProcesal } from '@/shared/components/EtapaProcesal';
import {
  ETAPAS_COMPARENDO,
  ETAPA_COMPARENDO_ACTIVA,
  TERMINOS_COMPARENDO,
  INCREMENTO_LABEL,
  liquidarMulta,
  TODOS_LOS_ESTADOS_COMPARENDO,
  TRANSICIONES_COMPARENDO,
  siguientePasoComparendo,
  type AccionComparendoTipo,
} from '@/derecho';
import { calcularTermino } from '@/shared/terminos/diasHabiles';
import { ELEVACION, PALETA } from '@/theme/theme';

const { Title, Text } = Typography;

/**
 * evento -> documentKey del checklist `plantillas-personalizadas`. Mismo
 * asociado que usa SiguientePasoComparendo.tsx para generar y previsualizar
 * (Task 10/11) — FlujoNavegable (Task 15, genérico desde Task 20) lo recibe
 * como prop porque ya no conoce el dominio comparendo directamente.
 */
const DOCUMENT_KEY_POR_EVENTO: Partial<Record<AccionComparendoTipo, string>> = {
  avocar_y_citar_audiencia: 'auto-avoca-cita-audiencia',
  decretar_pruebas: 'auto-decreta-pruebas-suspende',
  constancia_inasistencia: 'auto-inasistencia',
  emitir_fallo: 'fallo-comparendo',
  fallo_por_inasistencia: 'fallo-comparendo',
  constancia_incumplimiento_pago: 'constancia-incumplimiento-pronto-pago',
  constancia_incumplimiento_actividad: 'constancia-incumplimiento-actividad-pedagogica',
  generar_acta_firmeza: 'acta-firmeza',
};

const COLOR_ACTUACION: Record<TipoActuacionComparendo, string> = {
  radicacion: PALETA.azul,
  verificacion: '#9aa0a6',
  objecion: PALETA.amarillo,
  audiencia: '#9334e6',
  fallo: PALETA.azulOscuro,
  recurso: PALETA.morado,
  firmeza: PALETA.verde,
  archivo: PALETA.textoTenue,
  otro: '#9aa0a6',
};

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: PALETA.textoTenue, marginBottom: 3 }}>{label}</div>
      <div style={{ color: PALETA.texto }}>{children}</div>
    </div>
  );
}

/** Términos del art. 223A: objeción (3 días) y firmeza (5 días), contados desde el comparendo. */
function TerminosCard({ fechaComparendo }: { fechaComparendo: string }) {
  const objecion = calcularTermino(dayjs(fechaComparendo), TERMINOS_COMPARENDO.objecionDias);
  const firmeza = calcularTermino(dayjs(fechaComparendo), TERMINOS_COMPARENDO.firmezaDias);

  return (
    <Card variant="borderless" style={{ boxShadow: ELEVACION.base }}>
      <Text type="secondary" style={{ fontSize: 12, letterSpacing: 0.3 }}>
        TÉRMINOS PROCESALES (ART. 223A)
      </Text>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text style={{ display: 'block' }}>Término de objeción (3 días háb.)</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Vence {objecion.fechaVencimiento.format('D [de] MMMM, YYYY')}
            </Text>
          </div>
          <Tag color={objecion.vencido ? 'default' : objecion.diasRestantes <= 1 ? 'warning' : 'success'}>
            {objecion.vencido ? 'Vencido' : `${objecion.diasRestantes} días háb.`}
          </Tag>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text style={{ display: 'block' }}>Término de firmeza (5 días háb.)</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Vence {firmeza.fechaVencimiento.format('D [de] MMMM, YYYY')}
            </Text>
          </div>
          <Tag color={firmeza.vencido ? 'default' : firmeza.diasRestantes <= 1 ? 'warning' : 'success'}>
            {firmeza.vencido ? 'Vencido' : `${firmeza.diasRestantes} días háb.`}
          </Tag>
        </div>
      </div>
      <div style={{ fontSize: 12, color: PALETA.textoTenue, marginTop: 12 }}>
        Cálculo sujeto a validación jurídica — no sustituye el término real aplicado por el despacho.
      </div>
    </Card>
  );
}

export function ComparendoDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useComparendo(id);

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
        title="Comparendo no encontrado"
        subTitle="El expediente que buscas no existe o fue archivado."
        extra={
          <Button type="primary" onClick={() => navigate('/panel/comparendos')}>
            Volver a comparendos
          </Button>
        }
      />
    );
  }

  const liq = liquidarMulta(data.tipoMulta, data.causal);

  const tabs = [
    {
      key: 'info',
      label: 'Información',
      children: (
        <Row gutter={[24, 18]} style={{ marginTop: 4 }}>
          <Col xs={24} sm={12}>
            <Campo label="Presunto infractor">{data.infractor}</Campo>
          </Col>
          <Col xs={24} sm={12}>
            <Campo label="Cédula">{data.cedula || 'Sin registro'}</Campo>
          </Col>
          <Col xs={24} sm={12}>
            <Campo label="No. de comparendo">{data.numeroComparendo}</Campo>
          </Col>
          <Col xs={24} sm={12}>
            <Campo label="Artículo y numeral (Ley 1801)">{data.articuloNumeral}</Campo>
          </Col>
          <Col xs={24} sm={12}>
            <Campo label="Fecha del comparendo">
              {dayjs(data.fechaComparendo).format('D [de] MMMM, YYYY')}
            </Campo>
          </Col>
          <Col xs={24} sm={12}>
            <Campo label="Lugar del comportamiento">{data.lugar || 'Sin registro'}</Campo>
          </Col>
          <Col xs={24} sm={12}>
            <Campo label="Procedencia (CAI)">{data.solicitante || 'Sin registro'}</Campo>
          </Col>
          <Col xs={24} sm={12}>
            <Campo label="Reincidencia">
              {data.causal === 'ninguna' ? (
                <Tag color="default">Sin reincidencia</Tag>
              ) : (
                <Tag color="volcano">{INCREMENTO_LABEL[data.causal]}</Tag>
              )}
            </Campo>
          </Col>
          {data.descripcionConducta && (
            <Col xs={24}>
              <Campo label="Comportamiento contrario a la convivencia">{data.descripcionConducta}</Campo>
            </Col>
          )}
          {data.hechos && (
            <Col xs={24}>
              <Campo label="Hechos">{data.hechos}</Campo>
            </Col>
          )}
          <Col xs={24}>
            <Campo label="Multa general (art. 180)">
              Tipo {liq.tipo} ({liq.smdlvLetras} SMDLV) — $ {liq.valorTotal.toLocaleString('es-CO')}
              {liq.porcentajeIncremento > 0 && ` (incluye incremento del ${liq.porcentajeIncremento}%)`}
            </Campo>
          </Col>
        </Row>
      ),
    },
    {
      key: 'actuaciones',
      label: `Actuaciones (${data.actuaciones.length})`,
      children:
        data.actuaciones.length === 0 ? (
          <Text type="secondary">Aún no hay actuaciones registradas.</Text>
        ) : (
          <Timeline
            style={{ marginTop: 12 }}
            items={data.actuaciones.map((a: ActuacionComparendo) => ({
              color: COLOR_ACTUACION[a.tipo],
              children: (
                <div>
                  <Text strong>{a.titulo}</Text>
                  <div style={{ fontSize: 12, color: PALETA.textoTenue }}>
                    {dayjs(a.fecha).format('D [de] MMMM, YYYY · h:mm a')}
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
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/panel/comparendos')}
          style={{ marginBottom: 10, paddingLeft: 0 }}
        >
          Volver a comparendos
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
        <Tag color={ESTADO_COMPARENDO_COLOR[data.estado]}>{ESTADO_COMPARENDO_LABEL[data.estado]}</Tag>
      </Space>
      <div>
        <Text type="secondary" style={{ fontSize: 15 }}>
          Comparendo {data.numeroComparendo} — {data.infractor}
        </Text>
      </div>

      <div style={{ marginBottom: 26 }}>
        <EtapaProcesal etapas={[...ETAPAS_COMPARENDO]} activa={ETAPA_COMPARENDO_ACTIVA[data.estado]} />
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
                todosLosEstados={TODOS_LOS_ESTADOS_COMPARENDO}
                transiciones={TRANSICIONES_COMPARENDO}
                excluirDestino="acta_firmeza"
                etapas={ETAPAS_COMPARENDO}
                etapaActivaPorEstado={ETAPA_COMPARENDO_ACTIVA}
                estadoLabel={ESTADO_COMPARENDO_LABEL}
                siguientePaso={siguientePasoComparendo}
                documentKeyPorEvento={DOCUMENT_KEY_POR_EVENTO}
                descripcionMapa="Los 17 estados del comparendo (arts. 180, 222, 223 y 223A, Ley 1801/2016) y dónde está este expediente."
              />
            ),
            style: { border: 'none', padding: 0 },
          },
        ]}
      />

      <div style={{ marginBottom: 24 }}>
        <SiguientePasoComparendo id={data.id} estado={data.estado} caseMetadata={data.caseMetadataRaw} caso={data} />
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={15}>
          <Card variant="borderless" style={{ boxShadow: ELEVACION.base }}>
            <Tabs items={tabs} />
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <TerminosCard fechaComparendo={data.fechaComparendo} />
        </Col>
      </Row>
    </div>
  );
}
