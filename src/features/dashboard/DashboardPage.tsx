import { Card, Col, Row, Typography, Tag, Empty, Skeleton, Alert, Button, Tooltip } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { ShieldCheck, Scale, BookOpen, Landmark, ScrollText, ExternalLink, Clock, PauseCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProcesos } from '@/shared/procesos/api';
import { etiquetaEstado } from '@/shared/procesos/types';
import { useAuth } from '@/shared/auth/auth';
import { fechaLarga, saludoPorHora } from '@/shared/util/fechas';
import { PALETA, ELEVACION } from '@/theme/theme';
import { NormaMark } from '@/shared/ai/NormaMark';
import { NORMA } from '@/shared/ai/identity';
import { terminosEnRiesgo, sinMovimiento, DIAS_ALERTA, DIAS_INACTIVIDAD } from './atencion';

const { Title, Text } = Typography;

/** Portales oficiales que un inspector de policía consulta a diario. */
const PORTALES_INSPECTOR = [
  {
    nombre: 'RNMC — Medidas correctivas',
    detalle: 'Policía Nacional · consulta de comparendos',
    url: 'https://srvcnpc.policia.gov.co/PSC/frm_cnp_consulta.aspx',
    icono: <ShieldCheck size={17} strokeWidth={1.9} />,
    color: PALETA.verde,
    fondo: PALETA.verdeBg,
  },
  {
    nombre: 'Consulta de procesos',
    detalle: 'Rama Judicial · estado de expedientes',
    url: 'https://consultaprocesos.ramajudicial.gov.co',
    icono: <Scale size={17} strokeWidth={1.9} />,
    color: PALETA.azul,
    fondo: PALETA.azulBg,
  },
  {
    nombre: 'SUIN-Juriscol',
    detalle: 'MinJusticia · normativa vigente',
    url: 'https://www.suin-juriscol.gov.co',
    icono: <BookOpen size={17} strokeWidth={1.9} />,
    color: PALETA.morado,
    fondo: PALETA.moradoBg,
  },
  {
    nombre: 'Corte Constitucional',
    detalle: 'Jurisprudencia y sentencias',
    url: 'https://www.corteconstitucional.gov.co',
    icono: <Landmark size={17} strokeWidth={1.9} />,
    color: PALETA.teal,
    fondo: PALETA.tealBg,
  },
  {
    nombre: 'Ley 1801 de 2016',
    detalle: 'Secretaría del Senado · texto oficial',
    url: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1801_2016.html',
    icono: <ScrollText size={17} strokeWidth={1.9} />,
    color: PALETA.naranja,
    fondo: PALETA.naranjaBg,
  },
] as const;

/** Lo prometido, declarado como promesa y no como botón que falla. */
const PROXIMAMENTE = [
  { nombre: 'Consulta de estados', motivo: 'Pendiente de la integración con los portales de consulta.' },
  { nombre: 'Medidas correctivas', motivo: 'El módulo existe pero no entra al MVP.' },
  { nombre: 'Herramientas de scraping a la medida', motivo: 'Se definen con cada despacho.' },
] as const;

function FilaCaso({
  to,
  principal,
  secundario,
  extremo,
}: {
  to: string;
  principal: ReactNode;
  secundario: ReactNode;
  extremo: ReactNode;
}) {
  return (
    <Link to={to} style={{ display: 'block' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '10px 14px',
          borderRadius: 10,
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = PALETA.fondo)}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="font-display" style={{ fontSize: 13.5, color: PALETA.texto }}>
            {principal}
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: PALETA.textoSuave,
              marginTop: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {secundario}
          </div>
        </div>
        {extremo}
        <RightOutlined style={{ color: PALETA.textoTenue, fontSize: 11 }} />
      </div>
    </Link>
  );
}

function Grupo({ icono, titulo, children }: { icono: ReactNode; titulo: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 14px',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 0.3,
          textTransform: 'uppercase',
          color: PALETA.textoSuave,
        }}
      >
        {icono}
        {titulo}
      </div>
      {children}
    </div>
  );
}

/** Entrada al asistente: la acción principal del producto, en tinta plena. */
function AbrirAsistente() {
  const navigate = useNavigate();
  return (
    <Card
      variant="borderless"
      style={{ height: '100%', background: PALETA.azulOscuro }}
      styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%', padding: 20 } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: PALETA.superficie,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: ELEVACION.base,
          }}
        >
          <NormaMark size={26} />
        </div>
        <div>
          <div className="titulo-serif" style={{ fontSize: 19, color: '#fff', lineHeight: 1.2 }}>
            {NORMA.nombre}
          </div>
          <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.72)' }}>{NORMA.rol}</span>
        </div>
      </div>

      <span
        style={{
          display: 'block',
          fontSize: 13,
          color: 'rgba(255,255,255,0.85)',
          lineHeight: 1.55,
          marginBottom: 16,
        }}
      >
        Radica el caso, consulta el derecho de policía y redacta las piezas del expediente en una sola
        conversación, con el contexto de tu despacho.
      </span>

      <Button
        block
        size="large"
        onClick={() => navigate('/panel/asistente')}
        style={{
          marginTop: 'auto',
          background: PALETA.superficie,
          color: PALETA.azulOscuro,
          border: 'none',
          fontWeight: 600,
        }}
      >
        Abrir asistente
      </Button>
    </Card>
  );
}

export function DashboardPage() {
  // Una sola consulta a /legal-cases alimenta los dos bloques de arriba.
  const { data, isLoading, isError } = useProcesos();
  const usuario = useAuth((s) => s.usuario);

  const procesos = data ?? [];
  const enRiesgo = terminosEnRiesgo(procesos);
  const vencidos = enRiesgo.filter((c) => c.vencido);
  const porVencer = enRiesgo.filter((c) => !c.vencido);
  const quietos = sinMovimiento(procesos).slice(0, 5);
  const pendientes = vencidos.length + porVencer.length + quietos.length;

  const resumen = isError
    ? 'No se pudo consultar los expedientes'
    : pendientes === 0
      ? 'Nada pendiente de atención hoy'
      : `${pendientes} ${pendientes === 1 ? 'expediente requiere' : 'expedientes requieren'} tu atención`;

  const tagTermino = (c: { vencido: boolean; diasRestantes: number; presuntivo: boolean }) => {
    const tag = (
      <Tag
        color={c.vencido ? 'error' : c.diasRestantes <= 2 ? 'error' : 'warning'}
        style={{ fontWeight: 600, marginInlineEnd: 0, fontVariantNumeric: 'tabular-nums' }}
      >
        {c.vencido ? 'Vencido' : `${c.diasRestantes} días háb.`}
      </Tag>
    );
    return c.presuntivo ? (
      <Tooltip title="Término presuntivo: el expediente no trae diasTermino, se usa el default del tipo.">
        {tag}
      </Tooltip>
    ) : (
      tag
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>
          {saludoPorHora()}, {usuario?.nombre?.split(' ')[0]}
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {fechaLarga()} · {resumen}
        </Text>
      </div>

      {isError && (
        <Alert
          type="warning"
          showIcon
          message="No se pudieron cargar los expedientes"
          description="El servicio de expedientes no respondió. Los bloques que dependen de él quedan vacíos: no se muestran datos aproximados."
          style={{ marginBottom: 12 }}
        />
      )}

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={15}>
          <Card
            variant="borderless"
            title="Requiere tu atención"
            style={{ height: '100%' }}
            styles={{
              header: { fontSize: 15, fontWeight: 600, borderBottom: `1px solid ${PALETA.borde}` },
              body: { paddingTop: 8, paddingInline: 0 },
            }}
            extra={<Link to="/panel/procesos">Ver todos <RightOutlined style={{ fontSize: 11 }} /></Link>}
          >
            {isLoading ? (
              <div style={{ padding: '0 24px' }}>
                <Skeleton active paragraph={{ rows: 4 }} />
              </div>
            ) : vencidos.length === 0 && quietos.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  isError
                    ? 'Sin datos: la consulta de expedientes falló.'
                    : 'Ningún expediente con término vencido ni estancado.'
                }
              />
            ) : (
              <div style={{ padding: '0 10px' }}>
                {vencidos.length > 0 && (
                  <Grupo icono={<Clock size={13} />} titulo={`Término vencido (${vencidos.length})`}>
                    {vencidos.map((c) => (
                      <FilaCaso
                        key={c.id}
                        to={c.ruta}
                        principal={c.radicado}
                        secundario={`${c.asunto} · ${etiquetaEstado(c.estado)}`}
                        extremo={tagTermino(c)}
                      />
                    ))}
                  </Grupo>
                )}
                {quietos.length > 0 && (
                  <Grupo
                    icono={<PauseCircle size={13} />}
                    titulo={`Sin movimiento hace más de ${DIAS_INACTIVIDAD} días`}
                  >
                    {quietos.map((c) => (
                      <FilaCaso
                        key={c.id}
                        to={c.ruta}
                        principal={c.radicado}
                        secundario={`${c.asunto} · ${etiquetaEstado(c.estado)}`}
                        extremo={
                          <Tag style={{ marginInlineEnd: 0, fontVariantNumeric: 'tabular-nums' }}>
                            {c.diasSinMovimiento} días
                          </Tag>
                        }
                      />
                    ))}
                  </Grupo>
                )}
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <AbrirAsistente />
        </Col>
      </Row>

      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
        <Col xs={24} lg={15}>
          <Card
            variant="borderless"
            title={`Términos por vencer (próximos ${DIAS_ALERTA} días hábiles)`}
            style={{ height: '100%' }}
            styles={{
              header: { fontSize: 15, fontWeight: 600, borderBottom: `1px solid ${PALETA.borde}` },
              body: { paddingTop: 8, paddingInline: 10 },
            }}
          >
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : porVencer.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  isError
                    ? 'Sin datos: la consulta de expedientes falló.'
                    : `Ningún término vence en los próximos ${DIAS_ALERTA} días hábiles.`
                }
              />
            ) : (
              porVencer.map((c) => (
                <FilaCaso
                  key={c.id}
                  to={c.ruta}
                  principal={c.radicado}
                  secundario={`${c.asunto} · ${etiquetaEstado(c.estado)}`}
                  extremo={tagTermino(c)}
                />
              ))
            )}
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Card variant="borderless" title="Portales del inspector" style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {PORTALES_INSPECTOR.map((p) => (
                <a key={p.url} href={p.url} target="_blank" rel="noreferrer noopener" style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 10px',
                      borderRadius: 10,
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = PALETA.fondo)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 9,
                        background: p.fondo,
                        color: p.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {p.icono}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13.5, fontWeight: 500, color: PALETA.texto }}>
                        {p.nombre}
                      </span>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 11.5,
                          color: PALETA.textoTenue,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {p.detalle}
                      </span>
                    </span>
                    <ExternalLink size={13} style={{ color: PALETA.textoTenue, flexShrink: 0 }} />
                  </div>
                </a>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Promesa declarada, no botón que falla: deshabilitado y con su motivo. */}
      <div style={{ marginTop: 18 }}>
        <Text style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.3, color: PALETA.textoSuave }}>
          PRONTO
        </Text>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {PROXIMAMENTE.map((f) => (
            <Tooltip key={f.nombre} title={f.motivo}>
              <div
                aria-disabled="true"
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: `1px dashed ${PALETA.borde}`,
                  color: PALETA.textoTenue,
                  fontSize: 13,
                  cursor: 'not-allowed',
                }}
              >
                {f.nombre}
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
}
