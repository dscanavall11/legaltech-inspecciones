import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Result, Skeleton, Space, Tabs, Tag, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { NormaMark } from '@/shared/ai/NormaMark';
import { NORMA } from '@/shared/ai/identity';
import { useLegalCase } from '@/shared/legalCases/api';
import { parseCaseMetadata } from '@/shared/legalCases/types';
import { DocumentosExpediente } from '@/shared/documentos/DocumentosExpediente';
import { PruebasExpediente } from '@/shared/pruebas/PruebasExpediente';
import { OrientacionesInspector } from '@/shared/orientaciones/OrientacionesInspector';
import { ELEVACION } from '@/theme/theme';
import { AreaTrabajoApelacion } from './AreaTrabajoApelacion';
import { TEXTO } from '@/theme/escala';

const { Title, Text } = Typography;

interface MetadataApelacion {
  asunto?: string;
}

export function ApelacionDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useLegalCase(id);

  if (isLoading) {
    return (
      <Card variant="borderless" style={{ boxShadow: ELEVACION.base }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Result
        status="404"
        title="Apelación no encontrada"
        subTitle="El expediente que buscas no existe o fue archivado."
        extra={
          <Button type="primary" onClick={() => navigate('/panel/apelaciones')}>
            Volver a apelaciones
          </Button>
        }
      />
    );
  }

  const comportamiento =
    parseCaseMetadata<MetadataApelacion>(data.caseMetadata).asunto ??
    data.background?.allegedFacts ??
    'Sin comportamiento registrado';

  const tabs = [
    {
      key: 'recurso',
      label: 'Recurso',
      children: (
        <AreaTrabajoApelacion
          caseId={data.id}
          radicado={data.filingNumber}
          comportamiento={comportamiento}
          caseMetadataRaw={data.caseMetadata}
        />
      ),
    },
    {
      key: 'documentos',
      label: 'Documentos',
      children: <DocumentosExpediente caseId={data.id} />,
    },
    {
      key: 'pruebas',
      label: 'Pruebas',
      children: <PruebasExpediente caseId={data.id} />,
    },
    {
      key: 'orientaciones',
      label: 'Orientaciones',
      children: (
        <OrientacionesInspector caseId={data.id} caseMetadataRaw={data.caseMetadata} />
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/panel/apelaciones')}
          style={{ marginBottom: 10, paddingLeft: 0 }}
        >
          Volver a apelaciones
        </Button>
        <Button
          icon={<NormaMark size={17} />}
          onClick={() => navigate('/panel/chat', { state: { radicado: data.filingNumber } })}
        >
          Preguntarle a {NORMA.nombre}
        </Button>
      </div>

      <Space align="center" size={10} wrap style={{ marginBottom: 2 }}>
        <Title level={2} style={{ margin: 0 }}>
          Radicado {data.filingNumber}
        </Title>
        <Tag color="gold">Apelación</Tag>
      </Space>
      <div style={{ marginBottom: 22 }}>
        <Text type="secondary" style={{ fontSize: TEXTO.titulo }}>
          {comportamiento}
        </Text>
      </div>

      <Card variant="borderless" style={{ boxShadow: ELEVACION.base }}>
        <Tabs items={tabs} />
      </Card>
    </div>
  );
}
