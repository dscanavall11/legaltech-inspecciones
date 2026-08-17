import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Card, Empty, Select, Skeleton, Space, Tag, Typography } from 'antd';
import { useProcesos } from '@/shared/procesos/api';
import { useLegalCase } from '@/shared/legalCases/api';
import { DocumentosExpediente } from '@/shared/documentos/DocumentosExpediente';
import { PruebasExpediente } from '@/shared/pruebas/PruebasExpediente';
import { OrientacionesInspector } from '@/shared/orientaciones/OrientacionesInspector';
import { AnalisisPage } from '@/features/analisis/AnalisisPage';
import { ELEVACION, PALETA } from '@/theme/theme';
import { PartesQuerellaForm } from './PartesQuerellaForm';

const { Title, Text } = Typography;

/**
 * Área de trabajo de la querella: un solo recorrido vertical, en el orden en
 * que el inspector trabaja el proceso — documentos, análisis, pruebas,
 * orientación, fallo.
 *
 * Reemplaza al listado que había aquí. El archivo del despacho vive en Mis
 * procesos, así que esta entrada del riel no repite la bandeja: se dedica a
 * sacar el fallo del expediente que se está trabajando.
 *
 * Cada bloque es el mismo componente que servía la pestaña equivalente del
 * detalle. Lo que cambia es el recorrido, no las piezas: el inspector deja de
 * saltar entre siete pestañas para redactar un documento.
 */

const PASOS = [
  { n: 1, titulo: 'Documentos del expediente', ayuda: 'Lo que hay en el proceso. De aquí sale el análisis.' },
  { n: 2, titulo: 'Datos del proceso', ayuda: 'Partes, calidad en que actúan y objeto. Los exige el fallo (art. 2.2.8.18.7.1).' },
  { n: 3, titulo: 'Pruebas', ayuda: 'Cada pieza con quién la aporta y para qué. Se valoran en el aparte 5.' },
  { n: 4, titulo: 'Orientación del inspector', ayuda: 'Instrucciones y dudas del funcionario. Nunca hechos probados.' },
  { n: 5, titulo: 'Proyecto de fallo', ayuda: 'Generar, revisar, aprobar y descargar en Word.' },
] as const;

function Paso({ paso, children }: { paso: (typeof PASOS)[number]; children: React.ReactNode }) {
  return (
    <Card
      variant="borderless"
      style={{ boxShadow: ELEVACION.base }}
      styles={{ body: { padding: '18px 20px' } }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: 7,
            background: 'var(--accent-light)',
            color: PALETA.azul,
            fontSize: 12,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {paso.n}
        </span>
        <Text strong style={{ fontSize: 15.5 }}>
          {paso.titulo}
        </Text>
      </div>
      <Text type="secondary" style={{ display: 'block', fontSize: 12.5, marginBottom: 14, paddingLeft: 32 }}>
        {paso.ayuda}
      </Text>
      {children}
    </Card>
  );
}

export function AreaTrabajoQuerella() {
  const [searchParams, setSearchParams] = useSearchParams();
  const casoId = searchParams.get('caso') ?? '';

  const { data: querellas, isLoading: cargandoLista } = useProcesos({ caseType: 'querella' });
  const { data: caso, isLoading: cargandoCaso } = useLegalCase(casoId);

  const opciones = useMemo(
    () =>
      (querellas ?? []).map((q) => ({
        value: q.id,
        label: `${q.radicado} — ${q.parteA} c/ ${q.parteB}`,
      })),
    [querellas],
  );

  const elegir = (id: string) => setSearchParams(id ? { caso: id } : {}, { replace: true });

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div>
        <Title level={2} style={{ margin: 0 }}>
          Querellas
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          Área de trabajo del proceso verbal abreviado por querella ciudadana (art. 223, Ley 1801 de
          2016). El listado completo del despacho está en Mis procesos.
        </Text>
      </div>

      <Card variant="borderless" style={{ boxShadow: ELEVACION.base }} styles={{ body: { padding: '16px 20px' } }}>
        <div style={{ fontSize: 12, color: PALETA.textoSuave, marginBottom: 6 }}>
          Expediente sobre el que se trabaja
        </div>
        <Select
          showSearch
          allowClear
          style={{ width: '100%', maxWidth: 620 }}
          size="large"
          loading={cargandoLista}
          value={casoId || undefined}
          onChange={(v) => elegir(v ?? '')}
          options={opciones}
          placeholder="Busque por radicado o por las partes"
          filterOption={(input, option) =>
            String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          notFoundContent={cargandoLista ? <Skeleton active paragraph={false} /> : <Empty description="No hay querellas radicadas" />}
        />
        {caso && (
          <div style={{ marginTop: 10 }}>
            <Tag color="blue">{caso.filingNumber}</Tag>
            <Text type="secondary" style={{ fontSize: 12.5 }}>
              {caso.background?.allegedFacts?.slice(0, 140) ?? 'Sin hechos registrados'}
            </Text>
          </div>
        )}
      </Card>

      {!casoId ? (
        <Alert
          type="info"
          showIcon
          style={{ borderRadius: 14 }}
          message="Elija el expediente para empezar"
          description="El área carga sus documentos, pruebas y orientaciones, y desde aquí se genera y aprueba el fallo. Para radicar una querella nueva use Radicación general, arriba a la derecha."
        />
      ) : cargandoCaso ? (
        <Card variant="borderless" style={{ boxShadow: ELEVACION.base }}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      ) : !caso ? (
        <Alert
          type="error"
          showIcon
          message="No se pudo cargar el expediente"
          description="Verifique la conexión e intente de nuevo."
        />
      ) : (
        <>
          <Paso paso={PASOS[0]}>
            <DocumentosExpediente caseId={caso.id} />
          </Paso>

          <Paso paso={PASOS[1]}>
            <PartesQuerellaForm caseId={caso.id} caseMetadataRaw={caso.caseMetadata} />
          </Paso>

          <Paso paso={PASOS[2]}>
            <PruebasExpediente caseId={caso.id} />
          </Paso>

          <Paso paso={PASOS[3]}>
            <OrientacionesInspector caseId={caso.id} caseMetadataRaw={caso.caseMetadata} />
          </Paso>

          <Paso paso={PASOS[4]}>
            <AnalisisPage caseId={caso.id} embebido />
          </Paso>
        </>
      )}
    </Space>
  );
}
