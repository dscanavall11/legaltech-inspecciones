import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Input,
  Modal,
  Space,
  Table,
  Typography,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import { DownloadOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getNormasNacionales, getNormaPorId } from './api';
import type { LegalBasis } from './types';

const { Title, Paragraph, Text } = Typography;

/**
 * Consulta paginada de normas nacionales (microservicio legalbases).
 * Migrado del componente national-norms del frontend Angular.
 */
export function NormasPage() {
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(0);
  const [orden, setOrden] = useState<'asc' | 'desc'>('asc');
  const [detalleId, setDetalleId] = useState<string | number | null>(null);

  const normas = useQuery({
    queryKey: ['national-norms', busqueda, pagina, orden],
    queryFn: () =>
      getNormasNacionales({ search: busqueda, page: pagina, size: 10, sortBy: 'publishedAt', sortDir: orden }),
  });

  const detalle = useQuery({
    queryKey: ['national-norm', detalleId],
    queryFn: () => getNormaPorId(detalleId!),
    enabled: detalleId != null,
  });

  const columnas: ColumnsType<LegalBasis> = [
    { title: 'Título', dataIndex: 'title', ellipsis: true },
    {
      title: 'Tipo',
      dataIndex: 'type',
      width: 140,
      render: (v: string) => <Text type="secondary">{v?.toUpperCase()}</Text>,
    },
    {
      title: 'Publicado',
      dataIndex: 'publishedAt',
      width: 130,
      align: 'right',
      sorter: true,
      sortOrder: orden === 'asc' ? 'ascend' : 'descend',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
    },
    {
      title: 'Descarga',
      key: 'descarga',
      width: 120,
      align: 'center',
      render: (_, r) => (
        <Button
          size="small"
          icon={<DownloadOutlined />}
          href={r.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Descargar
        </Button>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 120,
      align: 'center',
      render: (_, r) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => setDetalleId(r.id)}>
          Detalle
        </Button>
      ),
    },
  ];

  const onChangeTabla = (
    paginacion: TablePaginationConfig,
    _filtros: unknown,
    sorter: SorterResult<LegalBasis> | SorterResult<LegalBasis>[],
  ) => {
    setPagina((paginacion.current ?? 1) - 1);
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    if (s?.order) setOrden(s.order === 'ascend' ? 'asc' : 'desc');
  };

  const d = detalle.data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <Title level={2} style={{ marginBottom: 4 }}>
          Normas nacionales
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Consulta la normativa nacional publicada, con enlace de descarga del documento fuente.
        </Paragraph>
      </div>

      {normas.isError && (
        <Alert
          type="error"
          showIcon
          message="No fue posible cargar las normas nacionales."
          action={
            <Button size="small" onClick={() => normas.refetch()}>
              Reintentar
            </Button>
          }
        />
      )}

      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'flex-end' }} wrap>
          <Input.Search
            placeholder="Buscar por título, tipo o id..."
            allowClear
            style={{ width: 280 }}
            onSearch={(v) => {
              setPagina(0);
              setBusqueda(v);
            }}
            onChange={(e) => {
              if (!e.target.value) {
                setPagina(0);
                setBusqueda('');
              }
            }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => normas.refetch()} loading={normas.isFetching} />
        </Space>
        <Table
          rowKey="id"
          columns={columnas}
          dataSource={normas.data?.content ?? []}
          loading={normas.isLoading}
          locale={{ emptyText: 'No se encontraron normas nacionales.' }}
          onChange={onChangeTabla}
          pagination={{
            current: pagina + 1,
            pageSize: normas.data?.size ?? 10,
            total: normas.data?.totalElements ?? 0,
            showSizeChanger: false,
            showTotal: (total) => `${total} resultados`,
          }}
        />
      </Card>

      <Modal
        open={detalleId != null}
        title={d?.title ?? 'Cargando norma…'}
        width={760}
        onCancel={() => setDetalleId(null)}
        footer={<Button onClick={() => setDetalleId(null)}>Cerrar detalle</Button>}
      >
        {detalle.isLoading && <Paragraph>Consultando la norma…</Paragraph>}
        {detalle.isError && (
          <Alert type="error" showIcon message="No fue posible cargar el detalle de la norma." />
        )}
        {d && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '55vh', overflow: 'auto' }}>
            <Text type="secondary">
              {d.type?.toUpperCase()} • {dayjs(d.publishedAt).format('DD [de] MMMM [de] YYYY')}
            </Text>
            <Button
              icon={<DownloadOutlined />}
              href={d.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ alignSelf: 'flex-start' }}
            >
              Descargar documento completo
            </Button>
            <Paragraph style={{ whiteSpace: 'pre-line', marginBottom: 0 }}>{d.description}</Paragraph>
          </div>
        )}
      </Modal>
    </div>
  );
}
