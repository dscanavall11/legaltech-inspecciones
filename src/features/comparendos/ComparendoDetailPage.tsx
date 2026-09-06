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
import { ArrowLeftOutlined, FileTextOutlined } from '@ant-design/icons';
import { NormaMark } from '@/shared/ai/NormaMark';
import { NORMA } from '@/shared/ai/identity';
import dayjs from 'dayjs';
import { useComparendo } from './api';
import {
  ESTADO_COMPARENDO_COLOR,
  ESTADO_COMPARENDO_LABEL,
  type ActuacionComparendo,
  type ComparendoDetalle,
  type ComparendoMetadata,
  type TipoActuacionComparendo,
} from './types';
import { SiguientePasoComparendo } from './SiguientePasoComparendo';
import { documentosComparendoDisponibles } from './documento/documentoComparendo';
import { FlujoNavegable } from '@/shared/components/FlujoNavegable';
import { DocumentosExpediente } from '@/shared/documentos/DocumentosExpediente';
import { PruebasExpediente } from '@/shared/pruebas/PruebasExpediente';
import { OrientacionesInspector } from '@/shared/orientaciones/OrientacionesInspector';
import { NOMBRE_PLANTILLA } from '@/shared/documentos/ejemploPlantillas';
import { EtapaProcesal } from '@/shared/components/EtapaProcesal';
import { parseCaseMetadata } from '@/shared/legalCases/types';
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
import { Dato } from '@/shared/ui/Dato';
import { TEXTO } from '@/theme/escala';

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

/** Términos del art. 223A: objeción (3 días) y firmeza (5 días), contados desde el comparendo. */
function TerminosCard({ fechaComparendo }: { fechaComparendo: string }) {
  const objecion = calcularTermino(dayjs(fechaComparendo), TERMINOS_COMPARENDO.objecionDias);
  const firmeza = calcularTermino(dayjs(fechaComparendo), TERMINOS_COMPARENDO.firmezaDias);

  return (
    <Card variant="borderless" style={{ boxShadow: ELEVACION.base }}>
      <Text type="secondary" style={{ fontSize: TEXTO.menor, letterSpacing: 0.3 }}>
        TÉRMINOS PROCESALES (ART. 223A)
      </Text>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text style={{ display: 'block' }}>Término de objeción (3 días háb.)</Text>
            <Text type="secondary" style={{ fontSize: TEXTO.menor }}>
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
            <Text type="secondary" style={{ fontSize: TEXTO.menor }}>
              Vence {firmeza.fechaVencimiento.format('D [de] MMMM, YYYY')}
            </Text>
          </div>
          <Tag color={firmeza.vencido ? 'default' : firmeza.diasRestantes <= 1 ? 'warning' : 'success'}>
            {firmeza.vencido ? 'Vencido' : `${firmeza.diasRestantes} días háb.`}
          </Tag>
        </div>
      </div>
      <div style={{ fontSize: TEXTO.menor, color: PALETA.textoTenue, marginTop: 12 }}>
        Cálculo sujeto a validación jurídica — no sustituye el término real aplicado por el despacho.
      </div>
    </Card>
  );
}

/**
 * Piezas procesales ya generables con los datos reales del expediente — cada
 * una navega al visor/editor compartido (Task 18, deliverable 3), donde el
 * inspector puede revisar, editar por acápite y volver a archivar la versión.
 */
function PiezasProcesalesCard({ id, data }: { id: string; data: ComparendoDetalle }) {
  const navigate = useNavigate();
  const meta = parseCaseMetadata<ComparendoMetadata>(data.caseMetadataRaw ?? null);
  const disponibles = documentosComparendoDisponibles(data, meta);

  if (disponibles.length === 0) {
    return (
      <Text type="secondary">Aún no hay piezas procesales generables — se habilitan a medida que avanza el trámite.</Text>
    );
  }

  return (
    <Space wrap size={8} style={{ marginBottom: 16 }}>
      {disponibles.map((tipo) => (
        <Button
          key={tipo}
          icon={<FileTextOutlined />}
          onClick={() => navigate(`/panel/comparendos/${id}/documento/${tipo}`)}
        >
          {NOMBRE_PLANTILLA[tipo] ?? tipo}
        </Button>
      ))}
    </Space>
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
            <Dato label="Presunto infractor">{data.infractor}</Dato>
          </Col>
          <Col xs={24} sm={12}>
            <Dato label="Cédula">{data.cedula || 'Sin registro'}</Dato>
          </Col>
          <Col xs={24} sm={12}>
            <Dato label="No. de comparendo">{data.numeroComparendo}</Dato>
          </Col>
          <Col xs={24} sm={12}>
            <Dato label="Artículo y numeral (Ley 1801)">{data.articuloNumeral}</Dato>
          </Col>
          <Col xs={24} sm={12}>
            <Dato label="Fecha del comparendo">
              {dayjs(data.fechaComparendo).format('D [de] MMMM, YYYY')}
            </Dato>
          </Col>
          <Col xs={24} sm={12}>
            <Dato label="Lugar del comportamiento">{data.lugar || 'Sin registro'}</Dato>
          </Col>
          <Col xs={24} sm={12}>
            <Dato label="Procedencia (CAI)">{data.solicitante || 'Sin registro'}</Dato>
          </Col>
          <Col xs={24} sm={12}>
            <Dato label="Reincidencia">
              {data.causal === 'ninguna' ? (
                <Tag color="default">Sin reincidencia</Tag>
              ) : (
                <Tag color="volcano">{INCREMENTO_LABEL[data.causal]}</Tag>
              )}
            </Dato>
          </Col>
          {data.descripcionConducta && (
            <Col xs={24}>
              <Dato label="Comportamiento contrario a la convivencia">{data.descripcionConducta}</Dato>
            </Col>
          )}
          {data.hechos && (
            <Col xs={24}>
              <Dato label="Hechos">{data.hechos}</Dato>
            </Col>
          )}
          <Col xs={24}>
            <Dato label="Multa general (art. 180)">
              Tipo {liq.tipo} ({liq.smdlvLetras} SMDLV) — $ {liq.valorTotal.toLocaleString('es-CO')}
              {liq.porcentajeIncremento > 0 && ` (incluye incremento del ${liq.porcentajeIncremento}%)`}
            </Dato>
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
                  <div style={{ fontSize: TEXTO.menor, color: PALETA.textoTenue }}>
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
      children: (
        <>
          <Text type="secondary" style={{ fontSize: TEXTO.menor, letterSpacing: 0.3, display: 'block', marginBottom: 8 }}>
            PIEZAS PROCESALES DEL EXPEDIENTE
          </Text>
          <PiezasProcesalesCard id={data.id} data={data} />
          <DocumentosExpediente caseId={data.id} />
        </>
      ),
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
        <Text type="secondary" style={{ fontSize: TEXTO.titulo }}>
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
