import { useNavigate } from 'react-router-dom';
import { Timeline, Button, Popconfirm, Space, Typography, App } from 'antd';
import { FileTextOutlined, RollbackOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useChangeCaseState } from '@/shared/legalCases/api';
import { ESTADO_LABEL, type Actuacion, type EstadoQuerella } from './types';
import { PALETA } from '@/theme/theme';

const { Text } = Typography;

// Estado -> pantalla de (re)redacción de su documento, cuando el estado produce uno.
const RUTA_DOCUMENTO: Record<string, (id: string) => string> = {
  fallo_emitido: (id) => `/panel/analisis?caso=${id}`,
  en_firmeza: (id) => `/panel/querellas/${id}/documento/constancia`,
};

/**
 * Línea de tiempo de los estados por los que pasó el expediente. Desde cada
 * estado anterior el inspector puede devolver el caso a ese estado (el backend
 * aplica cualquier transición; fuera de flujo solo avisa) y re-redactar el
 * documento que ese estado produce, versionándolo en el expediente S3.
 */
export function LineaTiempoEstados({
  caseId,
  actuaciones,
  estadoActual,
}: {
  caseId: string;
  actuaciones: Actuacion[];
  estadoActual: EstadoQuerella;
}) {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const cambiarEstado = useChangeCaseState();

  const etiqueta = (codigo: string) => ESTADO_LABEL[codigo as EstadoQuerella] ?? codigo;

  const volverAEstado = (codigo: string) => {
    cambiarEstado.mutate(
      { id: caseId, state: codigo },
      {
        onSuccess: (r) =>
          (r.withinFlow ? message.success : message.warning)(
            r.withinFlow
              ? `Expediente devuelto al estado «${etiqueta(codigo)}».`
              : `Expediente movido a «${etiqueta(codigo)}» (fuera del flujo normal).`,
          ),
        onError: () => message.error('No se pudo cambiar el estado del expediente.'),
      },
    );
  };

  const items = actuaciones.map((a) => {
    const codigo = a.estadoCodigo;
    const esActual = codigo === estadoActual;
    const rutaDoc = codigo ? RUTA_DOCUMENTO[codigo] : undefined;
    return {
      color: esActual ? PALETA.azul : 'gray',
      children: (
        <div>
          <div style={{ fontWeight: 500, color: PALETA.texto }}>{a.titulo}</div>
          <div style={{ fontSize: 12, color: PALETA.textoTenue }}>
            {dayjs(a.fecha).format('D [de] MMMM, YYYY · h:mm a')}
          </div>
          {a.descripcion && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {a.descripcion}
            </Text>
          )}
          {(rutaDoc || (!esActual && codigo)) && (
            <Space size="small" style={{ marginTop: 6 }}>
              {rutaDoc && (
                <Button
                  size="small"
                  type="text"
                  icon={<FileTextOutlined />}
                  onClick={() => navigate(rutaDoc(caseId))}
                >
                  Re-redactar documento
                </Button>
              )}
              {!esActual && codigo && (
                <Popconfirm
                  title={`¿Devolver el expediente a «${etiqueta(codigo)}»?`}
                  description="El caso volverá a ese estado del trámite; podrás rehacer las actuaciones desde ahí."
                  okText="Volver a este estado"
                  cancelText="Cancelar"
                  onConfirm={() => volverAEstado(codigo)}
                >
                  <Button size="small" icon={<RollbackOutlined />} loading={cambiarEstado.isPending}>
                    Volver a este estado
                  </Button>
                </Popconfirm>
              )}
            </Space>
          )}
        </div>
      ),
    };
  });

  return actuaciones.length === 0 ? (
    <Text type="secondary">Aún no hay actuaciones registradas.</Text>
  ) : (
    <Timeline items={items} style={{ marginTop: 6 }} />
  );
}
