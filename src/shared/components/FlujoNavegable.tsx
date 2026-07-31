import { useState } from 'react';
import { Card, Switch, Popover, Popconfirm, Button, Typography, Space, Tag, App } from 'antd';
import { EyeOutlined, SendOutlined } from '@ant-design/icons';
import { agruparEstadosPorEtapa, derivarEstadosFlujo, type EstadoNodoFlujo, type TransicionFlujo } from '@/derecho';
import { useChangeCaseState } from '@/shared/legalCases/api';
import { useInspeccionStore } from '@/store/inspeccionStore';
import { generarBlobEjemploPlantilla, NOMBRE_PLANTILLA } from '@/shared/documentos/ejemploPlantillas';
import { VisorLateral } from '@/shared/documentos/VisorLateral';
import { PALETA, ELEVACION } from '@/theme/theme';

const { Text } = Typography;

interface PasoFlujoGenerico {
  mensaje: string;
  acciones: ReadonlyArray<{ tipo: string; label: string }>;
}

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

function NodoEstado<TEstado extends string>({
  estado,
  status,
  modoPruebas,
  generandoPrevia,
  saltando,
  estadoLabel,
  siguientePaso,
  documentKeyPorEvento,
  onVerPrevia,
  onSaltarA,
}: {
  estado: TEstado;
  status: EstadoNodoFlujo;
  modoPruebas: boolean;
  generandoPrevia: string | null;
  saltando: boolean;
  estadoLabel: Record<TEstado, string>;
  siguientePaso: (estado: TEstado) => PasoFlujoGenerico;
  documentKeyPorEvento?: Partial<Record<string, string>>;
  onVerPrevia: (documentKey: string) => void;
  onSaltarA: (estado: TEstado) => void;
}) {
  const paso = siguientePaso(estado);
  const estilo = ESTILO_NODO[status];

  return (
    <Popover
      trigger="click"
      title={estadoLabel[estado]}
      content={
        <div style={{ maxWidth: 300 }}>
          <Text style={{ fontSize: 12.5 }}>{paso.mensaje}</Text>
          {paso.acciones.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {paso.acciones.map((a) => {
                const documentKey = documentKeyPorEvento?.[a.tipo];
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
                description={`Lleva el expediente al estado "${estadoLabel[estado]}" sin pasar por el trámite real — solo para pruebas.`}
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
        {estadoLabel[estado]}
      </button>
    </Popover>
  );
}

/**
 * Mapa navegable de una máquina de estados (Task 15, generalizado en Task 20
 * para servir cualquier trámite — comparendo, querella — vía props en vez de
 * imports fijos a un dominio). Las columnas son las etapas, cada nodo un
 * estado. El estado actual, los ya recorridos (historial de actuaciones) y
 * los alcanzables en un salto se resaltan (derivarEstadosFlujo, @/derecho).
 * Cada nodo expone en su Popover la guía procesal, sus acciones salientes y
 * — cuando `documentKeyPorEvento` trae una entrada para esa acción — una
 * vista previa de la plantilla que produce (si el dominio no genera
 * documentos todavía, como querella, el botón simplemente no aparece).
 * "Modo pruebas" añade un salto directo a cualquier estado, vía el mismo
 * useChangeCaseState advisory que usan los SiguientePaso* del dominio (el
 * backend acepta cualquier estado y devuelve warnings/withinFlow, nunca
 * rechaza).
 */
export function FlujoNavegable<TEstado extends string>({
  id,
  estadoActual,
  actuaciones,
  todosLosEstados,
  transiciones,
  excluirDestino,
  etapas,
  etapaActivaPorEstado,
  estadoLabel,
  siguientePaso,
  documentKeyPorEvento,
  descripcionMapa,
}: {
  id: string;
  estadoActual: TEstado;
  actuaciones: ReadonlyArray<{ estadoCodigo?: string | null }>;
  todosLosEstados: ReadonlyArray<TEstado>;
  transiciones: ReadonlyArray<TransicionFlujo<TEstado>>;
  /** Destino a excluir de "alcanzable" que no es un estado propio de la máquina (p. ej. acta_firmeza del comparendo). */
  excluirDestino?: string;
  etapas: ReadonlyArray<string>;
  etapaActivaPorEstado: Record<TEstado, number>;
  estadoLabel: Record<TEstado, string>;
  siguientePaso: (estado: TEstado) => PasoFlujoGenerico;
  documentKeyPorEvento?: Partial<Record<string, string>>;
  descripcionMapa: string;
}) {
  const { message } = App.useApp();
  const config = useInspeccionStore((s) => s.config);
  const cambiarEstado = useChangeCaseState();
  const [modoPruebas, setModoPruebas] = useState(false);
  const [previa, setPrevia] = useState<{ nombre: string; blob: Blob } | null>(null);
  const [generandoPrevia, setGenerandoPrevia] = useState<string | null>(null);

  const mapaEstados = derivarEstadosFlujo(
    todosLosEstados,
    estadoActual,
    actuaciones.map((a) => a.estadoCodigo),
    transiciones,
    excluirDestino,
  );
  const columnas = agruparEstadosPorEtapa(todosLosEstados, etapaActivaPorEstado, etapas.length);

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

  function saltarA(estado: TEstado) {
    cambiarEstado.mutate(
      { id, state: estado },
      {
        onSuccess: (data) =>
          data.warnings.length > 0
            ? message.warning(`Aplicado fuera del flujo definido: ${data.warnings.join(' ')}`)
            : message.success(`Caso llevado a "${estadoLabel[estado]}".`),
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
          <div style={{ fontSize: 12, color: PALETA.textoTenue, marginTop: 1 }}>{descripcionMapa}</div>
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
          <div key={etapas[i]} style={{ minWidth: 168, flex: '1 1 0' }}>
            <Text type="secondary" style={{ fontSize: 11, letterSpacing: '0.06em', fontWeight: 600 }}>
              {etapas[i].toUpperCase()}
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
                  estadoLabel={estadoLabel}
                  siguientePaso={siguientePaso}
                  documentKeyPorEvento={documentKeyPorEvento}
                  onVerPrevia={verPrevia}
                  onSaltarA={saltarA}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <VisorLateral titulo={previa?.nombre} abierto={previa !== null} archivo={previa?.blob ?? null} onCerrar={() => setPrevia(null)} />
    </Card>
  );
}
