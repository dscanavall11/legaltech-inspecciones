import { Card, Col, Row, Typography, List, Tag, Empty, Button } from 'antd';
import {
  FileTextOutlined,
  CalendarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  RightOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { useQuerellas } from '@/features/querellas/api';
import { calcularTermino } from '@/shared/terminos/diasHabiles';
import { ESTADO_LABEL } from '@/features/querellas/types';
import { useAuth } from '@/shared/auth/auth';
import { ELEVACION, PALETA } from '@/theme/theme';

const { Title, Text } = Typography;

function StatCard({
  label,
  valor,
  icono,
  color,
  fondo,
}: {
  label: string;
  valor: number;
  icono: ReactNode;
  color: string;
  fondo: string;
}) {
  return (
    <Card variant="borderless" style={{ boxShadow: ELEVACION.base, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
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

export function DashboardPage() {
  const { data } = useQuerellas();
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

  return (
    <div>
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
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            label="Audiencias programadas"
            valor={audiencias}
            icono={<CalendarOutlined />}
            color={PALETA.verde}
            fondo="#e6f4ea"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            label="En firmeza"
            valor={enFirmeza}
            icono={<CheckCircleOutlined />}
            color="#9334e6"
            fondo="#f3e8fd"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            label="Términos por vencer"
            valor={porVencer.length}
            icono={<WarningOutlined />}
            color={PALETA.rojo}
            fondo="#fce8e6"
          />
        </Col>
      </Row>

      <Card
        variant="borderless"
        title="Casos con término por vencer"
        style={{ marginTop: 24, boxShadow: ELEVACION.base }}
        styles={{ header: { fontSize: 18, fontWeight: 600, borderBottom: 'none' } }}
        extra={
          <Link to="/querellas">
            Ver todas <RightOutlined style={{ fontSize: 12 }} />
          </Link>
        }
      >
        {porVencer.length === 0 ? (
          <Empty description="No hay términos próximos a vencer. ¡Al día!" />
        ) : (
          <List
            dataSource={porVencer}
            renderItem={(q) => (
              <List.Item
                actions={[
                  <Tag
                    key="dias"
                    color={q.termino.diasRestantes <= 2 ? 'error' : 'warning'}
                    style={{ fontWeight: 600 }}
                  >
                    {q.termino.diasRestantes} días hábiles
                  </Tag>,
                  <Link key="ver" to={`/querellas/${q.id}`}>
                    <Button type="text" icon={<RightOutlined />} />
                  </Link>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Link to={`/querellas/${q.id}`}>
                      <Text strong>{q.radicado}</Text>
                    </Link>
                  }
                  description={`${q.asunto} · ${ESTADO_LABEL[q.estado]}`}
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
