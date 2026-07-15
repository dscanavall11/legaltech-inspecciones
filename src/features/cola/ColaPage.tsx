import { useState, useMemo } from 'react';
import { Table, Tag, Button, Input, Select, Space, Typography, Badge, Dropdown } from 'antd';
import {
  SearchOutlined,
  FileTextOutlined,
  MessageOutlined,
  SafetyCertificateOutlined,
  FileOutlined,
  CheckCircleOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import { ItemCola, TIPOS_COLA_LABEL, ESTADO_GENERAL_LABEL, ESTADO_GENERAL_COLOR, EstadoActa } from './types';
import { ELEVACION, PALETA } from '@/theme/theme';

const { Text } = Typography;

const ESTADO_ACTA_LABEL: Record<EstadoActa, string> = {
  pendiente: 'Pendiente',
  generada: 'Generada',
  revisada: 'Revisada',
  expedida: 'Expedida',
};

const ESTADO_ACTA_COLOR: Record<EstadoActa, 'blue' | 'green' | 'orange' | 'purple'> = {
  pendiente: 'blue',
  generada: 'green',
  revisada: 'orange',
  expedida: 'purple',
};

const FILTRO_TIPO_OPCIONES = [
  { value: 'todos', label: 'Todos los tipos' },
  { value: 'querella', label: 'Querella' },
  { value: 'queja', label: 'Queja' },
  { value: 'acta_firmeza', label: 'Acta de firmeza' },
  { value: 'apelacion', label: 'Apelación' },
  { value: 'fallo', label: 'Fallo (2.ª inst.)' },
];

const FILTRO_ESTADO_OPCIONES = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'radicada', label: 'Radicada' },
  { value: 'en_tramite', label: 'En trámite' },
  { value: 'audiencia_programada', label: 'Audiencia programada' },
  { value: 'en_firmeza', label: 'En firmeza' },
  { value: 'fallada', label: 'Fallada' },
  { value: 'apelada', label: 'Apelada' },
  { value: 'pendiente', label: 'Acta: Pendiente' },
  { value: 'generada', label: 'Acta: Generada' },
  { value: 'revisada', label: 'Acta: Revisada' },
  { value: 'expedida', label: 'Acta: Expedida' },
];

// Mock data inicial para la cola (se mantiene en memoria via MSW)
const COLA_MOCK_INICIAL: ItemCola[] = [
  {
    id: 'c-1',
    tipo: 'querella',
    radicado: '2026-00123',
    titulo: 'Perturbación a la posesión - acceso a inmueble',
    estado: 'en_tramite',
    fecha: '2026-01-15',
    responsable: 'Inspector 1',
  },
  {
    id: 'c-2',
    tipo: 'acta_firmeza',
    radicado: '2026-AF-0001',
    titulo: 'Acta de firmeza comparendo 17-001-2026',
    estado: 'pendiente',
    estadoActa: 'pendiente',
    fecha: '2026-01-16',
    responsable: 'Inspector 2',
    datosActa: {
      comparendo: '17-001-2026',
      solicitado: 'Juan Pérez',
      cedula: '1020304050',
      liquidacion: { valorTotal: 450000, smdlvLetras: '4', tipo: 2, porcentajeIncremento: 0 },
      causal: 'ninguna',
    },
  },
  {
    id: 'c-3',
    tipo: 'queja',
    radicado: '2026-QJ-001',
    titulo: 'Ruido excesivo en horario de descanso',
    estado: 'radicada',
    fecha: '2026-01-17',
    responsable: 'Inspector 1',
  },
];

export function ColaPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<ItemCola[]>(COLA_MOCK_INICIAL);
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  // Mutación optimista para cambiar estado de acta
  const mutarEstadoActa = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: EstadoActa }) => {
      await apiFetch(`/actas/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
      });
      return { id, estado };
    },
    onMutate: async ({ id, estado }) => {
      await queryClient.cancelQueries({ queryKey: ['cola'] });
      const previous = items;
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, estadoActa: estado, estado: estado } : item,
        ),
      );
      setLoadingIds((prev) => new Set(prev).add(id));
      return { previous };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previous) setItems(context.previous);
    },
    onSettled: (_data, _err, vars) => {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(vars.id);
        return next;
      });
    },
  });

  const itemsFiltrados = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        search === '' ||
        item.radicado.toLowerCase().includes(search.toLowerCase()) ||
        item.titulo.toLowerCase().includes(search.toLowerCase()) ||
        (item.datosActa?.solicitado ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (item.datosActa?.comparendo ?? '').toLowerCase().includes(search.toLowerCase());

      const matchTipo = filtroTipo === 'todos' || item.tipo === filtroTipo;
      const matchEstado =
        filtroEstado === 'todos' ||
        (item.estadoActa ? item.estadoActa === filtroEstado : item.estado === filtroEstado);

      return matchSearch && matchTipo && matchEstado;
    });
  }, [items, search, filtroTipo, filtroEstado]);

  function handleCambiarEstadoActa(item: ItemCola, nuevoEstado: EstadoActa) {
    if (!item.estadoActa) return;
    mutarEstadoActa.mutate({ id: item.id, estado: nuevoEstado });
  }

  function getProximosEstados(estadoActual?: EstadoActa): EstadoActa[] {
    if (!estadoActual) return [];
    const orden: EstadoActa[] = ['pendiente', 'generada', 'revisada', 'expedida'];
    const idx = orden.indexOf(estadoActual);
    return orden.slice(idx + 1);
  }

  function renderEstadoActa(item: ItemCola) {
    if (!item.estadoActa) return null;
    const cargando = loadingIds.has(item.id);
    const proximos = getProximosEstados(item.estadoActa);

    if (proximos.length === 0) {
      return (
        <Tag color={ESTADO_ACTA_COLOR[item.estadoActa]} style={{ fontWeight: 600, transition: 'background-color 0.2s ease, color 0.2s ease' }}>
          {ESTADO_ACTA_LABEL[item.estadoActa]}
        </Tag>
      );
    }

    const menuItems = proximos.map((est) => ({
      label: `Marcar ${ESTADO_ACTA_LABEL[est]}`,
      key: est,
      icon: est === 'revisada' ? <CheckCircleOutlined /> : <EditOutlined />,
      onClick: () => handleCambiarEstadoActa(item, est),
    }));

    return (
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement="bottomRight"
      >
        <Tag color={ESTADO_ACTA_COLOR[item.estadoActa]} style={{ fontWeight: 600, cursor: 'pointer' }}>
          {ESTADO_ACTA_LABEL[item.estadoActa]}
          {cargando && <span style={{ marginLeft: 6 }}>…</span>}
        </Tag>
      </Dropdown>
    );
  }

  const columns = [
    {
      title: 'Radicado',
      dataIndex: 'radicado',
      key: 'radicado',
      width: 160,
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
      width: 140,
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
            {TIPOS_COLA_LABEL[tipo]}
          </span>
        );
      },
    },
    {
      title: 'Título / Asunto',
      dataIndex: 'titulo',
      key: 'titulo',
      render: (titulo: string, record: ItemCola) => (
        <div>
          <div style={{ fontWeight: 500 }}>{titulo}</div>
          {record.datosActa && (
            <Text type="secondary" style={{ fontSize: 12.5 }}>
              Comparendo: {record.datosActa.comparendo} · {record.datosActa.solicitado}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 160,
      render: (_estado: string, record: ItemCola) => {
        if (record.estadoActa) return renderEstadoActa(record);
        const color = ESTADO_GENERAL_COLOR[record.estado] ?? 'default';
        return (
          <Tag color={color}>
            {ESTADO_GENERAL_LABEL[record.estado] ?? record.estado}
          </Tag>
        );
      },
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      width: 120,
      sorter: (a: ItemCola, b: ItemCola) => a.fecha.localeCompare(b.fecha),
    },
    {
      title: 'Responsable',
      dataIndex: 'responsable',
      key: 'responsable',
      width: 120,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 140,
      fixed: 'right' as const,
      render: (_: any, record: ItemCola) => (
        <Space size={8}>
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              if (record.tipo === 'acta_firmeza') navigate('/panel/actas-firmeza');
              else if (record.tipo === 'querella') navigate(`/panel/querellas/${record.id}`);
              else if (record.tipo === 'queja') navigate(`/panel/quejas/${record.id}`);
            }}
          >
            Ver
          </Button>
          {record.tipo === 'acta_firmeza' && record.estadoActa && (
            <Dropdown
              menu={{
                items: getProximosEstados(record.estadoActa).map((est) => ({
                  label: `Marcar ${ESTADO_ACTA_LABEL[est]}`,
                  key: est,
                  icon: est === 'revisada' ? <CheckCircleOutlined /> : <EditOutlined />,
                  onClick: () => handleCambiarEstadoActa(record, est),
                })),
              }}
              trigger={['click']}
            >
              <Button type="text" icon={<MoreOutlined />} size="small" />
            </Dropdown>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={2} style={{ marginBottom: 4 }}>
        Cola de actas de firmeza
      </Typography.Title>
      <Text type="secondary" style={{ marginBottom: 22, display: 'block' }}>
        Actas de firmeza generadas por importación masiva. Ciclo: pendiente → generada → revisada → expedida.
      </Text>

      {/* Filtros y búsqueda */}
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
          placeholder="Buscar radicado, asunto, partes, comparendo…"
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
          style={{ width: 180 }}
          placeholder="Filtrar por estado"
          allowClear
          options={FILTRO_ESTADO_OPCIONES}
        />
      </div>

      {/* Tabla */}
      <div style={{ background: PALETA.superficie, borderRadius: 16, boxShadow: ELEVACION.base, overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={itemsFiltrados}
          rowKey="id"
          pagination={{ pageSize: 15, showSizeChanger: true }}
          size="middle"
          locale={{ emptyText: 'No hay elementos en la cola con los filtros actuales.' }}
        />
      </div>

      {/* Badge contador en el menú - se actualiza via AppLayout si se usa contexto compartido */}
      <Text style={{ display: 'none' }}>
        <Badge count={items.filter((i) => i.estadoActa === 'pendiente').length} />
      </Text>
    </div>
  );
}