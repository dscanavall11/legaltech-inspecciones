import { useMemo, useState } from 'react';
import { Alert, Button, Card, Input, Select, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { ELEVACION } from '@/theme/theme';
import { calcularTermino } from '@/shared/terminos/diasHabiles';
import { useProcesos } from './api';
import {
  colorEstado,
  definicionDe,
  descripcionTermino,
  ESTADOS_POST_FALLO,
  etiquetaEstado,
  TIPOS_PROCESO,
  TIPOS_PROCESO_LISTA,
  type FilaProceso,
  type TipoProceso,
} from './types';
import { TEXTO } from '@/theme/escala';

const { Title, Text } = Typography;

const TODOS = 'todos';
/** Filtro sintético (no es un `estado` real): expedientes con fallo proferido y motivado. */
const CON_FALLO = 'con_fallo';

export interface BandejaProcesosProps {
  /** Fija la bandeja a un tipo (Querellas, Quejas…). Ausente = Mis procesos. */
  tipo?: TipoProceso;
  titulo: string;
  descripcion?: string;
  /** CTA de la esquina superior derecha. */
  accion?: { label: string; ruta: string };
  /** Aviso cuando el tipo aún no tiene pantalla de detalle (apelaciones). */
  aviso?: string;
}

// Cerrado = ya no corre término: expediente FINALIZADO (ver ESTADOS_POST_FALLO).
const ESTADOS_CERRADOS = ESTADOS_POST_FALLO;

function ColumnaTermino({ fila }: { fila: FilaProceso }) {
  const cerrado = ESTADOS_CERRADOS.includes(fila.estado);
  const sinTermino = fila.diasTermino === undefined || fila.fechaRadicacion === '';

  return cerrado ? (
    <Tag color="default">Cerrado</Tag>
  ) : sinTermino ? (
    <Tooltip title="El expediente no registra un término en su metadata">
      <Text type="secondary">—</Text>
    </Tooltip>
  ) : (
    <TagTermino fila={fila} />
  );
}

function TagTermino({ fila }: { fila: FilaProceso }) {
  const { diasRestantes, vencido } = calcularTermino(dayjs(fila.fechaRadicacion), fila.diasTermino as number);
  const tooltip = descripcionTermino(fila);
  return vencido ? (
    <Tooltip title={tooltip}>
      <Tag color="error">Vencido</Tag>
    </Tooltip>
  ) : (
    <Tooltip title={tooltip}>
      <Tag color={diasRestantes <= 3 ? 'warning' : 'success'}>{diasRestantes} días háb.</Tag>
    </Tooltip>
  );
}

/**
 * Bandeja única de expedientes. Reemplaza los cinco listados que consultaban
 * la misma tabla `legal_cases` (cola, casos, fallos, querellas, quejas): la
 * vista por tipo es esta misma con `tipo` fijo.
 */
export function BandejaProcesos({
  tipo,
  titulo,
  descripcion,
  accion,
  aviso,
}: BandejaProcesosProps) {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useProcesos({ caseType: tipo });
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>(TODOS);
  // ?fallo=1 preselecciona "Con fallo" — así el tile del dashboard y el
  // redirect de /panel/fallos aterrizan filtrados, no en la bandeja entera.
  const [searchParams] = useSearchParams();
  const [filtroEstado, setFiltroEstado] = useState<string>(
    searchParams.get('fallo') ? CON_FALLO : TODOS,
  );

  const filas = data ?? [];
  const rotulos = tipo ? TIPOS_PROCESO[tipo].rotulos : (['Parte A', 'Parte B'] as const);

  const estadosPresentes = useMemo(
    () => Array.from(new Set(filas.map((f) => f.estado))).sort(),
    [filas],
  );

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const coincide = (f: FilaProceso) =>
      q === '' ||
      [f.radicado, f.parteA, f.parteB, f.asunto].some((campo) => campo.toLowerCase().includes(q));
    return filas
      .filter(coincide)
      .filter((f) => filtroTipo === TODOS || f.tipo === filtroTipo)
      .filter((f) => {
        if (filtroEstado === TODOS) return true;
        if (filtroEstado === CON_FALLO) return f.tieneFallo;
        return f.estado === filtroEstado;
      });
  }, [filas, busqueda, filtroTipo, filtroEstado]);

  const columnaTipo: ColumnsType<FilaProceso> = tipo
    ? []
    : [
        {
          title: 'Tipo',
          dataIndex: 'tipo',
          key: 'tipo',
          width: 150,
          render: (t: string) => definicionDe(t)?.label ?? t,
        },
      ];

  const columns: ColumnsType<FilaProceso> = [
    {
      title: 'Radicado',
      dataIndex: 'radicado',
      key: 'radicado',
      width: 170,
      render: (v: string) => (
        <span className="font-display" style={{ fontSize: TEXTO.titulo }}>
          {v}
        </span>
      ),
    },
    ...columnaTipo,
    { title: rotulos[0], dataIndex: 'parteA', key: 'parteA', ellipsis: true },
    { title: rotulos[1], dataIndex: 'parteB', key: 'parteB', ellipsis: true },
    { title: 'Asunto', dataIndex: 'asunto', key: 'asunto', ellipsis: true },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 190,
      render: (estado: string) => <Tag color={colorEstado(estado)}>{etiquetaEstado(estado)}</Tag>,
    },
    {
      title: 'Término',
      key: 'termino',
      width: 130,
      render: (_, fila) => <ColumnaTermino fila={fila} />,
    },
    {
      title: '',
      key: 'ir',
      width: 48,
      render: (_, fila) =>
        definicionDe(fila.tipo)?.ruta ? <RightOutlined style={{ color: '#9aa0a6' }} /> : null,
    },
  ];

  const abrir = (fila: FilaProceso) => {
    const ruta = definicionDe(fila.tipo)?.ruta?.(fila.id);
    return ruta ? navigate(ruta) : undefined;
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            {titulo}
          </Title>
          {descripcion && (
            <Text type="secondary" style={{ display: 'block', marginTop: 2 }}>
              {descripcion}
            </Text>
          )}
        </div>
        {accion && (
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => navigate(accion.ruta)}>
            {accion.label}
          </Button>
        )}
      </div>

      {aviso && <Alert type="info" showIcon message={aviso} />}

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="No se pudieron cargar los expedientes"
          description="Verifica tu conexión o intenta de nuevo en unos minutos."
        />
      ) : (
        <Card variant="borderless" style={{ boxShadow: ELEVACION.base }} styles={{ body: { padding: 8 } }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '6px 6px 10px' }}>
            <Input
              allowClear
              placeholder="Buscar por radicado, partes o asunto"
              prefix={<SearchOutlined />}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ maxWidth: 420, flex: '1 1 280px' }}
            />
            {!tipo && (
              <Select
                value={filtroTipo}
                onChange={setFiltroTipo}
                style={{ width: 190 }}
                options={[
                  { value: TODOS, label: 'Todos los tipos' },
                  ...TIPOS_PROCESO_LISTA.map((t) => ({ value: t, label: TIPOS_PROCESO[t].label })),
                ]}
              />
            )}
            <Select
              value={filtroEstado}
              onChange={setFiltroEstado}
              style={{ width: 210 }}
              options={[
                { value: TODOS, label: 'Todos los estados' },
                { value: CON_FALLO, label: 'Con fallo' },
                ...estadosPresentes.map((e) => ({ value: e, label: etiquetaEstado(e) })),
              ]}
            />
          </div>
          <Table<FilaProceso>
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={filtradas}
            pagination={{ pageSize: 15, showSizeChanger: true }}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: 'No hay expedientes con los filtros actuales.' }}
            onRow={(fila) => ({
              onClick: () => abrir(fila),
              style: { cursor: definicionDe(fila.tipo)?.ruta ? 'pointer' : 'default' },
            })}
          />
        </Card>
      )}
    </Space>
  );
}
