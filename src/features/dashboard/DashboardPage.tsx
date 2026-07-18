import { Col, Row, Typography, Tag, Empty, Skeleton } from 'antd';
import {
  FileTextOutlined,
  CalendarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  RightOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import dayjs from 'dayjs';
import { Link, useNavigate } from 'react-router-dom';
import { useQuerellas } from '@/features/querellas/api';
import { useAudiencias } from '@/features/audiencias/api';
import { calcularTermino } from '@/shared/terminos/diasHabiles';
import { ESTADO_LABEL } from '@/features/querellas/types';
import { useAuth } from '@/shared/auth/auth';
import { PALETA } from '@/theme/theme';
import { GlassCard, GlassTile } from '@/shared/components/glass/GlassPanel';
import { MVP } from '@/app/mvp';
import { DailyBriefCard } from './DailyBriefCard';

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
  return (
    <GlassCard
      elevation="level2"
      onClick={() => navigate(destino)}
      accent={color}
      style={{ height: '100%' }}
      role="button"
      aria-label={`${label}: ${valor}`}
      tabIndex={0}
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
    </GlassCard>
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
    <Link to={to} style={{ display: 'block', textDecoration: 'none' }}>
      <GlassTile
        padding="11px 14px"
        radius={16}
        accent={PALETA.azul}
        elevation="level1"
        style={{ marginBottom: 8 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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
      </GlassTile>
    </Link>
  );
}

function GlassCardWithHeader({
  title,
  extra,
  children,
  elevation = 'level2',
  ...props
}: {
  title: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
  elevation?: 'level1' | 'level2' | 'level3';
  style?: React.CSSProperties;
}) {
  return (
    <GlassCard elevation={elevation} {...props}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          paddingBottom: 10,
          borderBottom: `1px solid ${PALETA.borde}`,
        }}
      >
        <Title level={5} style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
          {title}
        </Title>
        {extra && <div style={{ flexShrink: 0 }}>{extra}</div>}
      </div>
      {children}
    </GlassCard>
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
      <GlassCard elevation="level1" style={{ padding: 32 }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </GlassCard>
    );
  }

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
                fondo="#e3f5e9"
                destino="/panel/audiencias"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                label="En firmeza"
                valor={enFirmeza}
                icono={<CheckCircleOutlined />}
                color="#5b3a9e"
                fondo="#f0e8f5"
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
            fondo="#ffe0db"
            destino="/panel/querellas"
          />
        </Col>
      </Row>

      <Row gutter={[20, 20]} style={{ marginTop: 24 }}>
        {/* Términos por vencer */}
        <Col xs={24} lg={13}>
          <GlassCardWithHeader
            elevation="level2"
            title="Casos con término por vencer"
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
          </GlassCardWithHeader>
        </Col>

        {/* Agenda de audiencias */}
        <Col xs={24} lg={11}>
          <GlassCardWithHeader
            elevation="level2"
            title="Próximas audiencias"
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
          </GlassCardWithHeader>
        </Col>
      </Row>

      {/* Bloque "Noticias / tarea del día" */}
      <Row gutter={[20, 20]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={13}>
          <DailyBriefCard />
        </Col>
        <Col xs={24} lg={11}>
          <GlassCard elevation="level2" style={{ height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <CalendarOutlined style={{ color: PALETA.azul, fontSize: 18 }} />
              <Title level={5} style={{ margin: 0 }}>
                Accesos rápidos
              </Title>
            </div>
            <Text type="secondary" style={{ fontSize: 12.5, display: 'block', marginBottom: 14 }}>
              Atajos a los módulos que usas a diario.
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { to: '/panel/radicador', label: 'Radicar solicitud', icon: <FileTextOutlined /> },
                { to: '/panel/actas-firmeza', label: 'Actas de firmeza', icon: <CheckCircleOutlined /> },
                { to: '/panel/audiencias', label: 'Audiencias', icon: <CalendarOutlined /> },
                { to: '/panel/querellas', label: 'Querellas', icon: <FileTextOutlined /> },
              ].map((a) => (
                <Link
                  key={a.to}
                  to={a.to}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <GlassTile
                    padding="10px 14px"
                    radius={14}
                    accent={PALETA.azul}
                    elevation="level1"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ color: PALETA.azul, fontSize: 16 }}>{a.icon}</span>
                      <Text style={{ flex: 1, fontSize: 13.5, color: PALETA.texto }}>
                        {a.label}
                      </Text>
                      <RightOutlined style={{ color: PALETA.textoTenue, fontSize: 11 }} />
                    </div>
                  </GlassTile>
                </Link>
              ))}
            </div>
          </GlassCard>
        </Col>
      </Row>
    </div>
  );
}