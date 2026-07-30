import { useMemo, useState } from 'react';
import {
  Table,
  Tag,
  Input,
  Typography,
  Space,
  Button,
  Tooltip,
  Alert,
  Card,
} from 'antd';
import { ELEVACION } from '@/theme/theme';
import { PlusOutlined, SearchOutlined, RightOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useQuejas } from './api';
import {
  ESTADO_QUEJA_COLOR,
  ESTADO_QUEJA_LABEL,
  CATEGORIA_QUEJA_LABEL,
  type EstadoQueja,
  type Queja,
} from './types';
import { calcularTermino } from '@/shared/terminos/diasHabiles';

const { Title, Text } = Typography;

export function QuejasListPage() {
  const { data, isLoading, isError } = useQuejas();
  const [busqueda, setBusqueda] = useState('');
  const navigate = useNavigate();

  const filtradas = useMemo(() => {
    if (!data) return [];
    const q = busqueda.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (item) =>
        item.radicado.toLowerCase().includes(q) ||
        item.quejoso.toLowerCase().includes(q) ||
        item.acusado.toLowerCase().includes(q) ||
        item.asunto.toLowerCase().includes(q),
    );
  }, [data, busqueda]);

  const columns: ColumnsType<Queja> = [
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
    { title: 'Quejoso', dataIndex: 'quejoso', key: 'quejoso' },
    { title: 'Acusado', dataIndex: 'acusado', key: 'acusado' },
    {
      title: 'Asunto',
      dataIndex: 'asunto',
      key: 'asunto',
      ellipsis: true,
    },
    {
      title: 'Categoría',
      dataIndex: 'categoria',
      key: 'categoria',
      render: (c: Queja['categoria']) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {CATEGORIA_QUEJA_LABEL[c]}
        </Text>
      ),
      responsive: ['lg'],
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado: EstadoQueja) => (
        <Tag color={ESTADO_QUEJA_COLOR[estado]}>{ESTADO_QUEJA_LABEL[estado]}</Tag>
      ),
      filters: Object.entries(ESTADO_QUEJA_LABEL).map(([value, text]) => ({
        text,
        value,
      })),
      onFilter: (value, record) => record.estado === value,
    },
    {
      title: 'Término',
      key: 'termino',
      render: (_, record) => {
        if (record.estado === 'archivada') {
          return <Tag color="default">Cerrado</Tag>;
        }
        const { diasRestantes, vencido } = calcularTermino(
          dayjs(record.fechaRadicacion),
          record.diasTermino,
        );
        if (vencido) return <Tag color="error">Vencido</Tag>;
        const color = diasRestantes <= 2 ? 'warning' : 'success';
        return (
          <Tooltip title="Días hábiles restantes del término">
            <Tag color={color}>{diasRestantes} días háb.</Tag>
          </Tooltip>
        );
      },
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
          Quejas
        </Title>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => navigate('/panel/nuevo-caso')}
        >
          Radicar queja
        </Button>
      </div>

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="No se pudieron cargar las quejas"
          description="Verifica tu conexión o intenta de nuevo en unos minutos."
        />
      ) : (
        <Card
          variant="borderless"
          style={{ boxShadow: ELEVACION.base }}
          styles={{ body: { padding: 8 } }}
        >
          <div style={{ padding: '6px 6px 10px' }}>
            <Input
              allowClear
              placeholder="Buscar por radicado, quejoso, acusado o asunto"
              prefix={<SearchOutlined />}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ maxWidth: 480 }}
            />
          </div>
          <Table<Queja>
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={filtradas}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 'max-content' }}
            onRow={(record) => ({
              onClick: () => navigate(`/panel/quejas/${record.id}`),
              style: { cursor: 'pointer' },
            })}
          />
        </Card>
      )}
    </Space>
  );
}
