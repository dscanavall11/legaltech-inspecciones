import { useState } from 'react';
import { Card, Switch, Popover, Popconfirm, Button, Drawer, Typography, Space, Tag, App } from 'antd';
import { EyeOutlined, SendOutlined } from '@ant-design/icons';
import {
  siguientePasoComparendo,
  ETAPAS_COMPARENDO,
  type EstadoComparendo,
  type AccionComparendoTipo,
} from '@/derecho';
import { useChangeCaseState } from '@/shared/legalCases/api';
import { useInspeccionStore } from '@/store/inspeccionStore';
import { generarBlobEjemploPlantilla, NOMBRE_PLANTILLA } from '@/features/ajustes/ejemploPlantillas';
import { PdfViewer } from '@/shared/documentos/PdfViewer';
import { ESTADO_COMPARENDO_LABEL, type ActuacionComparendo } from './types';
import { agruparEstadosPorEtapa, derivarEstadosFlujo, type EstadoNodoFlujo } from './flujoNavegableEstado';
import { PALETA, ELEVACION } from '@/theme/theme';

const { Text } = Typography;

/**
 * evento -> documentKey del checklist `plantillas-personalizadas`. Mismo
 * asociado que usa SiguientePasoComparendo.tsx para generar y previsualizar
 * (Task 10/11) — aquí se reutiliza generarBlobEjemploPlantilla con datos de
 * ejemplo (nunca datos reales del expediente) porque este mapa es guía, no
 * el trámite en curso.
 */
const DOCUMENT_KEY_POR_EVENTO: Partial<Record<AccionComparendoTipo, string>> = {
  avocar_y_citar_audiencia: 'auto-avoca-cita-audiencia',
  decretar_pruebas: 'auto-decreta-pruebas-suspende',
  constancia_inasistencia: 'auto-inasistencia',
  emitir_fallo: 'fallo-comparendo',
  fallo_por_inasistencia: 'fallo-comparendo',
  constancia_incumplimiento_pago: 'constancia-incumplimiento-pronto-pago',
  constancia_incumplimiento_actividad: 'constancia-incumplimiento-actividad-pedagogica',
  generar_acta_firmeza: 'acta-firmeza',
};

const ESTILO_NODO: Record<EstadoNodoFlujo, { background: string; color: string; border: string; fontWeight: number }> = {
  actual: { background: PALETA.azul, color: '#ffffff', border: `1px solid ${PALETA.azul}`, fontWeight: 700 },
  visitado: {
    background: PALETA.azulSuave,
    color: PALETA.azulOscuro,
    border: `1px solid ${PALETA.azulSuave}`,
    fontWeight: 500,
  },
  alcanzable: { background: 'transparent', color: PALETA.texto, border: `1.5px dashed ${PALETA.azul}`, fontWeight: 500 },
  neutral: { background: 'transparent', color: PALETA.textoTenue, border: `1px solid ${PALETA.borde}`, fontWeight: 400 },
};

const LEYENDA: ReadonlyArray<{ estado: EstadoNodoFlujo; label: string }> = [
  { estado: 'actual', label: 'Estado actual' },
  { estado: 'visitado', label: 'Ya recorrido' },
  { estado: 'alcanzable', label: 'Siguiente posible' },
  { estado: 'neutral', label: 'Sin recorrer' },
];

function NodoEstado({
  estado,
  status,
  modoPruebas,
  generandoPrevia,
  saltando,
  onVerPrevia,
  onSaltarA,
}: {
  estado: EstadoComparendo;
  status: EstadoNodoFlujo;
  modoPruebas: boolean;
  generandoPrevia: string | null;
  saltando: boolean;
  onVerPrevia: (documentKey: string) => void;
  onSaltarA: (estado: EstadoComparendo) => void;
}) {
  const paso = siguientePasoComparendo(estado);
  const estilo = ESTILO_NODO[status];

  return (
    <Popover
      trigger="click"
      title={ESTADO_COMPARENDO_LABEL[estado]}
      content={
        <div style={{ maxWidth: 300 }}>
          <Text style={{ fontSize: 12.5 }}>{paso.mensaje}</Text>
          {paso.acciones.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {paso.acciones.map((a) => {
                const documentKey = DOCUMENT_KEY_POR_EVENTO[a.tipo];
                return (
                  <div
                    key={a.tipo}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
                  >
                    <Text style={{ fontSize: 12 }}>• {a.label}</Text>
                    {documentKey && (
                      <Button
                        size="small"
                        type="text"
                        icon={<EyeOutlined />}
                        loading={generandoPrevia === documentKey}
                        onClick={() => onVerPrevia(documentKey)}
                      >
                        Vista previa
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {modoPruebas && (
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${PALETA.borde}` }}>
              <Popconfirm
                title="Modo pruebas"
                description={`Lleva el expediente al estado "${ESTADO_COMPARENDO_LABEL[estado]}" sin pasar por el trámite real — solo para pruebas.`}
                okText="Llevar el caso aquí"
                cancelText="Cancelar"
                okButtonProps={{ danger: true, loading: saltando }}
                onConfirm={() => onSaltarA(estado)}
              >
                <Button size="small" danger icon={<SendOutlined />} block>
                  Llevar el caso aquí
                </Button>
              </Popconfirm>
            </div>
          )}
        </div>
      }
    >
      <button
        type="button"
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'block',
          width: '100%',
          boxSizing: 'border-box',
          padding: '6px 9px',
          borderRadius: 8,
          fontSize: 12.5,
          textAlign: 'left',
          ...estilo,
        }}
      >
        {ESTADO_COMPARENDO_LABEL[estado]}
      </button>
    </Popover>
  );
}

/**
 * Mapa navegable de la máquina de estados del comparendo (Task 15): las
 * columnas son las etapas (ETAPAS_COMPARENDO), cada nodo un EstadoComparendo.
 * El estado actual, los ya recorridos (historial de actuaciones) y los
 * alcanzables en un salto se resaltan (derivarEstadosFlujo). Cada nodo
 * expone en su Popover la guía procesal, sus acciones salientes y —cuando
 * corresponde— una vista previa de la plantilla que produce esa acción.
 * "Modo pruebas" añade un salto directo a cualquier estado, vía el mismo
 * useChangeCaseState advisory que usa SiguientePasoComparendo (el backend
 * acepta cualquier estado y devuelve warnings/withinFlow, nunca rechaza).
 */
export function FlujoNavegable({
  id,
  estadoActual,
  actuaciones,
}: {
  id: string;
  estadoActual: EstadoComparendo;
  actuaciones: ActuacionComparendo[];
}) {
  const { message } = App.useApp();
  const config = useInspeccionStore((s) => s.config);
  const cambiarEstado = useChangeCaseState();
  const [modoPruebas, setModoPruebas] = useState(false);
  const [previa, setPrevia] = useState<{ nombre: string; blob: Blob } | null>(null);
  const [generandoPrevia, setGenerandoPrevia] = useState<string | null>(null);

  const mapaEstados = derivarEstadosFlujo(
    estadoActual,
    actuaciones.map((a) => a.estadoCodigo),
  );
  const columnas = agruparEstadosPorEtapa(ETAPAS_COMPARENDO.length);

  async function verPrevia(documentKey: string) {
    setGenerandoPrevia(documentKey);
    try {
      const blob = await generarBlobEjemploPlantilla(documentKey, config);
      if (!blob) {
        message.error('No hay generador de ejemplo para esta plantilla.');
        return;
      }
      setPrevia({ nombre: NOMBRE_PLANTILLA[documentKey] ?? documentKey, blob });
    } catch {
      message.error('No se pudo generar la previsualización.');
    } finally {
      setGenerandoPrevia(null);
    }
  }

  function saltarA(estado: EstadoComparendo) {
    cambiarEstado.mutate(
      { id, state: estado },
      {
        onSuccess: (data) =>
          data.warnings.length > 0
            ? message.warning(`Aplicado fuera del flujo definido: ${data.warnings.join(' ')}`)
            : message.success(`Caso llevado a "${ESTADO_COMPARENDO_LABEL[estado]}".`),
        onError: () => message.error('No se pudo cambiar el estado del expediente.'),
      },
    );
  }

  return (
    <Card variant="borderless" style={{ boxShadow: ELEVACION.base }} styles={{ body: { padding: '16px 20px' } }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <Text strong style={{ fontSize: 14.5 }}>
            Mapa del trámite
          </Text>
          <div style={{ fontSize: 12, color: PALETA.textoTenue, marginTop: 1 }}>
            Los 17 estados del comparendo (arts. 180, 222, 223 y 223A, Ley 1801/2016) y dónde está este expediente.
          </div>
        </div>
        <Space size={8} align="center">
          {modoPruebas && (
            <Tag color="warning" style={{ marginRight: 0 }}>
              Los saltos no siguen el trámite real
            </Tag>
          )}
          <Text type="secondary" style={{ fontSize: 12.5 }}>
            Modo pruebas
          </Text>
          <Switch size="small" checked={modoPruebas} onChange={setModoPruebas} />
        </Space>
      </div>

      <Space size={14} style={{ margin: '12px 0 14px' }} wrap>
        {LEYENDA.map((l) => (
          <Space key={l.estado} size={5}>
            <span
              aria-hidden
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                display: 'inline-block',
                background: ESTILO_NODO[l.estado].background === 'transparent' ? PALETA.superficie : ESTILO_NODO[l.estado].background,
                border: ESTILO_NODO[l.estado].border,
              }}
            />
            <Text type="secondary" style={{ fontSize: 11.5 }}>
              {l.label}
            </Text>
          </Space>
        ))}
      </Space>

      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {columnas.map((estados, i) => (
          <div key={ETAPAS_COMPARENDO[i]} style={{ minWidth: 168, flex: '1 1 0' }}>
            <Text type="secondary" style={{ fontSize: 11, letterSpacing: '0.06em', fontWeight: 600 }}>
              {ETAPAS_COMPARENDO[i].toUpperCase()}
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {estados.map((estado) => (
                <NodoEstado
                  key={estado}
                  estado={estado}
                  status={mapaEstados[estado]}
                  modoPruebas={modoPruebas}
                  generandoPrevia={generandoPrevia}
                  saltando={cambiarEstado.isPending}
                  onVerPrevia={verPrevia}
                  onSaltarA={saltarA}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <Drawer title={previa?.nombre} open={previa !== null} onClose={() => setPrevia(null)} width={720}>
        {previa && <PdfViewer archivo={previa.blob} />}
      </Drawer>
    </Card>
  );
}
