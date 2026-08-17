import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, App, Card, Divider, Empty, Select, Skeleton, Space, Tag, Typography, Upload } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { FolderPlus } from 'lucide-react';
import { apiFetch } from '@/shared/api/client';
import { useProcesos } from '@/shared/procesos/api';
import { useCreateLegalCase, useLegalCase } from '@/shared/legalCases/api';
import { useInspeccionStore } from '@/store/inspeccionStore';
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

  const { message } = App.useApp();
  const inspeccion = useInspeccionStore((s) => s.config);
  const crearCaso = useCreateLegalCase();
  const [subiendo, setSubiendo] = useState(false);
  // Solo el expediente abierto desde sus documentos se analiza solo. Uno ya
  // radicado que se abre para revisarlo no dispara una llamada de IA sin pedirla.
  const [reciendeDocumentos, setRecienDeDocumentos] = useState(false);

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

  const elegir = (id: string) => {
    setRecienDeDocumentos(false);
    setSearchParams(id ? { caso: id } : {}, { replace: true });
  };

  /**
   * Soltar los documentos ES el primer paso: de un tirón abre el expediente y
   * los sube. Pedir antes un "abrir expediente" era un clic que no significaba
   * nada para el inspector, que lo que tiene en la mano son los papeles.
   *
   * El expediente se crea aquí y no al aprobar porque los documentos se guardan
   * colgados de un caso: sin él no hay dónde ponerlos y el trabajo viviría en la
   * memoria del navegador. El radicado lo asigna legalcase.
   */
  const empezarConDocumentos = async (archivos: File[]) => {
    if (archivos.length === 0) return;
    setSubiendo(true);
    try {
      const nuevo = await crearCaso.mutateAsync({
        caseType: 'querella',
        className: 'Querella',
        judicialOfficeId: inspeccion.inspeccion || 'Inspección de Convivencia y Paz',
        venueCity: inspeccion.municipio || '',
      });

      const subidas = await Promise.allSettled(
        archivos.map((archivo) => {
          const body = new FormData();
          body.append('file', archivo, archivo.name);
          return apiFetch(`/tools/expedientes/${nuevo.id}/documents`, { method: 'POST', body });
        }),
      );
      const fallidas = subidas.filter((s) => s.status === 'rejected').length;

      elegir(nuevo.id);
      // Después de elegir, porque elegir() lo apaga: este expediente sí nació de
      // los documentos y su análisis arranca solo.
      setRecienDeDocumentos(true);
      // El expediente ya existe aunque falle un archivo: se dice cuántos, no se
      // finge que todo entró.
      if (fallidas > 0) {
        message.warning(
          `Expediente ${nuevo.filingNumber} abierto, pero ${fallidas} de ${archivos.length} documentos no se pudieron subir. Vuelva a cargarlos en el paso 1.`,
        );
      } else {
        message.success(
          `Expediente ${nuevo.filingNumber} abierto con ${archivos.length} documento(s). Ya está en Mis procesos.`,
        );
      }
    } catch {
      message.error('No se pudo abrir el expediente. Intente de nuevo.');
    } finally {
      setSubiendo(false);
    }
  };

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
          Empezar desde los documentos
        </div>
        <Text type="secondary" style={{ display: 'block', fontSize: 12.5, marginBottom: 12 }}>
          No hace falta radicar antes en otro sitio. Suelte aquí los documentos: se abre el
          expediente con ellos dentro y el análisis extrae los hechos y los fundamentos. Queda en Mis
          procesos desde ese momento, no al final, así el trabajo no se pierde si cierra la página.
        </Text>
        <Upload.Dragger
          multiple
          disabled={subiendo}
          showUploadList={false}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          beforeUpload={() => false}
          onChange={({ fileList }) => {
            // Ant entrega RcFile, que extiende File; se filtran los que aún no
            // lo traen para no arrancar con una selección a medias.
            const archivos = fileList.flatMap((f) => (f.originFileObj ? [f.originFileObj as File] : []));
            if (archivos.length === fileList.length) void empezarConDocumentos(archivos);
          }}
          style={{ borderRadius: 14, background: PALETA.superficie }}
        >
          <p style={{ margin: '6px 0 8px' }}>
            {subiendo ? (
              <LoadingOutlined style={{ fontSize: 26, color: PALETA.azul }} />
            ) : (
              <FolderPlus size={26} strokeWidth={1.6} color={PALETA.azul} />
            )}
          </p>
          <p style={{ margin: 0, fontSize: 14.5, fontWeight: 500 }}>
            {subiendo ? 'Abriendo el expediente…' : 'Arrastre los documentos del proceso, o haga clic'}
          </p>
          <p style={{ margin: '4px 0 6px', fontSize: 12.5, color: PALETA.textoSuave }}>
            Querella, contestación, actas, pruebas documentales. PDF, Word o imagen.
          </p>
        </Upload.Dragger>

        <Divider style={{ margin: '18px 0 14px' }} plain>
          <Text type="secondary" style={{ fontSize: 12 }}>
            o trabaje uno ya radicado
          </Text>
        </Divider>

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
          message="Abra un expediente para empezar"
          description="Empiece desde los documentos si el proceso todavía no existe, o elija uno ya radicado. En los dos casos el área carga sus documentos, pruebas y orientaciones, y desde aquí se genera, se aprueba y se descarga el fallo."
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
            <AnalisisPage caseId={caso.id} embebido autoGenerar={reciendeDocumentos} />
          </Paso>
        </>
      )}
    </Space>
  );
}
