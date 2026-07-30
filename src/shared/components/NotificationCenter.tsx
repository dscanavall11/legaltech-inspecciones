import { useMemo, useState, useCallback } from 'react';
import { Badge, Dropdown, Typography, Empty, Button, Tag } from 'antd';
import { BellOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { PALETA } from '@/theme/theme';
import { useAudiencias } from '@/features/audiencias/api';

const { Text, Paragraph } = Typography;

// Ventana de "próxima" audiencia - suficientemente cerca para que valga la
// pena avisar, no tan amplia que se vuelva ruido.
const HORIZONTE_HORAS = 72;

function tiempoRelativo(fechaISO: string): string {
  const diffMs = new Date(fechaISO).getTime() - Date.now();
  const horas = Math.round(diffMs / 3600000);
  if (horas < 1) return 'En menos de una hora';
  if (horas < 24) return `En ${horas}h`;
  const dias = Math.round(horas / 24);
  return `En ${dias}d`;
}

/**
 * Sin backend de notificaciones real todavía: en vez de fabricar actividad
 * falsa (como hacía antes con un setInterval generando eventos random cada
 * 30s), esto deriva alertas genuinas de datos reales - audiencias ya
 * programadas (ver features/audiencias/api.ts) que caen dentro de la
 * ventana. Cuando exista un backend de notificaciones real, este componente
 * es el punto de reemplazo.
 */
export function NotificationCenter() {
  const { data: audiencias } = useAudiencias();
  const [descartadas, setDescartadas] = useState<Set<string>>(new Set());
  const [abierto, setAbierto] = useState(false);
  const navigate = useNavigate();

  const proximas = useMemo(() => {
    const limite = dayjs().add(HORIZONTE_HORAS, 'hour');
    return (audiencias ?? [])
      .filter((a) => dayjs(a.fecha).isAfter(dayjs()) && dayjs(a.fecha).isBefore(limite))
      .filter((a) => !descartadas.has(a.id))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [audiencias, descartadas]);

  const descartar = useCallback((id: string) => {
    setDescartadas((prev) => new Set(prev).add(id));
  }, []);

  const dropdownContent = (
    <div
      style={{
        width: 380,
        maxHeight: 480,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 16,
        background: '#fff',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
      }}
    >
      <div
        style={{
          padding: '16px 20px 12px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
        }}
      >
        <Text strong style={{ fontSize: 15 }}>Audiencias próximas</Text>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {proximas.length === 0 ? (
          <Empty
            description={`Sin audiencias en las próximas ${HORIZONTE_HORAS / 24} días`}
            style={{ padding: '40px 0' }}
          />
        ) : (
          proximas.map((a) => (
            <div
              key={a.id}
              onClick={() => {
                navigate(`/panel/querellas/${a.querellaId}`);
                setAbierto(false);
              }}
              style={{
                padding: '12px 20px',
                display: 'flex',
                gap: 12,
                cursor: 'pointer',
                borderBottom: '1px solid rgba(0, 0, 0, 0.02)',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: '#1677ff10',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1677ff',
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                <CalendarOutlined />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Text strong style={{ fontSize: 13, flex: 1 }} ellipsis>
                    Radicado {a.radicado}
                  </Text>
                  <Tag color="blue" style={{ fontSize: 10, padding: '0 6px', margin: 0, lineHeight: '18px' }}>
                    Audiencia
                  </Tag>
                </div>
                <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ fontSize: 12, marginBottom: 4, lineHeight: 1.4 }}>
                  {a.querellante} contra {a.querellado} — {a.asunto}
                </Paragraph>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {tiempoRelativo(a.fecha)} — {dayjs(a.fecha).format('D MMM, h:mm a')}
                  </Text>
                  <Button
                    type="text"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      descartar(a.id);
                    }}
                    style={{ color: '#9ca3af', fontSize: 11, padding: '0 4px', height: 20 }}
                  >
                    Descartar
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <Dropdown
      open={abierto}
      onOpenChange={setAbierto}
      popupRender={() => dropdownContent}
      trigger={['click']}
      placement="bottomRight"
      overlayClassName="notification-center-overlay"
    >
      <Badge count={proximas.length} size="small" offset={[-2, 2]}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: PALETA.textoSuave,
            fontSize: 16,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <BellOutlined />
        </div>
      </Badge>
    </Dropdown>
  );
}
