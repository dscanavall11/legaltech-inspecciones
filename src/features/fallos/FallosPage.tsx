import { useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Descriptions,
  Input,
  Modal,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  AuditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { ELEVACION } from '@/theme/theme';
import { DESPACHO } from '@/derecho';
import { useOverlayStore } from '@/store/overlayStore';
import { useFallos } from './api';
import {
  DECISION_COLOR,
  DECISION_LABEL,
  ESTADO_FALLO_COLOR,
  ESTADO_FALLO_LABEL,
  type DecisionFallo,
  type EstadoFallo,
  type Fallo,
  type MedidaCorrectiva,
} from './types';

const { Title, Paragraph, Text } = Typography;

const TIPO_MEDIDA_LABEL: Record<MedidaCorrectiva['tipo'], string> = {
  multa: 'Multa',
  decomiso_temporal: 'Decomiso temporal',
  suspension: 'Suspensión',
  restauracion: 'Restauración',
  trabajo_comunitario: 'Trabajo comunitario',
  participacion_programa: 'Participación en programa',
};

function ResumenFallo({ fallo, onClose }: { fallo: Fallo; onClose: () => void }) {
  const abrirAiAssistant = useOverlayStore((s) => s.abrirAiAssistant);
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
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <Button
            type="primary"
            icon={<RobotOutlined />}
            onClick={abrirAiAssistant}
          >
            Asistente IA del caso
          </Button>
          <Button onClick={onClose}>Cerrar</Button>
        </div>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space wrap>
          <Tag color={DECISION_COLOR[fallo.decision]} style={{ fontSize: 13, padding: '2px 10px' }}>
            {DECISION_LABEL[fallo.decision]}
          </Tag>
          <Tag color={ESTADO_FALLO_COLOR[fallo.estado]}>{ESTADO_FALLO_LABEL[fallo.estado]}</Tag>
          <Text type="secondary">{fallo.articuloInfringido}</Text>
        </Space>

        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="Inspector" span={2}>{fallo.inspector}</Descriptions.Item>
          <Descriptions.Item label="Querellante">{fallo.querellante}</Descriptions.Item>
          <Descriptions.Item label="Querellado">{fallo.querellado}</Descriptions.Item>
          <Descriptions.Item label="Fecha del fallo">
            {dayjs(fallo.fechaFallo).format('DD/MM/YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Tipo">
            {fallo.tipo === 'querella' ? 'Querella' : 'Proceso verbal abreviado'}
          </Descriptions.Item>
          {fallo.fechaFirmeza && (
            <Descriptions.Item label="Fecha de firmeza" span={2}>
              {dayjs(fallo.fechaFirmeza).format('DD/MM/YYYY')}
            </Descriptions.Item>
          )}
        </Descriptions>

        <div>
          <Text strong>Comportamiento:</Text>
          <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>{fallo.comportamiento}</Paragraph>
        </div>

        <div>
          <Text strong>Fundamentación:</Text>
          <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>{fallo.fundamentacion}</Paragraph>
        </div>

        {fallo.medidasCorrectivas.length > 0 && (
          <div>
            <Text strong>Medidas correctivas:</Text>
            <ul style={{ marginTop: 6, paddingLeft: 20 }}>
              {fallo.medidasCorrectivas.map((m, i) => (
                <li key={i}>
                  <Text>{TIPO_MEDIDA_LABEL[m.tipo]}</Text>
                  {m.valorUPM !== undefined && (
                    <Tag color="orange" style={{ marginLeft: 8 }}>{m.valorUPM} UPM</Tag>
                  )}
                  <Text type="secondary">: {m.descripcion}</Text>
                </li>
              ))}
            </ul>
          </div>
        )}

        {fallo.apelacion && (
          <Card size="small" title="Apelación" style={{ background: '#eef4fa' }}>
            <Descriptions size="small" column={2}>
              <Descriptions.Item label="Fecha de apelación">
                {dayjs(fallo.apelacion.fechaApelacion).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Resultado">
                {fallo.apelacion.resultado === 'pendiente' ? (
                  <Tag color="purple">En segunda instancia</Tag>
                ) : fallo.apelacion.resultado === 'confirmado' ? (
                  <Tag color="cyan">Confirmado</Tag>
                ) : (
                  <Tag color="volcano">Revocado</Tag>
                )}
              </Descriptions.Item>
              {fallo.apelacion.fechaResolucion && (
                <Descriptions.Item label="Fecha resolución">
                  {dayjs(fallo.apelacion.fechaResolucion).format('DD/MM/YYYY')}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        )}
      </Space>
    </Modal>
  );
}

export function FallosPage() {
  const [busqueda, setBusqueda] = useState('');
  const [filtroDecision, setFiltroDecision] = useState<string | undefined>();
  const [falloSeleccionado, setFalloSeleccionado] = useState<Fallo | null>(null);

  const { data, isLoading, isError } = useFallos({ decision: filtroDecision });

  const filtrados = useMemo(() => {
    if (!data?.content) return [];
    const q = busqueda.trim().toLowerCase();
    if (!q) return data.content;
    return data.content.filter(
      (f) =>
        f.radicado.toLowerCase().includes(q) ||
        f.querellante.toLowerCase().includes(q) ||
        f.querellado.toLowerCase().includes(q) ||
        f.comportamiento.toLowerCase().includes(q),
    );
  }, [data, busqueda]);

  // Estadísticas rápidas
  const stats = useMemo(() => {
    const todos = data?.content ?? [];
    return {
      total: todos.length,
      enFirmeza: todos.filter((f) => f.estado === 'en_firmeza' || f.estado === 'confirmado').length,
      apelados: todos.filter((f) => f.estado === 'apelado').length,
      favorables: todos.filter((f) => f.decision === 'FAVORABLE').length,
    };
  }, [data]);

  const columns: ColumnsType<Fallo> = [
    {
      title: 'Radicado',
      dataIndex: 'radicado',
      key: 'radicado',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: 'Querellado',
      dataIndex: 'querellado',
      key: 'querellado',
      ellipsis: true,
    },
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
      title: 'Artículo',
      dataIndex: 'articuloInfringido',
      key: 'articuloInfringido',
      render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: 'Decisión',
      dataIndex: 'decision',
      key: 'decision',
      render: (d: DecisionFallo) => (
        <Tag color={DECISION_COLOR[d]}>{DECISION_LABEL[d]}</Tag>
      ),
    },
    {
      title: 'Medidas',
      key: 'medidas',
      render: (_: unknown, r: Fallo) =>
        r.medidasCorrectivas.length === 0 ? (
          <Text type="secondary">-</Text>
        ) : (
          <Space wrap>
            {r.medidasCorrectivas.map((m, i) => (
              <Tag key={i} color={m.tipo === 'multa' ? 'orange' : 'default'} style={{ fontSize: 11 }}>
                {m.tipo === 'multa' && m.valorUPM !== undefined
                  ? `${m.valorUPM} UPM`
                  : TIPO_MEDIDA_LABEL[m.tipo]}
              </Tag>
            ))}
          </Space>
        ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (e: EstadoFallo) => (
        <Badge
          color={ESTADO_FALLO_COLOR[e] === 'default' ? 'gray' : ESTADO_FALLO_COLOR[e]}
          text={ESTADO_FALLO_LABEL[e]}
        />
      ),
    },
    {
      title: 'Fecha',
      dataIndex: 'fechaFallo',
      key: 'fechaFallo',
      render: (v: string) => dayjs(v).format('DD/MM/YY'),
      sorter: (a, b) => dayjs(a.fechaFallo).unix() - dayjs(b.fechaFallo).unix(),
      defaultSortOrder: 'descend',
    },
    {
      title: '',
      key: 'ver',
      width: 48,
      render: (_: unknown, record: Fallo) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            setFalloSeleccionado(record);
          }}
        />
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={2} style={{ marginBottom: 4 }}>Fallos</Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Decisiones proferidas por la {DESPACHO.nombre} en querellas y procesos verbales abreviados
          (Ley 1801 de 2016).
        </Paragraph>
      </div>

      {/* Estadísticas */}
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
          <Statistic
            title="Apelados"
            value={stats.apelados}
            valueStyle={{ color: '#722ed1' }}
            prefix={<CloseCircleOutlined />}
          />
        </Card>
        <Card size="small" style={{ minWidth: 160 }}>
          <Statistic
            title="Favorables"
            value={stats.total ? `${Math.round((stats.favorables / stats.total) * 100)}%` : '-'}
            valueStyle={{ color: '#1677ff' }}
          />
        </Card>
      </div>

      {/* Filtros */}
      <Space wrap>
        <Input
          size="large"
          allowClear
          placeholder="Buscar por radicado, querellado o comportamiento"
          prefix={<SearchOutlined />}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ width: 380 }}
        />
        <Select
          size="large"
          allowClear
          placeholder="Filtrar por decisión"
          style={{ width: 200 }}
          value={filtroDecision}
          onChange={setFiltroDecision}
          options={Object.entries(DECISION_LABEL).map(([value, label]) => ({ value, label }))}
        />
      </Space>

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="No se pudieron cargar los fallos"
          description="Verifica tu conexión o intenta de nuevo."
        />
      ) : (
        <Card
          variant="borderless"
          style={{ boxShadow: ELEVACION.base }}
          styles={{ body: { padding: 8 } }}
        >
          <Table<Fallo>
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={filtrados}
            pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (t) => `${t} fallos` }}
            scroll={{ x: 'max-content' }}
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
