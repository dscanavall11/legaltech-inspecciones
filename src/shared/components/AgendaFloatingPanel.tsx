import { useMemo, useState } from 'react';
import { Typography, Button, Tag, Empty, Skeleton } from 'antd';
import { CloseOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs, { type Dayjs } from 'dayjs';
import { useOverlayStore } from '@/store/overlayStore';
import { useAudiencias } from '@/features/audiencias/api';
import { PALETA } from '@/theme/theme';
import { glassBackground, glassShadowLiquid } from '@/theme/glass';
import { usePrefersReducedTransparency } from '@/shared/hooks/usePrefersReducedTransparency';

const { Text, Title } = Typography;

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/**
 * Agenda flotante: un calendario de verdad (grilla de mes con los días que
 * tienen audiencia marcados), no una lista de próximos ítems - eso ya lo
 * cubre NotificationCenter. Anclada bajo el ícono de calendario del TopBar,
 * mismo cristal (Deepin OS) que el resto de los flotantes.
 */
export function AgendaFloatingPanel() {
  const navigate = useNavigate();
  const abierta = useOverlayStore((s) => s.agendaAbierta);
  const cerrar = useOverlayStore((s) => s.cerrarAgenda);
  const reducirTransparencia = usePrefersReducedTransparency();
  const { data: audiencias, isLoading } = useAudiencias();
  const [mesActual, setMesActual] = useState(() => dayjs().startOf('month'));
  const [diaSeleccionado, setDiaSeleccionado] = useState<Dayjs | null>(null);

  const porDia = useMemo(() => {
    const mapa = new Map<string, typeof audiencias>();
    for (const a of audiencias ?? []) {
      const clave = dayjs(a.fecha).format('YYYY-MM-DD');
      const lista = mapa.get(clave) ?? [];
      lista.push(a);
      mapa.set(clave, lista as NonNullable<typeof audiencias>);
    }
    return mapa;
  }, [audiencias]);

  if (!abierta) return null;

  const inicioGrilla = mesActual.startOf('month').startOf('week');
  const dias = Array.from({ length: 42 }, (_, i) => inicioGrilla.add(i, 'day'));
  const diaActivo = diaSeleccionado ?? dayjs();
  const audienciasDelDia = porDia.get(diaActivo.format('YYYY-MM-DD')) ?? [];

  return (
    <>
      <div onClick={cerrar} style={{ position: 'fixed', inset: 0, zIndex: 999 }} aria-hidden />
      <div
        role="dialog"
        aria-label="Calendario de audiencias"
        style={{
          position: 'fixed',
          top: 68,
          right: 96,
          width: 340,
          maxHeight: 'calc(100vh - 96px)',
          overflowY: 'auto',
          zIndex: 1000,
          borderRadius: 22,
          padding: 18,
          ...glassBackground(reducirTransparencia),
          boxShadow: glassShadowLiquid(PALETA.azul, 'ultra'),
          border: '1px solid rgba(255,255,255,0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Button
              type="text"
              size="small"
              shape="circle"
              icon={<LeftOutlined style={{ fontSize: 11 }} />}
              onClick={() => setMesActual((m) => m.subtract(1, 'month'))}
              aria-label="Mes anterior"
            />
            <Title level={5} style={{ margin: 0, minWidth: 130, textAlign: 'center', textTransform: 'capitalize' }}>
              {mesActual.format('MMMM YYYY')}
            </Title>
            <Button
              type="text"
              size="small"
              shape="circle"
              icon={<RightOutlined style={{ fontSize: 11 }} />}
              onClick={() => setMesActual((m) => m.add(1, 'month'))}
              aria-label="Mes siguiente"
            />
          </div>
          <Button type="text" shape="circle" icon={<CloseOutlined />} onClick={cerrar} aria-label="Cerrar" />
        </div>

        {isLoading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
              {DIAS_SEMANA.map((d) => (
                <div key={d} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: PALETA.textoTenue, padding: '4px 0' }}>
                  {d}
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {dias.map((dia) => {
                const claveDia = dia.format('YYYY-MM-DD');
                const tieneAudiencia = porDia.has(claveDia);
                const esMesActual = dia.isSame(mesActual, 'month');
                const esHoy = dia.isSame(dayjs(), 'day');
                const esSeleccionado = dia.isSame(diaActivo, 'day');
                return (
                  <button
                    key={claveDia}
                    onClick={() => setDiaSeleccionado(dia)}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      border: 'none',
                      borderRadius: 10,
                      cursor: 'pointer',
                      background: esSeleccionado ? PALETA.azul : esHoy ? PALETA.azulSuave : 'transparent',
                      color: esSeleccionado ? '#fff' : !esMesActual ? PALETA.textoTenue : esHoy ? PALETA.azulOscuro : PALETA.texto,
                      fontSize: 12.5,
                      fontWeight: esHoy || esSeleccionado ? 700 : 500,
                      opacity: esMesActual ? 1 : 0.4,
                    }}
                  >
                    {dia.format('D')}
                    {tieneAudiencia && (
                      <span
                        aria-hidden
                        style={{
                          position: 'absolute',
                          bottom: 3,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          background: esSeleccionado ? '#fff' : PALETA.naranja,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <Text style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: PALETA.textoTenue }}>
                {diaActivo.format('D [de] MMMM')}
              </Text>
              {audienciasDelDia.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Sin audiencias este día."
                  style={{ margin: '14px 0 4px' }}
                  imageStyle={{ height: 40 }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                  {audienciasDelDia.map((a) => (
                    <button
                      key={a!.id}
                      onClick={() => {
                        cerrar();
                        navigate(`/panel/querellas/${a!.querellaId}`);
                      }}
                      style={{
                        textAlign: 'left',
                        border: 'none',
                        background: 'rgba(255,255,255,0.5)',
                        borderRadius: 12,
                        padding: '8px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: PALETA.texto, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a!.querellante} vs. {a!.querellado}
                        </div>
                        <div style={{ fontSize: 11, color: PALETA.textoSuave }}>Radicado {a!.radicado}</div>
                      </div>
                      <Tag color="blue" style={{ marginInlineEnd: 0, flexShrink: 0 }}>
                        {dayjs(a!.fecha).format('h:mm a')}
                      </Tag>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <Button
          type="text"
          block
          onClick={() => {
            cerrar();
            navigate('/panel/audiencias');
          }}
          style={{ marginTop: 14, color: PALETA.azul }}
        >
          Ver agenda completa
        </Button>
      </div>
    </>
  );
}
