import { Card, Col, Row, Typography, Tag, Empty, Skeleton } from 'antd';
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
    <Card
      variant="borderless"
      hoverable
      onClick={() => navigate(destino)}
      style={{ height: '100%' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: fondo,
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          {icono}
        </div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1, color: PALETA.texto }}>
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
          borderRadius: 10,
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f3f4')}
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

  const fechaHoy = dayjs().format('dddd, D [de] MMMM');

  if (isLoading) {
    return (
      <Card variant="borderless">
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <Title level={3} style={{ margin: 0 }}>
          {usuario?.nombre?.split(' ')[0]}
        </Title>
        <Text type="secondary" style={{ fontSize: 13, textTransform: 'capitalize' }}>
          {fechaHoy}
        </Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
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
            fondo="#fce8e6"
            destino="/panel/querellas"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={13}>
          <Card
            variant="borderless"
            title="Casos con término por vencer"
            style={{ height: '100%' }}
            styles={{
              header: { fontSize: 15, fontWeight: 600, borderBottom: `1px solid ${PALETA.borde}` },
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
                    principal={<span style={{ fontSize: 14.5 }}>Radicado {q.radicado}</span>}
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

        <Col xs={24} lg={11}>
          <Card
            variant="borderless"
            title="Próximas audiencias"
            style={{ height: '100%' }}
            styles={{
              header: { fontSize: 15, fontWeight: 600, borderBottom: `1px solid ${PALETA.borde}` },
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
                            borderRadius: 10,
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

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={13}>
          <DailyBriefCard />
        </Col>
        <Col xs={24} lg={11}>
          <Card variant="borderless" title="Accesos rápidos" style={{ height: '100%' }}>
            <Text type="secondary" style={{ fontSize: 12.5, display: 'block', marginBottom: 12 }}>
              Atajos a los módulos que usas a diario.
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { to: '/panel/radicador', label: 'Radicar solicitud', icon: <FileTextOutlined /> },
                { to: '/panel/actas-firmeza', label: 'Actas de firmeza', icon: <CheckCircleOutlined /> },
                { to: '/panel/audiencias', label: 'Audiencias', icon: <CalendarOutlined /> },
                { to: '/panel/querellas', label: 'Querellas', icon: <FileTextOutlined /> },
              ].map((a) => (
                <Link key={a.to} to={a.to} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '9px 10px',
                      borderRadius: 10,
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f3f4')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ color: PALETA.azul, fontSize: 16 }}>{a.icon}</span>
                    <Text style={{ flex: 1, fontSize: 13.5, color: PALETA.texto }}>{a.label}</Text>
                    <RightOutlined style={{ color: PALETA.textoTenue, fontSize: 11 }} />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
