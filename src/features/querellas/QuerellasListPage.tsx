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
import { useQuerellas } from './api';
import {
  ESTADO_COLOR,
  ESTADO_LABEL,
  type EstadoQuerella,
  type Querella,
} from './types';
import { calcularTermino } from '@/shared/terminos/diasHabiles';

const { Title, Text } = Typography;

export function QuerellasListPage() {
  const { data, isLoading, isError } = useQuerellas();
  const [busqueda, setBusqueda] = useState('');
  const navigate = useNavigate();

  const filtradas = useMemo(() => {
    if (!data) return [];
    const q = busqueda.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (item) =>
        item.radicado.toLowerCase().includes(q) ||
        item.querellante.toLowerCase().includes(q) ||
        item.querellado.toLowerCase().includes(q) ||
        item.asunto.toLowerCase().includes(q),
    );
  }, [data, busqueda]);

  const columns: ColumnsType<Querella> = [
    {
      title: 'Radicado',
      dataIndex: 'radicado',
      key: 'radicado',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    { title: 'Querellante', dataIndex: 'querellante', key: 'querellante' },
    { title: 'Querellado', dataIndex: 'querellado', key: 'querellado' },
    { title: 'Asunto', dataIndex: 'asunto', key: 'asunto', ellipsis: true },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado: EstadoQuerella) => (
        <Tag color={ESTADO_COLOR[estado]}>{ESTADO_LABEL[estado]}</Tag>
      ),
      filters: Object.entries(ESTADO_LABEL).map(([value, text]) => ({
        text,
        value,
      })),
      onFilter: (value, record) => record.estado === value,
    },
    {
      title: 'Término',
      key: 'termino',
      render: (_, record) => {
        const { diasRestantes, vencido } = calcularTermino(
          dayjs(record.fechaRadicacion),
          record.diasTermino,
        );
        if (vencido) return <Tag color="error">Vencido</Tag>;
        const color = diasRestantes <= 3 ? 'warning' : 'success';
        return (
          <Tooltip title="Días hábiles restantes del término procesal">
            <Tag color={color}>{diasRestantes} días hábiles</Tag>
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
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
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
          Querellas
        </Title>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => navigate('/querellas/nueva')}
        >
          Nueva querella
        </Button>
      </div>

      <Input
        size="large"
        allowClear
        placeholder="Buscar por radicado, querellante, querellado o asunto"
        prefix={<SearchOutlined />}
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{ maxWidth: 520 }}
      />

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="No se pudieron cargar las querellas"
          description="Verifica tu conexión o intenta de nuevo en unos minutos."
        />
      ) : (
        <Card
          variant="borderless"
          style={{ boxShadow: ELEVACION.base }}
          styles={{ body: { padding: 8 } }}
        >
          <Table<Querella>
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={filtradas}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 'max-content' }}
            onRow={(record) => ({
              onClick: () => navigate(`/querellas/${record.id}`),
              style: { cursor: 'pointer' },
            })}
          />
        </Card>
      )}
    </Space>
  );
}
