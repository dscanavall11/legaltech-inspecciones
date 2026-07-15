import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  Alert,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getCasosRecientes, getCasoPorRadicado } from './api';
import type { LegalCase } from './types';

const { Title, Paragraph, Text } = Typography;

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

/**
 * Historial de procesos (expedientes) del microservicio legalcase.
 * Migrado del componente recent-cases del frontend Angular.
 */
export function CasosPage() {
  const [busqueda, setBusqueda] = useState('');
  const [radicadoDetalle, setRadicadoDetalle] = useState<string | null>(null);

  const casos = useQuery({
    queryKey: ['legal-cases'],
    queryFn: getCasosRecientes,
  });

  const detalle = useQuery({
    queryKey: ['legal-case', radicadoDetalle],
    queryFn: () => getCasoPorRadicado(radicadoDetalle!),
    enabled: !!radicadoDetalle,
  });

  const filtrados = useMemo(() => {
    const lista = casos.data ?? [];
    const t = busqueda.trim().toLowerCase();
    if (!t) return lista;
    return lista.filter(
      (c) =>
        c.filingNumber.toLowerCase().includes(t) ||
        c.caseType.toLowerCase().includes(t) ||
        c.judicialOfficeId.toLowerCase().includes(t),
    );
  }, [casos.data, busqueda]);

  const columnas: ColumnsType<LegalCase> = [
    {
      title: 'Radicado',
      dataIndex: 'filingNumber',
      render: (v: string) => <Text code>{v}</Text>,
    },
    { title: 'Tipo de caso', dataIndex: 'caseType' },
    {
      title: 'Oficina judicial',
      dataIndex: 'judicialOfficeId',
      ellipsis: true,
    },
    {
      title: 'F. sentencia',
      dataIndex: 'rulingDate',
      align: 'right',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      align: 'center',
      render: (_, record) => (
        <Button
          icon={<EyeOutlined />}
          size="small"
          onClick={() => setRadicadoDetalle(record.filingNumber)}
        >
          Ver detalle
        </Button>
      ),
    },
  ];

  const d = detalle.data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <Title level={2} style={{ marginBottom: 4 }}>
          Historial de procesos
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Expedientes registrados en el sistema, con el detalle completo de cada sentencia.
        </Paragraph>
      </div>

      {casos.isError && (
        <Alert
          type="error"
          showIcon
          message="No fue posible cargar los expedientes."
          action={
            <Button size="small" onClick={() => casos.refetch()}>
              Reintentar
            </Button>
          }
        />
      )}

      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'flex-end' }} wrap>
          <Input.Search
            placeholder="Buscar por radicado o tipo..."
            allowClear
            style={{ width: 280 }}
            onSearch={setBusqueda}
            onChange={(e) => !e.target.value && setBusqueda('')}
          />
          <Button icon={<ReloadOutlined />} onClick={() => casos.refetch()} loading={casos.isFetching} />
        </Space>
        <Table
          rowKey="id"
          columns={columnas}
          dataSource={filtrados}
          loading={casos.isLoading}
          locale={{ emptyText: 'No se encontraron expedientes recientes.' }}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
        />
      </Card>

      <Modal
        open={!!radicadoDetalle}
        title={d ? `Expediente ${d.filingNumber}` : 'Cargando expediente…'}
        width={900}
        onCancel={() => setRadicadoDetalle(null)}
        footer={
          <Button onClick={() => setRadicadoDetalle(null)}>Cerrar detalle</Button>
        }
      >
        {detalle.isLoading && <Paragraph>Consultando el expediente…</Paragraph>}
        {detalle.isError && (
          <Alert type="error" showIcon message="No fue posible cargar el detalle del expediente." />
        )}
        {d && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '60vh', overflow: 'auto' }}>
            <Descriptions
              size="small"
              column={2}
              items={[
                { key: 'tipo', label: 'Tipo de caso', children: d.caseType },
                { key: 'ciudad', label: 'Ciudad', children: d.venueCity },
                { key: 'despacho', label: 'Despacho judicial', children: d.judicialOfficeId },
                {
                  key: 'fecha',
                  label: 'Fecha de sentencia',
                  children: dayjs(d.rulingDate).format('DD [de] MMMM [de] YYYY'),
                },
              ]}
            />

            <Card size="small" title="Antecedentes del caso">
              <Descriptions
                size="small"
                column={1}
                items={[
                  { key: 'hechos', label: 'Hechos alegados', children: d.background.allegedFacts },
                  { key: 'pretensiones', label: 'Pretensiones', children: d.background.reliefSought },
                  {
                    key: 'excepciones',
                    label: 'Excepciones',
                    children: d.background.defensesAndObjections,
                  },
                ]}
              />
            </Card>

            <Card size="small" title="Consideraciones jurídicas">
              <Descriptions
                size="small"
                column={1}
                items={[
                  {
                    key: 'probatoria',
                    label: 'Valoración probatoria',
                    children: <Text italic>"{d.evidenceAssessment}"</Text>,
                  },
                  { key: 'fundamentos', label: 'Fundamentos de derecho', children: d.legalReasoning },
                ]}
              />
            </Card>

            <Card size="small" title="Resolución (fallo)">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <Tag color="blue">{d.ruling.dispositiveDecision}</Tag>
                  <Text strong>SENTENCIA DE PRIMERA INSTANCIA</Text>
                </Space>
                <Paragraph style={{ marginBottom: 8 }}>{d.ruling.orderedInjunctions}</Paragraph>
                <Descriptions
                  size="small"
                  column={3}
                  items={[
                    {
                      key: 'condenas',
                      label: 'Condenas',
                      children: formatoCOP.format(d.ruling.monetaryAwards),
                    },
                    {
                      key: 'costas',
                      label: 'Costas',
                      children: formatoCOP.format(d.ruling.legalCosts),
                    },
                    {
                      key: 'agencias',
                      label: 'Agencias',
                      children: formatoCOP.format(d.ruling.attorneyFeesAward),
                    },
                  ]}
                />
              </Space>
            </Card>

            <Card size="small" title="Sujetos procesales">
              <Space direction="vertical" style={{ width: '100%' }}>
                {d.parties.map((p) => (
                  <Space key={`${p.identificationNumber}-${p.partyRole}`}>
                    <Tag color={p.partyRole === 'PLAINTIFF' ? 'blue' : 'default'}>
                      {p.partyRole === 'PLAINTIFF' ? 'DTE' : 'DDO'}
                    </Tag>
                    <Text strong>{p.fullName}</Text>
                    <Text type="secondary">
                      {p.identificationType}: {p.identificationNumber}
                    </Text>
                  </Space>
                ))}
              </Space>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}
