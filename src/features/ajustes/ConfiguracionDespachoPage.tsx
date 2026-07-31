import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Typography,
  Card,
  Input,
  Button,
  Form,
  Upload,
  App,
  Tag,
  Table,
  Skeleton,
  Alert,
  Space,
  Popconfirm,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FormOutlined,
  PictureOutlined,
  SaveOutlined,
  CheckCircleFilled,
  FileProtectOutlined,
  EyeOutlined,
  MailOutlined,
  UploadOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { useInspeccionStore } from '@/store/inspeccionStore';
import { useChecklistDespacho } from './useChecklistDespacho';
import {
  useTemplateResolution,
  useUpsertInspectorTemplate,
  useDeleteInspectorTemplate,
  type NivelResolucionPlantilla,
} from './useTemplateResolution';
import { derivarEstadoChecklist, type ChecklistItemEstado, type TipoItemChecklist } from './checklistDespacho';
import { generarBlobEjemploPlantilla, NOMBRE_PLANTILLA } from '@/shared/documentos/ejemploPlantillas';
import { VisorLateral } from '@/shared/documentos/VisorLateral';
import { PALETA, ELEVACION } from '@/theme/theme';
import { ChecklistVisual } from '@/shared/components/ChecklistVisual';

const { Title, Text, Paragraph } = Typography;

const ICONO_TIPO: Record<TipoItemChecklist, ReactNode> = {
  formulario: <FormOutlined />,
  archivo: <PictureOutlined />,
  plantillas: <FileProtectOutlined />,
};

const NIVEL_ESTILO: Record<NivelResolucionPlantilla, { texto: string; color: string; fondo: string }> = {
  sistema: { texto: 'Sistema', color: PALETA.textoSuave, fondo: '#efede7' },
  oficina: { texto: 'Oficina', color: PALETA.azulOscuro, fondo: PALETA.azulBg },
  inspector: { texto: 'Inspector', color: PALETA.moradoOscuro, fondo: PALETA.moradoBg },
};

/** Círculo verde relleno (completo) / círculo neutro vacío (pendiente) — mismo lenguaje visual que ChecklistVisual. */
function EstadoIndicador({ hecho }: { hecho: boolean }) {
  return hecho ? (
    <CheckCircleFilled style={{ color: PALETA.verde, fontSize: 18 }} />
  ) : (
    <span
      aria-hidden
      style={{
        width: 15,
        height: 15,
        borderRadius: '50%',
        border: `1.5px solid ${PALETA.borde}`,
        display: 'inline-block',
      }}
    />
  );
}

function ItemCard({ item, children }: { item: ChecklistItemEstado; children: ReactNode }) {
  return (
    <Card variant="borderless" style={{ boxShadow: ELEVACION.base }} styles={{ body: { padding: '16px 20px' } }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: PALETA.azulSuave,
            color: PALETA.azulOscuro,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {ICONO_TIPO[item.tipo]}
        </div>
        <Text strong style={{ flex: 1, fontSize: 14.5 }}>
          {item.label}
        </Text>
        <EstadoIndicador hecho={item.hecho} />
      </div>
      {children}
    </Card>
  );
}

export function ConfiguracionDespachoPage() {
  const { message } = App.useApp();
  const config = useInspeccionStore((s) => s.config);
  const guardarConfig = useInspeccionStore((s) => s.guardarConfig);
  const { data: checklist, isLoading: cargandoChecklist, isError: errorChecklist } = useChecklistDespacho();
  const { data: resolucion, isLoading: cargandoResolucion } = useTemplateResolution();
  const subirPlantillaInspector = useUpsertInspectorTemplate();
  const restaurarPlantillaSistema = useDeleteInspectorTemplate();

  const [formDespacho] = Form.useForm<{ municipio: string; inspectorNombre: string; inspeccion: string }>();
  const [formCorreo] = Form.useForm<{ correoNotificaciones: string }>();

  useEffect(() => {
    // cargandoChecklist is the exact flag the JSX below gates the Skeleton vs.
    // the real <Form> on (not `checklist` itself - with TanStack Query v5 the
    // two can be a tick apart) - setting fields before the Form mounts fires
    // AntD's "Instance not connected" warning for nothing.
    if (cargandoChecklist) return;
    formDespacho.setFieldsValue({
      municipio: config.municipio,
      inspectorNombre: config.inspectorNombre,
      inspeccion: config.inspeccion,
    });
    formCorreo.setFieldsValue({ correoNotificaciones: config.correoNotificaciones });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargandoChecklist]);

  const documentosPlantillas = useMemo(
    () => checklist?.items.find((i) => i.key === 'plantillas-personalizadas')?.documentos ?? [],
    [checklist],
  );

  const plantillasPersonalizadasCount = useMemo(
    () =>
      (resolucion ?? []).filter((r) => documentosPlantillas.includes(r.documentKey) && r.level !== 'sistema').length,
    [resolucion, documentosPlantillas],
  );

  const estadoChecklist = useMemo(
    () => (checklist ? derivarEstadoChecklist(checklist.items, config, plantillasPersonalizadasCount) : []),
    [checklist, config, plantillasPersonalizadasCount],
  );

  // ── Membrete: mismo patrón local-dataURL de AjustesPage. TODO(S3): cuando el
  // membrete se persista en S3 (ver project_data_governance), este handler y
  // el de AjustesPage deben converger en un único hook compartido. ──────────
  function onMembreteCargado(file: File) {
    const lector = new FileReader();
    lector.onload = () => {
      guardarConfig({ membreteDataUrl: String(lector.result) });
      message.success('Membrete guardado.');
    };
    lector.readAsDataURL(file);
    return false;
  }

  function guardarDatosDespacho() {
    const v = formDespacho.getFieldsValue();
    guardarConfig({
      municipio: v.municipio ?? config.municipio,
      inspectorNombre: v.inspectorNombre ?? config.inspectorNombre,
      inspeccion: v.inspeccion ?? config.inspeccion,
    });
    message.success('Datos del despacho guardados.');
  }

  function guardarCorreoNotificaciones() {
    const v = formCorreo.getFieldsValue();
    guardarConfig({ correoNotificaciones: v.correoNotificaciones ?? config.correoNotificaciones });
    message.success('Correo de notificaciones guardado.');
  }

  // ── Vista previa de plantillas (documentos con datos de ejemplo) ─────────
  const [previa, setPrevia] = useState<{ nombre: string; blob: Blob } | null>(null);
  const [generandoPrevia, setGenerandoPrevia] = useState<string | null>(null);

  async function verPrevia(documentKey: string) {
    setGenerandoPrevia(documentKey);
    try {
      const blob = await generarBlobEjemploPlantilla(documentKey, config);
      if (!blob) {
        message.error('No hay generador de ejemplo para esta plantilla.');
        return;
      }
      setPrevia({ nombre: NOMBRE_PLANTILLA[documentKey] ?? documentKey, blob });
    } catch {
      message.error('No se pudo generar la previsualización.');
    } finally {
      setGenerandoPrevia(null);
    }
  }

  // v1 solo texto plano/markdown/YAML - convertir .docx queda para una iteración futura.
  const EXTENSIONES_PLANTILLA_RE = /\.(md|txt|yaml|yml)$/i;

  async function subirPlantillaPropia(documentKey: string, archivo: File) {
    if (!EXTENSIONES_PLANTILLA_RE.test(archivo.name)) {
      message.error('Solo se aceptan archivos .md, .txt o .yaml.');
      return false;
    }
    try {
      const contenido = await archivo.text();
      await subirPlantillaInspector.mutateAsync({
        documentKey,
        content: contenido,
        title: NOMBRE_PLANTILLA[documentKey] ?? documentKey,
      });
      message.success('Plantilla propia guardada.');
    } catch {
      message.error('No se pudo guardar la plantilla.');
    }
    return false;
  }

  function restaurarPlantilla(documentKey: string) {
    restaurarPlantillaSistema.mutate(documentKey, {
      onSuccess: () => message.success('Se restauró la plantilla de oficina/sistema.'),
      onError: () => message.error('No se pudo restaurar la plantilla.'),
    });
  }

  const filasPlantillas = documentosPlantillas.map((documentKey) => ({
    documentKey,
    resolucion: (resolucion ?? []).find((r) => r.documentKey === documentKey) ?? null,
  }));

  const columnasPlantillas: ColumnsType<(typeof filasPlantillas)[number]> = [
    {
      title: 'Documento',
      dataIndex: 'documentKey',
      render: (documentKey: string) => NOMBRE_PLANTILLA[documentKey] ?? documentKey,
    },
    {
      title: 'Nivel',
      width: 120,
      render: (_, fila) => {
        const nivel = fila.resolucion?.level;
        if (!nivel) {
          return (
            <Tag style={{ marginRight: 0 }}>Sin resolver</Tag>
          );
        }
        const estilo = NIVEL_ESTILO[nivel];
        return (
          <Tag style={{ marginRight: 0, color: estilo.color, background: estilo.fondo, border: 'none' }}>
            {estilo.texto}
          </Tag>
        );
      },
    },
    {
      title: 'Acciones',
      width: 320,
      render: (_, fila) => (
        <Space size={6} wrap>
          <Button
            size="small"
            icon={<EyeOutlined />}
            loading={generandoPrevia === fila.documentKey}
            onClick={() => verPrevia(fila.documentKey)}
          >
            Vista previa
          </Button>
          <Upload
            accept=".md,.txt,.yaml,.yml"
            showUploadList={false}
            beforeUpload={(archivo) => subirPlantillaPropia(fila.documentKey, archivo)}
          >
            <Button
              size="small"
              icon={<UploadOutlined />}
              loading={
                subirPlantillaInspector.isPending &&
                subirPlantillaInspector.variables?.documentKey === fila.documentKey
              }
            >
              Subir mi plantilla
            </Button>
          </Upload>
          {fila.resolucion?.level === 'inspector' && (
            <Popconfirm
              title="Restaurar plantilla de sistema"
              description="Se elimina la plantilla propia; vuelve a usarse la de oficina o sistema."
              okText="Restaurar"
              cancelText="Cancelar"
              onConfirm={() => restaurarPlantilla(fila.documentKey)}
            >
              <Button
                size="small"
                danger
                icon={<RollbackOutlined />}
                loading={
                  restaurarPlantillaSistema.isPending && restaurarPlantillaSistema.variables === fila.documentKey
                }
              >
                Restaurar plantilla de sistema
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (errorChecklist) {
    return (
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <Alert
          type="error"
          showIcon
          message="No se pudo cargar el checklist de configuración del despacho."
          description="Verifique la conexión con legalcase e intente de nuevo."
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: 2 }}>
        Configuración del despacho
      </Title>
      <Text type="secondary">
        Los datos, membrete y plantillas propias que usan los documentos que genera este despacho.
      </Text>

      <Card variant="borderless" style={{ boxShadow: ELEVACION.base, marginTop: 18 }} styles={{ body: { padding: '14px 20px' } }}>
        {cargandoChecklist ? (
          <Skeleton active paragraph={{ rows: 1 }} />
        ) : (
          <>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>
              Progreso de configuración
            </Text>
            <ChecklistVisual
              items={estadoChecklist.map((item) => ({ key: item.key, label: item.label, done: item.hecho }))}
              showSummary
            />
          </>
        )}
      </Card>

      {cargandoChecklist ? (
        <Space direction="vertical" size={16} style={{ width: '100%', marginTop: 16 }}>
          <Skeleton active paragraph={{ rows: 3 }} />
          <Skeleton active paragraph={{ rows: 3 }} />
          <Skeleton active paragraph={{ rows: 3 }} />
        </Space>
      ) : (
        <Space direction="vertical" size={16} style={{ width: '100%', marginTop: 16 }}>
          {estadoChecklist.map((item) => {
            switch (item.key) {
              case 'datos-despacho':
                return (
                  <ItemCard key={item.key} item={item}>
                    <Form form={formDespacho} layout="vertical" requiredMark={false}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Form.Item label="Municipio (alcaldía)" name="municipio" style={{ marginBottom: 10 }}>
                          <Input placeholder="Manizales" />
                        </Form.Item>
                        <Form.Item label="Inspector" name="inspectorNombre" style={{ marginBottom: 10 }}>
                          <Input placeholder="Nombre del inspector" />
                        </Form.Item>
                      </div>
                      <Form.Item label="Inspección (turno)" name="inspeccion" style={{ marginBottom: 10 }}>
                        <Input placeholder="Inspección Permanente de Convivencia y Paz — Turno Uno" />
                      </Form.Item>
                    </Form>
                    <Button icon={<SaveOutlined />} onClick={guardarDatosDespacho}>
                      Guardar
                    </Button>
                  </ItemCard>
                );

              case 'membrete':
                return (
                  <ItemCard key={item.key} item={item}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {config.membreteDataUrl ? (
                        <img
                          src={config.membreteDataUrl}
                          alt="Membrete"
                          style={{ width: 96, height: 44, objectFit: 'contain', borderRadius: 10, background: '#f6f7f9' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 96,
                            height: 44,
                            borderRadius: 10,
                            background: '#f6f7f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: PALETA.textoTenue,
                            fontSize: 12,
                          }}
                        >
                          Sin membrete
                        </div>
                      )}
                      <Upload beforeUpload={onMembreteCargado} showUploadList={false} accept="image/png,image/jpeg">
                        <Button icon={<PictureOutlined />}>
                          {config.membreteDataUrl ? 'Cambiar membrete' : 'Cargar membrete (PNG/JPG)'}
                        </Button>
                      </Upload>
                    </div>
                  </ItemCard>
                );

              case 'correo-notificaciones':
                return (
                  <ItemCard key={item.key} item={item}>
                    <Form form={formCorreo} layout="vertical" requiredMark={false}>
                      <Form.Item
                        label="Correo institucional"
                        name="correoNotificaciones"
                        rules={[{ type: 'email', message: 'Ingrese un correo válido' }]}
                        style={{ marginBottom: 10 }}
                      >
                        <Input placeholder="inspeccion@municipio.gov.co" prefix={<MailOutlined />} />
                      </Form.Item>
                    </Form>
                    <Button icon={<SaveOutlined />} onClick={guardarCorreoNotificaciones}>
                      Guardar
                    </Button>
                  </ItemCard>
                );

              case 'plantillas-personalizadas':
                return (
                  <ItemCard key={item.key} item={item}>
                    <Paragraph type="secondary" style={{ fontSize: 12.5, marginBottom: 10 }}>
                      Nivel resuelto por documento: plantilla del inspector, si existe; si no, la de la oficina; si
                      no, la de sistema.
                    </Paragraph>
                    <Table
                      size="small"
                      rowKey="documentKey"
                      dataSource={filasPlantillas}
                      columns={columnasPlantillas}
                      loading={cargandoResolucion}
                      pagination={false}
                    />
                  </ItemCard>
                );

              default:
                return null;
            }
          })}
        </Space>
      )}

      <VisorLateral titulo={previa?.nombre} abierto={previa !== null} archivo={previa?.blob ?? null} onCerrar={() => setPrevia(null)} />
    </div>
  );
}
