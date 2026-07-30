import { useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Card,
  Descriptions,
  Input,
  Modal,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { AuditOutlined, CheckCircleOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { ELEVACION } from '@/theme/theme';
import { DESPACHO } from '@/derecho';
import { useFallos } from './api';
import { ESTADO_FALLO_COLOR, ESTADO_FALLO_LABEL, type EstadoFallo, type Fallo } from './types';

const { Title, Paragraph, Text } = Typography;

function ResumenFallo({ fallo, onClose }: { fallo: Fallo; onClose: () => void }) {
  return (
    <Modal
      open
      title={
        <Space>
          <AuditOutlined />
          <span>Fallo · Radicado {fallo.radicado}</span>
        </Space>
      }
      width={720}
      onCancel={onClose}
      footer={null}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space wrap>
          <Tag color={ESTADO_FALLO_COLOR[fallo.estado]}>{ESTADO_FALLO_LABEL[fallo.estado]}</Tag>
          <Tag>{fallo.tipo}</Tag>
        </Space>

        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="Querellante">{fallo.querellante}</Descriptions.Item>
          <Descriptions.Item label="Querellado">{fallo.querellado}</Descriptions.Item>
          <Descriptions.Item label="Fecha del fallo" span={2}>
            {fallo.fechaFallo ? dayjs(fallo.fechaFallo).format('DD/MM/YYYY') : 'Sin registro'}
          </Descriptions.Item>
        </Descriptions>

        <div>
          <Text strong>Comportamiento:</Text>
          <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>{fallo.comportamiento || 'Sin registro'}</Paragraph>
        </div>

        <div>
          <Text strong>Consideraciones y resuelve:</Text>
          <Paragraph style={{ marginTop: 4, marginBottom: 0, whiteSpace: 'pre-wrap' }}>{fallo.fundamentacion}</Paragraph>
        </div>

        {fallo.pruebas && (
          <div>
            <Text strong>Pruebas valoradas:</Text>
            <Paragraph style={{ marginTop: 4, marginBottom: 0, whiteSpace: 'pre-wrap' }}>{fallo.pruebas}</Paragraph>
          </div>
        )}
      </Space>
    </Modal>
  );
}

export function FallosPage() {
  const [busqueda, setBusqueda] = useState('');
  const [falloSeleccionado, setFalloSeleccionado] = useState<Fallo | null>(null);

  const { data, isLoading, isError } = useFallos();

  const filtrados = useMemo(() => {
    const todos = data ?? [];
    const q = busqueda.trim().toLowerCase();
    if (!q) return todos;
    return todos.filter(
      (f) =>
        f.radicado.toLowerCase().includes(q) ||
        f.querellante.toLowerCase().includes(q) ||
        f.querellado.toLowerCase().includes(q) ||
        f.comportamiento.toLowerCase().includes(q),
    );
  }, [data, busqueda]);

  const stats = useMemo(() => {
    const todos = data ?? [];
    return {
      total: todos.length,
      enFirmeza: todos.filter((f: Fallo) => f.estado === 'en_firmeza').length,
      apelados: todos.filter((f: Fallo) => f.estado === 'apelado').length,
    };
  }, [data]);

  const columns: ColumnsType<Fallo> = [
    {
      title: 'Radicado',
      dataIndex: 'radicado',
      key: 'radicado',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Querellado', dataIndex: 'querellado', key: 'querellado', ellipsis: true },
    {
      title: 'Comportamiento',
      dataIndex: 'comportamiento',
      key: 'comportamiento',
      ellipsis: true,
      render: (v: string) => (
        <Tooltip title={v}>
          <Text ellipsis style={{ maxWidth: 260 }}>{v}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (e: EstadoFallo) => <Badge color={ESTADO_FALLO_COLOR[e]} text={ESTADO_FALLO_LABEL[e]} />,
    },
    {
      title: 'Fecha',
      dataIndex: 'fechaFallo',
      key: 'fechaFallo',
      render: (v: string) => (v ? dayjs(v).format('DD/MM/YY') : '—'),
      sorter: (a, b) => (a.fechaFallo || '').localeCompare(b.fechaFallo || ''),
      defaultSortOrder: 'descend',
    },
    {
      title: '',
      key: 'ver',
      width: 48,
      render: (_: unknown, record: Fallo) => (
        <EyeOutlined onClick={(e) => { e.stopPropagation(); setFalloSeleccionado(record); }} />
      ),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div>
        <Title level={2} style={{ marginBottom: 4 }}>Fallos</Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Decisiones proferidas por la {DESPACHO.nombre} en querellas y quejas (Ley 1801 de 2016).
        </Paragraph>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Card size="small" style={{ minWidth: 140 }}>
          <Statistic title="Total fallos" value={stats.total} prefix={<AuditOutlined />} />
        </Card>
        <Card size="small" style={{ minWidth: 140 }}>
          <Statistic
            title="En firmeza"
            value={stats.enFirmeza}
            valueStyle={{ color: '#52c41a' }}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
        <Card size="small" style={{ minWidth: 140 }}>
          <Statistic title="Apelados" value={stats.apelados} valueStyle={{ color: '#722ed1' }} />
        </Card>
      </div>

      <Input
        size="large"
        allowClear
        placeholder="Buscar por radicado, querellado o comportamiento"
        prefix={<SearchOutlined />}
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{ maxWidth: 520 }}
      />

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="No se pudieron cargar los fallos"
          description="Verifica tu conexión o intenta de nuevo."
        />
      ) : (
        <Card variant="borderless" style={{ boxShadow: ELEVACION.base }} styles={{ body: { padding: 8 } }}>
          <Table<Fallo>
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={filtrados}
            pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (t) => `${t} fallos` }}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: 'Ningún fallo redactado y guardado todavía.' }}
            onRow={(record) => ({
              onClick: () => setFalloSeleccionado(record),
              style: { cursor: 'pointer' },
            })}
          />
        </Card>
      )}

      {falloSeleccionado && (
        <ResumenFallo fallo={falloSeleccionado} onClose={() => setFalloSeleccionado(null)} />
      )}
    </Space>
  );
}
