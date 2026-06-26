import { Typography, Card, Tag, Empty, Skeleton, Alert, Button } from 'antd';
import { RightOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { useAudiencias, type Audiencia } from './api';
import { ELEVACION, PALETA } from '@/theme/theme';

const { Title, Text } = Typography;

function diasTexto(fecha: string): { texto: string; color: string } {
  const dias = dayjs(fecha).startOf('day').diff(dayjs().startOf('day'), 'day');
  if (dias <= 0) return { texto: 'Hoy', color: PALETA.rojo };
  if (dias === 1) return { texto: 'Mañana', color: PALETA.amarillo };
  return { texto: `En ${dias} días`, color: PALETA.verde };
}

function FilaAudiencia({ a }: { a: Audiencia }) {
  const fecha = dayjs(a.fecha);
  const badge = diasTexto(a.fecha);
  return (
    <Link to={`/querellas/${a.querellaId}`}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '14px 4px',
          borderBottom: `1px solid ${PALETA.borde}`,
        }}
      >
        {/* Bloque de fecha */}
        <div
          style={{
            width: 64,
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 700, color: PALETA.texto, lineHeight: 1 }}>
            {fecha.format('D')}
          </div>
          <div style={{ fontSize: 12, color: PALETA.textoTenue, textTransform: 'capitalize' }}>
            {fecha.format('MMM')}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <Text strong>{a.asunto}</Text>
          <div style={{ fontSize: 13, color: PALETA.textoSuave }}>
            {a.querellante} vs. {a.querellado} · Radicado {a.radicado}
          </div>
          <div style={{ fontSize: 13, color: PALETA.textoTenue, marginTop: 2 }}>
            <ClockCircleOutlined /> {fecha.format('h:mm a')}
          </div>
        </div>

        <Tag color={badge.color} style={{ fontWeight: 500 }}>
          {badge.texto}
        </Tag>
        <RightOutlined style={{ color: '#9aa0a6' }} />
      </div>
    </Link>
  );
}

export function AudienciasPage() {
  const { data, isLoading, isError } = useAudiencias();
  const audiencias = [...(data ?? [])].sort((a, b) =>
    a.fecha.localeCompare(b.fecha),
  );

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Audiencias
          </Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            Próximas audiencias públicas programadas.
          </Text>
        </div>
        <Button type="primary">Programar audiencia</Button>
      </div>

      <Card variant="borderless" style={{ boxShadow: ELEVACION.base }}>
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : isError ? (
          <Alert type="error" showIcon message="No se pudieron cargar las audiencias" />
        ) : audiencias.length === 0 ? (
          <Empty description="No hay audiencias programadas." />
        ) : (
          audiencias.map((a) => <FilaAudiencia key={a.id} a={a} />)
        )}
      </Card>
    </div>
  );
}
