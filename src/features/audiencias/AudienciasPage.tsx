import { useMemo, useState, type CSSProperties } from 'react';
import { Card, Typography, Empty, Skeleton, Alert, Tag } from 'antd';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  LeftOutlined,
  RightOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useAudiencias, useProgramarAudiencia, type Audiencia } from './api';
import { useQuerellas } from '@/features/querellas/api';
import type { EstadoQuerella } from '@/features/querellas/types';
import { PALETA } from '@/theme/theme';
import { glassChrome, glassBackdrop } from '@/theme/glass';
import { usePrefersReducedTransparency } from '@/shared/hooks/usePrefersReducedTransparency';

const { Title, Text } = Typography;

// Solo los casos activos (no cerrados) necesitan que se les programe audiencia.
const ESTADOS_ACTIVOS: EstadoQuerella[] = ['radicada', 'en_tramite'];

function claveDia(d: Dayjs): string {
  return d.format('YYYY-MM-DD');
}

const ghostBtnStyle: CSSProperties = {
  padding: '7px 14px',
  borderRadius: 10,
  border: `1px solid ${PALETA.borde}`,
  background: PALETA.superficie,
  cursor: 'pointer',
  fontSize: 13,
  color: PALETA.textoSuave,
};

const primaryBtnStyle: CSSProperties = {
  padding: '7px 16px',
  borderRadius: 10,
  border: 'none',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  color: '#fff',
  background: PALETA.azul,
};

export function AudienciasPage() {
  const { data: audienciasData, isLoading, isError } = useAudiencias();
  const { data: querellasData, isLoading: cargandoQuerellas } = useQuerellas();
  const programar = useProgramarAudiencia();
  const reducirMovimiento = useReducedMotion();
  const reducirTransparencia = usePrefersReducedTransparency();

  const [mesActual, setMesActual] = useState(() => dayjs().startOf('month'));
  const [diaSeleccionado, setDiaSeleccionado] = useState<Dayjs | null>(null);
  const [casoSeleccionado, setCasoSeleccionado] = useState<string | null>(null);
  const [hora, setHora] = useState('09:00');

  const audiencias = audienciasData ?? [];
  const querellas = querellasData ?? [];

  const audienciasPorDia = useMemo(() => {
    const mapa = new Map<string, Audiencia[]>();
    for (const a of audiencias) {
      const clave = dayjs(a.fecha).format('YYYY-MM-DD');
      const lista = mapa.get(clave) ?? [];
      lista.push(a);
      mapa.set(clave, lista);
    }
    return mapa;
  }, [audiencias]);

  const casosSinAudiencia = useMemo(
    () =>
      querellas.filter(
        (q) =>
          ESTADOS_ACTIVOS.includes(q.estado) &&
          !audiencias.some((a) => a.querellaId === q.id),
      ),
    [querellas, audiencias],
  );

  const diasGrid = useMemo(() => {
    const inicio = mesActual.startOf('week');
    const fin = mesActual.endOf('month').endOf('week');
    const dias: Dayjs[] = [];
    let cursor = inicio;
    while (cursor.isBefore(fin) || cursor.isSame(fin, 'day')) {
      dias.push(cursor);
      cursor = cursor.add(1, 'day');
    }
    return dias;
  }, [mesActual]);

  const caso = casoSeleccionado ? (querellas.find((q) => q.id === casoSeleccionado) ?? null) : null;

  function confirmarProgramacion() {
    if (!diaSeleccionado || !caso) return;
    programar.mutate(
      { querellaId: caso.id, fecha: `${claveDia(diaSeleccionado)}T${hora}` },
      {
        onSuccess: () => {
          setCasoSeleccionado(null);
          setDiaSeleccionado(null);
          setHora('09:00');
        },
      },
    );
  }

  if (isLoading || cargandoQuerellas) {
    return (
      <Card variant="borderless">
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  }

  const audienciasDelDiaSeleccionado = diaSeleccionado
    ? (audienciasPorDia.get(claveDia(diaSeleccionado)) ?? [])
    : [];

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
          <Title level={3} style={{ margin: 0 }}>
            Audiencias
          </Title>
          <Text type="secondary" style={{ fontSize: 13.5 }}>
            {casoSeleccionado
              ? 'Ahora selecciona un día en el calendario para agendar este caso.'
              : 'Calendario de audiencias — agenda los casos sin fecha desde la lista.'}
          </Text>
        </div>

        {/* Navegador de mes — un solo control segmentado, no botones sueltos */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            border: `1px solid ${PALETA.borde}`,
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <button
            aria-label="Mes anterior"
            onClick={() => setMesActual((m) => m.subtract(1, 'month'))}
            style={navSegmentStyle}
          >
            <LeftOutlined style={{ fontSize: 12 }} />
          </button>
          <div
            style={{
              padding: '0 14px',
              fontSize: 13.5,
              fontWeight: 600,
              minWidth: 128,
              textAlign: 'center',
              textTransform: 'capitalize',
              color: PALETA.texto,
              borderLeft: `1px solid ${PALETA.borde}`,
              borderRight: `1px solid ${PALETA.borde}`,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {mesActual.format('MMMM YYYY')}
          </div>
          <button
            aria-label="Mes siguiente"
            onClick={() => setMesActual((m) => m.add(1, 'month'))}
            style={navSegmentStyle}
          >
            <RightOutlined style={{ fontSize: 12 }} />
          </button>
          <button
            onClick={() => setMesActual(dayjs().startOf('month'))}
            style={{ ...navSegmentStyle, width: 'auto', padding: '0 14px', borderLeft: `1px solid ${PALETA.borde}` }}
          >
            Hoy
          </button>
        </div>
      </div>

      {isError && (
        <Alert type="error" showIcon message="No se pudieron cargar las audiencias" style={{ marginBottom: 16 }} />
      )}

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Card variant="borderless" style={{ flex: '1 1 560px', minWidth: 320 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
            {['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map((d) => (
              <div
                key={d}
                style={{
                  textAlign: 'center',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: PALETA.textoTenue,
                  padding: '4px 0',
                }}
              >
                {d}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {diasGrid.map((dia) => {
              const clave = claveDia(dia);
              const enMes = dia.month() === mesActual.month();
              const esHoy = dia.isSame(dayjs(), 'day');
              const audienciasDia = audienciasPorDia.get(clave) ?? [];
              return (
                <button
                  key={clave}
                  onClick={() => setDiaSeleccionado(dia)}
                  style={{
                    aspectRatio: '1',
                    border: 'none',
                    borderRadius: 10,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    background: esHoy ? PALETA.azulSuave : 'transparent',
                    opacity: enMes ? 1 : 0.35,
                    outline: caso && enMes ? `1px dashed ${PALETA.azul}88` : 'none',
                    outlineOffset: -1,
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (enMes) e.currentTarget.style.background = esHoy ? PALETA.azulSuave : '#f1f3f4';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = esHoy ? PALETA.azulSuave : 'transparent';
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: esHoy ? 700 : 500, color: esHoy ? PALETA.azulOscuro : PALETA.texto }}>
                    {dia.date()}
                  </span>
                  <span style={{ display: 'flex', gap: 2 }}>
                    {audienciasDia.slice(0, 3).map((a) => (
                      <span key={a.id} style={{ width: 5, height: 5, borderRadius: '50%', background: PALETA.rojo }} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card variant="borderless" style={{ flex: '0 1 300px', minWidth: 260 }}>
          <Text strong style={{ fontSize: 14 }}>
            Casos sin audiencia programada
          </Text>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {casosSinAudiencia.length === 0 ? (
              <Text type="secondary" style={{ fontSize: 12.5 }}>
                No hay casos pendientes por agendar.
              </Text>
            ) : (
              casosSinAudiencia.map((q) => {
                const activo = casoSeleccionado === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCasoSeleccionado(activo ? null : q.id)}
                    style={{
                      textAlign: 'left',
                      border: `1px solid ${activo ? PALETA.azul : PALETA.borde}`,
                      borderRadius: 10,
                      padding: '9px 12px',
                      cursor: 'pointer',
                      background: activo ? PALETA.azulSuave : 'transparent',
                      transition: 'background 150ms ease, border-color 150ms ease',
                    }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: PALETA.texto }}>
                      Radicado {q.radicado}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: PALETA.textoSuave,
                        marginTop: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {q.asunto}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Panel flotante de día — este sí es "chrome" real por encima del contenido: blur-focus. */}
      <AnimatePresence>
        {diaSeleccionado && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Detalle del día"
            onClick={() => setDiaSeleccionado(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reducirMovimiento ? { duration: 0 } : { duration: 0.16 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ...glassBackdrop(reducirTransparencia),
            }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: reducirMovimiento ? 1 : 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reducirMovimiento ? 1 : 0.94 }}
              transition={reducirMovimiento ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 26 }}
              style={{
                width: 380,
                maxWidth: 'calc(100vw - 32px)',
                borderRadius: 16,
                padding: 22,
                ...glassChrome(reducirTransparencia),
                border: `1px solid ${PALETA.borde}`,
                boxShadow: '0 12px 32px rgba(32,33,36,.18)',
              }}
            >
              <Text strong style={{ fontSize: 15 }}>
                {diaSeleccionado.format('D [de] MMMM')}
              </Text>

              {caso ? (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 12.5, color: PALETA.textoSuave, marginBottom: 10 }}>
                    Agendar audiencia para <strong>Radicado {caso.radicado}</strong> — {caso.asunto}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <ClockCircleOutlined style={{ color: PALETA.textoTenue }} />
                    <input
                      type="time"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      style={{ border: `1px solid ${PALETA.borde}`, borderRadius: 10, padding: '6px 10px', fontSize: 13.5 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => setDiaSeleccionado(null)} style={ghostBtnStyle}>
                      Cancelar
                    </button>
                    <button onClick={confirmarProgramacion} disabled={programar.isPending} style={primaryBtnStyle}>
                      {programar.isPending ? 'Agendando…' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {audienciasDelDiaSeleccionado.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Sin audiencias este día." />
                  ) : (
                    audienciasDelDiaSeleccionado.map((a) => (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CheckCircleOutlined style={{ color: PALETA.verde }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{a.asunto}</div>
                          <div style={{ fontSize: 11.5, color: PALETA.textoSuave }}>
                            {a.querellante} contra {a.querellado}
                          </div>
                        </div>
                        <Tag color="blue">{dayjs(a.fecha).format('h:mm a')}</Tag>
                      </div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const navSegmentStyle: CSSProperties = {
  width: 34,
  height: 34,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 13,
  color: PALETA.textoSuave,
};
