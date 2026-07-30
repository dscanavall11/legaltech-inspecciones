import { useMemo, useState } from 'react';
import { Table, Tag, Button, Input, Select, Typography, Alert } from 'antd';
import {
  SearchOutlined,
  FileTextOutlined,
  MessageOutlined,
  SafetyCertificateOutlined,
  FileOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCola } from './api';
import { ItemCola, TIPOS_COLA_LABEL, ESTADO_GENERAL_LABEL, ESTADO_GENERAL_COLOR } from './types';
import { ELEVACION, PALETA } from '@/theme/theme';

const { Text } = Typography;

const FILTRO_TIPO_OPCIONES = [
  { value: 'todos', label: 'Todos los tipos' },
  { value: 'querella', label: 'Querella' },
  { value: 'queja', label: 'Queja' },
  { value: 'acta_firmeza', label: 'Acta de firmeza' },
  { value: 'apelacion', label: 'Apelación' },
  { value: 'fallo', label: 'Fallo (2.ª inst.)' },
];

const RUTA_POR_TIPO: Partial<Record<ItemCola['tipo'], (id: string) => string>> = {
  querella: (id) => `/panel/querellas/${id}`,
  queja: (id) => `/panel/quejas/${id}`,
  acta_firmeza: () => '/panel/actas-firmeza',
};

export function ColaPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useCola();
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const items = data ?? [];

  const estadosPresentes = useMemo(
    () => Array.from(new Set(items.map((i) => i.estado))).sort(),
    [items],
  );

  const itemsFiltrados = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        search === '' ||
        item.radicado.toLowerCase().includes(search.toLowerCase()) ||
        item.titulo.toLowerCase().includes(search.toLowerCase());
      const matchTipo = filtroTipo === 'todos' || item.tipo === filtroTipo;
      const matchEstado = filtroEstado === 'todos' || item.estado === filtroEstado;
      return matchSearch && matchTipo && matchEstado;
    });
  }, [items, search, filtroTipo, filtroEstado]);

  const columns = [
    {
      title: 'Radicado',
      dataIndex: 'radicado',
      key: 'radicado',
      width: 180,
      render: (radicado: string) => (
        <span className="font-display" style={{ fontSize: 14.5, fontWeight: 600 }}>
          {radicado}
        </span>
      ),
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      width: 150,
      render: (tipo: ItemCola['tipo']) => {
        const iconos: Record<ItemCola['tipo'], React.ReactNode> = {
          querella: <FileTextOutlined style={{ fontSize: 12, marginRight: 4 }} />,
          queja: <MessageOutlined style={{ fontSize: 12, marginRight: 4 }} />,
          acta_firmeza: <SafetyCertificateOutlined style={{ fontSize: 12, marginRight: 4 }} />,
          apelacion: <FileOutlined style={{ fontSize: 12, marginRight: 4 }} />,
          fallo: <CheckCircleOutlined style={{ fontSize: 12, marginRight: 4 }} />,
        };
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            {iconos[tipo]}
            {TIPOS_COLA_LABEL[tipo] ?? tipo}
          </span>
        );
      },
    },
    {
      title: 'Título / Asunto',
      dataIndex: 'titulo',
      key: 'titulo',
      render: (titulo: string) => <div style={{ fontWeight: 500 }}>{titulo}</div>,
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 180,
      render: (estado: string) => (
        <Tag color={ESTADO_GENERAL_COLOR[estado] ?? 'default'}>
          {ESTADO_GENERAL_LABEL[estado] ?? estado}
        </Tag>
      ),
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      width: 120,
      sorter: (a: ItemCola, b: ItemCola) => a.fecha.localeCompare(b.fecha),
    },
    {
      title: '',
      key: 'acciones',
      width: 90,
      fixed: 'right' as const,
      render: (_: unknown, record: ItemCola) => {
        const ruta = RUTA_POR_TIPO[record.tipo]?.(record.id);
        return (
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            disabled={!ruta}
            onClick={() => ruta && navigate(ruta)}
          >
            Ver
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <Typography.Title level={2} style={{ marginBottom: 4 }}>
        Cola de trabajo
      </Typography.Title>
      <Text type="secondary" style={{ marginBottom: 22, display: 'block' }}>
        Todos los expedientes del despacho — querellas, quejas, actas de firmeza y apelaciones — en un solo lugar.
      </Text>

      {isError && (
        <Alert type="error" showIcon message="No se pudo cargar la cola de trabajo" style={{ marginBottom: 16 }} />
      )}

      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 18,
          padding: '14px 16px',
          background: PALETA.superficie,
          borderRadius: 16,
          boxShadow: ELEVACION.base,
        }}
      >
        <Input.Search
          placeholder="Buscar radicado o asunto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 320 }}
          enterButton
          prefix={<SearchOutlined />}
          allowClear
        />
        <Select
          value={filtroTipo}
          onChange={setFiltroTipo}
          style={{ width: 180 }}
          placeholder="Filtrar por tipo"
          allowClear
          options={FILTRO_TIPO_OPCIONES}
        />
        <Select
          value={filtroEstado}
          onChange={setFiltroEstado}
          style={{ width: 200 }}
          placeholder="Filtrar por estado"
          allowClear
          options={[
            { value: 'todos', label: 'Todos los estados' },
            ...estadosPresentes.map((e) => ({ value: e, label: ESTADO_GENERAL_LABEL[e] ?? e })),
          ]}
        />
      </div>

      <div style={{ background: PALETA.superficie, borderRadius: 16, boxShadow: ELEVACION.base, overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={itemsFiltrados}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 15, showSizeChanger: true }}
          size="middle"
          locale={{ emptyText: 'No hay expedientes con los filtros actuales.' }}
        />
      </div>
    </div>
  );
}
