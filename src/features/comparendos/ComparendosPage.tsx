import { useMemo, useState } from 'react';
import { Alert, Card, Input, Space, Table, Tag, Tooltip, Typography } from 'antd';
import { RightOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useComparendos } from './api';
import { ESTADO_COMPARENDO_COLOR, ESTADO_COMPARENDO_LABEL, type Comparendo } from './types';
import {
  ETAPAS_COMPARENDO,
  ETAPA_COMPARENDO_ACTIVA,
} from '@/derecho';
import { ELEVACION, PALETA } from '@/theme/theme';

const { Title } = Typography;

/** Riel compacto de etapa para la fila del listado — versión en miniatura de EtapaProcesal. */
function EtapaMini({ activa }: { activa: number }) {
  return (
    <Tooltip title={`Etapa: ${ETAPAS_COMPARENDO[activa]}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {ETAPAS_COMPARENDO.map((etapa, i) => (
          <span
            key={etapa}
            style={{
              width: i === activa ? 8 : 6,
              height: i === activa ? 8 : 6,
              borderRadius: '50%',
              background: i <= activa ? PALETA.azul : '#d6d9de',
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    </Tooltip>
  );
}


export function ComparendosPage() {
  const { data, isLoading, isError } = useComparendos();
  const [busqueda, setBusqueda] = useState('');
  const navigate = useNavigate();

  const filtrados = useMemo(() => {
    if (!data) return [];
    const q = busqueda.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (item) =>
        item.radicado.toLowerCase().includes(q) ||
        item.numeroComparendo.toLowerCase().includes(q) ||
        item.infractor.toLowerCase().includes(q) ||
        item.articuloNumeral.toLowerCase().includes(q),
    );
  }, [data, busqueda]);

  const columns: ColumnsType<Comparendo> = [
    {
      title: 'Radicado',
      dataIndex: 'radicado',
      key: 'radicado',
      render: (v: string) => (
        <span className="font-display" style={{ fontSize: 15 }}>
          {v}
        </span>
      ),
    },
    { title: 'No. comparendo', dataIndex: 'numeroComparendo', key: 'numeroComparendo' },
    { title: 'Infractor', dataIndex: 'infractor', key: 'infractor' },
    {
      title: 'Artículo',
      dataIndex: 'articuloNumeral',
      key: 'articuloNumeral',
      ellipsis: true,
      responsive: ['lg'],
    },
    {
      title: 'Fecha',
      dataIndex: 'fechaComparendo',
      key: 'fechaComparendo',
      render: (v: string) => dayjs(v).format('D MMM YYYY'),
      responsive: ['md'],
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado: Comparendo['estado']) => (
        <Tag color={ESTADO_COMPARENDO_COLOR[estado]}>{ESTADO_COMPARENDO_LABEL[estado]}</Tag>
      ),
      filters: Object.entries(ESTADO_COMPARENDO_LABEL).map(([value, text]) => ({ text, value })),
      onFilter: (value, record) => record.estado === value,
    },
    {
      title: 'Etapa',
      key: 'etapa',
      width: 90,
      render: (_, record) => <EtapaMini activa={ETAPA_COMPARENDO_ACTIVA[record.estado]} />,
    },
    {
      title: '',
      key: 'accion',
      width: 48,
      render: () => <RightOutlined style={{ color: '#9aa0a6' }} />,
    },
  ];

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
        <Title level={2} style={{ margin: 0 }}>
          Comparendos
        </Title>
      </div>

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="No se pudieron cargar los comparendos"
          description="Verifica tu conexión o intenta de nuevo en unos minutos."
        />
      ) : (
        <Card variant="borderless" style={{ boxShadow: ELEVACION.base }} styles={{ body: { padding: 8 } }}>
          <div style={{ padding: '6px 6px 10px' }}>
            <Input
              allowClear
              placeholder="Buscar por radicado, comparendo, infractor o artículo"
              prefix={<SearchOutlined />}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ maxWidth: 480 }}
            />
          </div>
          <Table<Comparendo>
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={filtrados}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 'max-content' }}
            onRow={(record) => ({
              onClick: () => navigate(`/panel/comparendos/${record.id}`),
              style: { cursor: 'pointer' },
            })}
          />
        </Card>
      )}

    </Space>
  );
}
