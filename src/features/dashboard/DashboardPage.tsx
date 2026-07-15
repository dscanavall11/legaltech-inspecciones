import { Card, Col, Row, Typography, Tag, Empty, Skeleton } from 'antd';
import {
  FileTextOutlined,
  CalendarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useState, type ReactNode } from 'react';
import dayjs from 'dayjs';
import { Link, useNavigate } from 'react-router-dom';
import { useQuerellas } from '@/features/querellas/api';
import { useAudiencias } from '@/features/audiencias/api';
import { calcularTermino } from '@/shared/terminos/diasHabiles';
import { ESTADO_LABEL } from '@/features/querellas/types';
import { useAuth } from '@/shared/auth/auth';
import { ELEVACION, PALETA } from '@/theme/theme';
import { MVP } from '@/app/mvp';

const { Title, Text } = Typography;

function StatCard({
  label,
  valor,
  icono,
  color,
  fondo,
  destino,
}: {
  label: string;
  valor: number;
  icono: ReactNode;
  color: string;
  fondo: string;
  destino: string;
}) {
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);
  return (
    <Card
      variant="borderless"
      style={{
        boxShadow: hover ? ELEVACION.media : ELEVACION.base,
        height: '100%',
        cursor: 'pointer',
        transform: hover ? 'translateY(-2px)' : 'none',
        transition: 'box-shadow 0.25s ease, transform 0.25s ease',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => navigate(destino)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: fondo,
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            flexShrink: 0,
          }}
        >
          {icono}
        </div>
        <div>
          <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1, color: PALETA.texto }}>
            {valor}
          </div>
          <Text type="secondary">{label}</Text>
        </div>
      </div>
    </Card>
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
          padding: '11px 14px',
          borderRadius: 16,
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#f7f9fc')}
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

export function DashboardPage() {
  const { data, isLoading } = useQuerellas();
  const { data: audienciasData } = useAudiencias();
  const usuario = useAuth((s) => s.usuario);
  const querellas = data ?? [];

  const enTramite = querellas.filter(
    (q) => q.estado === 'en_tramite' || q.estado === 'radicada',
  ).length;
  const audiencias = querellas.filter(
    (q) => q.estado === 'audiencia_programada',
  ).length;
  const enFirmeza = querellas.filter((q) => q.estado === 'en_firmeza').length;

  const porVencer = querellas
    .map((q) => ({
      ...q,
      termino: calcularTermino(dayjs(q.fechaRadicacion), q.diasTermino),
    }))
    .filter((q) => !q.termino.vencido && q.termino.diasRestantes <= 5)
    .sort((a, b) => a.termino.diasRestantes - b.termino.diasRestantes);

  const proximasAudiencias = [...(audienciasData ?? [])]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, 4);

  const fechaHoy = dayjs().format('dddd, D [de] MMMM [de] YYYY');

  if (isLoading) {
    return (
      <Card variant="borderless" style={{ boxShadow: ELEVACION.base }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  // En MVP, no mostramos tarjetas de módulos diferidos (audiencias, actas-firmeza, etc.)
  // La tarjeta de audiencias se mantiene porque alimenta querellas
  // Pero los enlaces a módulos diferidos se ocultan

  return (
    <div>
      <div
        style={{
          fontSize: 12,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: PALETA.textoTenue,
          marginBottom: 6,
        }}
      >
        {fechaHoy}
      </div>
      <Title level={2} style={{ marginTop: 0, marginBottom: 4 }}>
        Buen día, {usuario?.nombre?.split(' ')[0]}
      </Title>
      <Text type="secondary" style={{ fontSize: 16 }}>
        Este es el estado de tu despacho hoy.
      </Text>

      <Row gutter={[20, 20]} style={{ marginTop: 28 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            label="En trámite"
            valor={enTramite}
            icono={<FileTextOutlined />}
            color={PALETA.azul}
            fondo={PALETA.azulSuave}
            destino="/panel/querellas"
          />
        </Col>
        {!MVP && (
          <>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                label="Audiencias programadas"
                valor={audiencias}
                icono={<CalendarOutlined />}
                color={PALETA.verde}
                fondo="#e6f4ea"
                destino="/panel/audiencias"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                label="En firmeza"
                valor={enFirmeza}
                icono={<CheckCircleOutlined />}
                color="#9334e6"
                fondo="#f3e8fd"
                destino="/panel/actas-firmeza"
              />
            </Col>
          </>
        )}
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            label="Términos por vencer"
            valor={porVencer.length}
            icono={<WarningOutlined />}
            color={PALETA.rojo}
            fondo="#fce8e6"
            destino="/panel/querellas"
          />
        </Col>
      </Row>

      <Row gutter={[20, 20]} style={{ marginTop: 24 }}>
        {/* Términos por vencer */}
        <Col xs={24} lg={13}>
          <Card
            variant="borderless"
            title="Casos con término por vencer"
            style={{ boxShadow: ELEVACION.base, height: '100%' }}
            styles={{
              header: { fontSize: 17, fontWeight: 600, borderBottom: 'none', paddingBottom: 0 },
              body: { paddingTop: 10 },
            }}
            extra={
              <Link to="/panel/querellas">
                Ver todas <RightOutlined style={{ fontSize: 11 }} />
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
                    to={`/panel/querellas/${q.id}`}
                    principal={
                      <span className="font-display" style={{ fontSize: 15.5 }}>
                        Radicado {q.radicado}
                      </span>
                    }
                    secundario={`${q.asunto} · ${ESTADO_LABEL[q.estado]}`}
                    extremo={
                      <Tag
                        color={q.termino.diasRestantes <= 2 ? 'error' : 'warning'}
                        style={{ fontWeight: 600, marginInlineEnd: 0 }}
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

        {/* Agenda de audiencias - mantener en MVP porque alimenta querellas */}
        <Col xs={24} lg={11}>
          <Card
            variant="borderless"
            title="Próximas audiencias"
            style={{ boxShadow: ELEVACION.base, height: '100%' }}
            styles={{
              header: { fontSize: 17, fontWeight: 600, borderBottom: 'none', paddingBottom: 0 },
              body: { paddingTop: 10 },
            }}
            extra={
              <Link to="/panel/audiencias">
                Ver agenda <RightOutlined style={{ fontSize: 11 }} />
              </Link>
            }
          >
            {proximasAudiencias.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No hay audiencias en agenda."
              />
            ) : (
              <div style={{ margin: '0 -14px' }}>
                {proximasAudiencias.map((a) => {
                  const fecha = dayjs(a.fecha);
                  return (
                    <FilaCaso
                      key={a.id}
                      to={`/panel/querellas/${a.querellaId}`}
                      principal={<Text strong>{a.asunto}</Text>}
                      secundario={`${a.querellante} contra ${a.querellado}`}
                      extremo={
                        <div
                          style={{
                            textAlign: 'center',
                            background: PALETA.azulSuave,
                            borderRadius: 14,
                            padding: '6px 12px',
                            lineHeight: 1.25,
                            flexShrink: 0,
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 600, color: PALETA.azulOscuro }}>
                            {fecha.format('D MMM')}
                          </div>
                          <div style={{ fontSize: 11.5, color: PALETA.azulOscuro, opacity: 0.8 }}>
                            {fecha.format('h:mm a')}
                          </div>
                        </div>
                      }
                    />
                  );
                })}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}