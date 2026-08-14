import { Card, Col, Row, Typography, Tag, Empty, Skeleton, Button, Space } from 'antd';
import { MessageOutlined, RightOutlined, FileAddOutlined } from '@ant-design/icons';
import { ShieldCheck, Scale, BookOpen, Landmark, ScrollText, ExternalLink } from 'lucide-react';
import type { ReactNode } from 'react';
import dayjs from 'dayjs';
import { Link, useNavigate } from 'react-router-dom';
import { useProcesos } from '@/shared/procesos/api';
import { definicionDe, etiquetaEstado } from '@/shared/procesos/types';
import { calcularTermino } from '@/shared/terminos/diasHabiles';
import { useAuth } from '@/shared/auth/auth';
import { fechaLarga, saludoPorHora } from '@/shared/util/fechas';
import { PALETA, ELEVACION } from '@/theme/theme';
import { NormaMark } from '@/shared/ai/NormaMark';
import { NORMA } from '@/shared/ai/identity';
import { DailyBriefCard } from './DailyBriefCard';

const { Title, Text } = Typography;

/** Celda del pulso: un indicador dentro de la franja única, no una caja aparte. */
function PulsoCelda({
  label,
  valor,
  color,
  destino,
}: {
  label: string;
  valor: number;
  color: string;
  destino: string;
}) {
  const navigate = useNavigate();
  return (
    <button type="button" className="pulso-celda" onClick={() => navigate(destino)}>
      <span className="pulso-valor">{valor}</span>
      <span className="pulso-label">
        <span className="pulso-punto" style={{ background: color }} />
        {label}
      </span>
    </button>
  );
}

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
        onMouseEnter={(e) => (e.currentTarget.style.background = '#f4f2ec')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: PALETA.texto }}>{principal}</div>
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

const SUGERENCIAS_LEGAL = [
  '¿Qué términos vencen esta semana?',
  'Redáctame un proyecto de acta de firmeza',
];

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

/** Asistente jurídico (Legal): tarjeta en tinta oscura — la única pieza de color pleno del tablero. */
function LegalHero() {
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

      <span style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.55, marginBottom: 14 }}>
        Consulta el derecho de policía, resume expedientes y redacta piezas con el contexto de tu despacho.
      </span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {SUGERENCIAS_LEGAL.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => navigate('/panel/chat')}
            style={{
              textAlign: 'left',
              fontSize: 12.5,
              color: 'rgba(255,255,255,0.92)',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.22)',
              borderRadius: 8,
              padding: '7px 12px',
              cursor: 'pointer',
              transition: 'background 150ms ease',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.16)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          >
            “{s}”
          </button>
        ))}
      </div>

      <Button
        block
        icon={<MessageOutlined />}
        onClick={() => navigate('/panel/chat')}
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
  // Una sola consulta a /legal-cases alimenta los cuatro indicadores; antes
  // eran tres hooks (querellas + quejas + fallos) sobre la misma tabla.
  const { data, isLoading } = useProcesos();
  const usuario = useAuth((s) => s.usuario);
  const navigate = useNavigate();

  const procesos = data ?? [];
  const porTipo = (tipo: string) => procesos.filter((p) => p.tipo === tipo);

  const querellasEnTramite = porTipo('querella').filter((q) =>
    ['en_tramite', 'radicada'].includes(q.estado),
  ).length;
  const quejasActivas = porTipo('queja').filter((q) => q.estado !== 'archivada').length;
  const fallosProferidos = procesos.filter((p) => p.tieneFallo).length;

  // Términos por vencer: cualquier expediente que registre término, sin
  // importar el tipo.
  const porVencer = procesos
    .filter((p) => p.diasTermino !== undefined && p.fechaRadicacion !== '')
    .map((p) => ({
      id: p.id,
      radicado: p.radicado,
      to: definicionDe(p.tipo)?.ruta?.(p.id) ?? '/panel/procesos',
      secundario: `${p.asunto} · ${etiquetaEstado(p.estado)}`,
      termino: calcularTermino(dayjs(p.fechaRadicacion), p.diasTermino as number),
    }))
    .filter((q) => !q.termino.vencido && q.termino.diasRestantes <= 5)
    .sort((a, b) => a.termino.diasRestantes - b.termino.diasRestantes);

  const resumenTerminos =
    porVencer.length === 0
      ? 'Sin términos en riesgo esta semana'
      : porVencer.length === 1
        ? '1 término vence en los próximos 5 días hábiles'
        : `${porVencer.length} términos vencen en los próximos 5 días hábiles`;

  if (isLoading) {
    return (
      <Card variant="borderless">
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  return (
    <div>
      {/* Encabezado: saludo en serif + resumen del día, acciones a la derecha */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            {saludoPorHora()}, {usuario?.nombre?.split(' ')[0]}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {fechaLarga()} · {resumenTerminos}
          </Text>
        </div>
        <Space>
          <Button icon={<NormaMark size={16} />} onClick={() => navigate('/panel/chat')}>
            Preguntarle a {NORMA.nombre}
          </Button>
          <Button type="primary" icon={<FileAddOutlined />} onClick={() => navigate('/panel/radicador')}>
            Radicar caso
          </Button>
        </Space>
      </div>

      {/* Pulso del despacho: una sola franja, cuatro indicadores */}
      <Card variant="borderless" styles={{ body: { padding: 0 } }} style={{ boxShadow: ELEVACION.base }}>
        <div className="pulso-grid">
          <PulsoCelda
            label="Querellas en trámite"
            valor={querellasEnTramite}
            color={PALETA.azul}
            destino="/panel/querellas"
          />
          <PulsoCelda label="Quejas activas" valor={quejasActivas} color={PALETA.verde} destino="/panel/quejas" />
          <PulsoCelda
            label="Fallos proferidos"
            valor={fallosProferidos}
            color={PALETA.morado}
            destino="/panel/procesos?fallo=1"
          />
          <PulsoCelda
            label="Términos por vencer"
            valor={porVencer.length}
            color={PALETA.rojo}
            destino="/panel/procesos"
          />
        </div>
      </Card>

      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
        <Col xs={24} lg={16}>
          <Card
            variant="borderless"
            title="Requiere tu atención"
            style={{ height: '100%' }}
            styles={{
              header: { fontSize: 15, fontWeight: 600, borderBottom: `1px solid ${PALETA.borde}` },
              body: { paddingTop: 8 },
            }}
            extra={
              <Link to="/panel/querellas">
                Ver casos <RightOutlined style={{ fontSize: 11 }} />
              </Link>
            }
          >
            {porVencer.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Ningún término vence en los próximos 5 días hábiles."
              />
            ) : (
              <div style={{ margin: '0 -14px' }}>
                {porVencer.map((q) => (
                  <FilaCaso
                    key={q.id}
                    to={q.to}
                    principal={<span className="font-display" style={{ fontSize: 13.5 }}>{q.radicado}</span>}
                    secundario={q.secundario}
                    extremo={
                      <Tag
                        color={q.termino.diasRestantes <= 2 ? 'error' : 'warning'}
                        style={{ fontWeight: 600, marginInlineEnd: 0, fontVariantNumeric: 'tabular-nums' }}
                      >
                        {q.termino.diasRestantes} días háb.
                      </Tag>
                    }
                  />
                ))}
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <LegalHero />
        </Col>
      </Row>

      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
        <Col xs={24} lg={16}>
          <DailyBriefCard />
        </Col>
        <Col xs={24} lg={8}>
          <Card variant="borderless" title="Portales del inspector" style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {PORTALES_INSPECTOR.map((p) => (
                <a
                  key={p.url}
                  href={p.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 10px',
                      borderRadius: 10,
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.7)')}
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
    </div>
  );
}
