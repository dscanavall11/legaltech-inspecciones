import { useEffect, useState } from 'react';
import { Card, Input, Typography, Tag } from 'antd';
import {
  BulbOutlined,
  ReadOutlined,
  EditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { fechaLarga } from '@/shared/util/fechas';
import { PALETA } from '@/theme/theme';

const { Text, Title } = Typography;

const CLAVE_NOTA = 'dashboard:nota-diaria';

const NOTICAS_JURIDICAS = [
  {
    titulo: 'Corte Suprema reafirma término de 5 días hábiles del art. 223A',
    fuente: 'Sentencia STC-2026-014',
    resumen:
      'La Sala Civil confirma que el término de firmeza corre desde la notificación del comparendo y no admite suspensión por recursos interpuestos fuera de término.',
  },
  {
    titulo: 'Nuevo formato unificado de actas para inspecciones de convivencia',
    fuente: 'Resolución 0407 de 2026',
    resumen:
      'La Procuraduría publica el formato obligatorio para actas de firmeza; entra en vigor el próximo mes y reemplaza los modelos locales.',
  },
  {
    titulo: 'Jurisprudencia sobre conciliación en quejas por perturbación',
    fuente: 'Expediente 2026-0031',
    resumen:
      'Se reafirma que la audiencia de conciliación es requisito de procedibilidad antes de proferir fallo en quejas vecinales.',
  },
];

export function DailyBriefCard() {
  const [nota, setNota] = useState('');
  const [guardada, setGuardada] = useState(false);

  useEffect(() => {
    const hoy = dayjs().format('YYYY-MM-DD');
    const crudo = localStorage.getItem(CLAVE_NOTA);
    if (crudo) {
      try {
        const parsed = JSON.parse(crudo) as { fecha: string; texto: string };
        if (parsed.fecha === hoy) {
          setNota(parsed.texto);
          return;
        }
      } catch {
        // entrada corrupta: se ignora y se sobrescribe abajo
      }
    }
    setNota('');
  }, []);

  function persistir(texto: string) {
    const hoy = dayjs().format('YYYY-MM-DD');
    localStorage.setItem(CLAVE_NOTA, JSON.stringify({ fecha: hoy, texto }));
    setNota(texto);
    setGuardada(true);
    window.setTimeout(() => setGuardada(false), 1400);
  }

  return (
    <Card variant="borderless" style={{ height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <BulbOutlined style={{ color: PALETA.azul, fontSize: 18 }} />
        <Title level={5} style={{ margin: 0 }}>
          Nota del día
        </Title>
        {guardada && (
          <Tag color="green" style={{ marginInlineEnd: 0, fontSize: 11 }}>
            Guardada
          </Tag>
        )}
      </div>
      <Text type="secondary" style={{ fontSize: 12.5, display: 'block', marginBottom: 10 }}>
        {fechaLarga()} · recordatorio local, se borra al cambiar el día.
      </Text>
      <Input.TextArea
        value={nota}
        onChange={(e) => persistir(e.target.value)}
        placeholder="Escribe tu nota del día: audiencias, pendientes, recordatorios…"
        autoSize={{ minRows: 3, maxRows: 6 }}
        style={{ borderRadius: 14 }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 22,
          marginBottom: 10,
        }}
      >
        <ReadOutlined style={{ color: PALETA.azul, fontSize: 16 }} />
        <Title level={5} style={{ margin: 0 }}>
          Noticias jurídicas
        </Title>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {NOTICAS_JURIDICAS.map((n) => (
          <div
            key={n.titulo}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: PALETA.fondo,
              border: `1px solid ${PALETA.borde}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <EditOutlined style={{ color: PALETA.textoTenue, fontSize: 12 }} />
              <Text strong style={{ fontSize: 13 }}>
                {n.titulo}
              </Text>
            </div>
            <Tag
              color="blue"
              style={{
                marginInlineEnd: 0,
                background: PALETA.azulSuave,
                color: PALETA.azulOscuro,
                border: 'none',
                fontSize: 10.5,
                marginBottom: 4,
              }}
            >
              {n.fuente}
            </Tag>
            <Text type="secondary" style={{ fontSize: 12.5, display: 'block', lineHeight: 1.5 }}>
              {n.resumen}
            </Text>
          </div>
        ))}
      </div>
    </Card>
  );
}