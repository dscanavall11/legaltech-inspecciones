import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Typography,
  Card,
  Input,
  Button,
  Form,
  Upload,
  App,
  Progress,
  Tag,
  Table,
  Skeleton,
  Alert,
  Drawer,
  Space,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FormOutlined,
  PictureOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileProtectOutlined,
  EyeOutlined,
  BankOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { useInspeccionStore } from '@/store/inspeccionStore';
import { useChecklistDespacho } from './useChecklistDespacho';
import { useTemplateResolution, type NivelResolucionPlantilla } from './useTemplateResolution';
import { derivarEstadoChecklist, type ChecklistItemEstado, type TipoItemChecklist } from './checklistDespacho';
import { generarBlobEjemploPlantilla, NOMBRE_PLANTILLA } from './ejemploPlantillas';
import { PdfViewer } from '@/shared/documentos/PdfViewer';
import { PALETA, ELEVACION } from '@/theme/theme';

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

function EstadoTag({ hecho }: { hecho: boolean }) {
  return hecho ? (
    <Tag color="success" icon={<CheckCircleOutlined />} style={{ marginRight: 0 }}>
      Completo
    </Tag>
  ) : (
    <Tag icon={<ClockCircleOutlined />} style={{ marginRight: 0 }}>
      Pendiente
    </Tag>
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
        <EstadoTag hecho={item.hecho} />
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

  const [formDespacho] = Form.useForm<{ municipio: string; inspectorNombre: string; inspeccion: string }>();
  const [formRecaudo] = Form.useForm<{ cuentaRecaudo: string; titularCuenta: string; nitTitular: string }>();
  const [formCorreo] = Form.useForm<{ correoNotificaciones: string }>();

  useEffect(() => {
    formDespacho.setFieldsValue({
      municipio: config.municipio,
      inspectorNombre: config.inspectorNombre,
      inspeccion: config.inspeccion,
    });
    formRecaudo.setFieldsValue({
      cuentaRecaudo: config.cuentaRecaudo,
      titularCuenta: config.titularCuenta,
      nitTitular: config.nitTitular,
    });
    formCorreo.setFieldsValue({ correoNotificaciones: config.correoNotificaciones });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const completos = estadoChecklist.filter((i) => i.hecho).length;
  const progreso = estadoChecklist.length > 0 ? Math.round((completos / estadoChecklist.length) * 100) : 0;

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

  function guardarCuentaRecaudo() {
    const v = formRecaudo.getFieldsValue();
    guardarConfig({
      cuentaRecaudo: v.cuentaRecaudo ?? config.cuentaRecaudo,
      titularCuenta: v.titularCuenta ?? config.titularCuenta,
      nitTitular: v.nitTitular ?? config.nitTitular,
    });
    message.success('Cuenta de recaudo guardada.');
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
      width: 140,
      render: (_, fila) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          loading={generandoPrevia === fila.documentKey}
          onClick={() => verPrevia(fila.documentKey)}
        >
          Vista previa
        </Button>
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
        Los datos, membrete, cuenta de recaudo y plantillas propias que usan los documentos que genera este despacho.
      </Text>

      <Card variant="borderless" style={{ boxShadow: ELEVACION.base, marginTop: 18 }} styles={{ body: { padding: '14px 20px' } }}>
        {cargandoChecklist ? (
          <Skeleton active paragraph={{ rows: 1 }} />
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text strong style={{ fontSize: 13 }}>
                Progreso de configuración
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {completos} / {estadoChecklist.length} completos
              </Text>
            </div>
            <Progress percent={progreso} strokeColor={progreso === 100 ? PALETA.verde : PALETA.azul} showInfo={false} />
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

              case 'cuenta-recaudo':
                return (
                  <ItemCard key={item.key} item={item}>
                    <Form form={formRecaudo} layout="vertical" requiredMark={false}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <Form.Item label="Cuenta (banco, tipo y número)" name="cuentaRecaudo" style={{ marginBottom: 10 }}>
                          <Input placeholder="Ahorros Banco XYZ No. 123-456789" prefix={<BankOutlined />} />
                        </Form.Item>
                        <Form.Item label="Titular" name="titularCuenta" style={{ marginBottom: 10 }}>
                          <Input placeholder="Municipio de Manizales" />
                        </Form.Item>
                        <Form.Item label="NIT del titular" name="nitTitular" style={{ marginBottom: 10 }}>
                          <Input placeholder="890801052-1" />
                        </Form.Item>
                      </div>
                    </Form>
                    <Button icon={<SaveOutlined />} onClick={guardarCuentaRecaudo}>
                      Guardar
                    </Button>
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

      <Drawer
        title={previa?.nombre}
        open={previa !== null}
        onClose={() => setPrevia(null)}
        width={720}
      >
        {previa && <PdfViewer archivo={previa.blob} />}
      </Drawer>
    </div>
  );
}
