import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Typography,
  Space,
  Modal,
  DatePicker,
  TimePicker,
  Select,
  Input,
  Radio,
  Alert,
  App,
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  DollarOutlined,
  TeamOutlined,
  FileProtectOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  AuditOutlined,
  ExperimentOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  SolutionOutlined,
  RiseOutlined,
  BankOutlined,
  SendOutlined,
  InboxOutlined,
  StopOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import {
  siguientePasoComparendo,
  generarActaFirmeza,
  ESTADO_DESTINO_RESOLVER_RECURSOS,
  CONVERSION_ACTA_FIRMEZA,
  type AccionComparendoTipo,
  type EstadoComparendo,
  type DatosActaFirmeza,
} from '@/derecho';
import { useChangeCaseState, useUpdateCaseFields } from '@/shared/legalCases/api';
import { parseCaseMetadata, buildCaseMetadata } from '@/shared/legalCases/types';
import { descargarActaPdf } from '@/features/actas/actaPdf';
import { useInspeccionStore } from '@/store/inspeccionStore';
import type { ComparendoDetalle } from './types';
import { PALETA } from '@/theme/theme';

const { Text } = Typography;
const { TextArea } = Input;

const ICONO: Record<AccionComparendoTipo, ReactNode> = {
  verificar_comparendo: <FileSearchOutlined />,
  abrir_termino_objecion: <ClockCircleOutlined />,
  registrar_impugnacion: <WarningOutlined />,
  suscribir_acta_pronto_pago: <DollarOutlined />,
  suscribir_acta_conmutacion: <TeamOutlined />,
  constancia_no_objecion: <FileProtectOutlined />,
  generar_acta_firmeza: <SafetyCertificateOutlined />,
  avocar_y_citar_audiencia: <CalendarOutlined />,
  reagendar_audiencia: <ScheduleOutlined />,
  instalar_audiencia: <AuditOutlined />,
  decretar_pruebas: <ExperimentOutlined />,
  constancia_inasistencia: <CloseCircleOutlined />,
  emitir_fallo: <FileTextOutlined />,
  reanudar_audiencia: <PlayCircleOutlined />,
  admitir_justa_causa: <CheckCircleOutlined />,
  fallo_por_inasistencia: <SolutionOutlined />,
  conceder_recursos: <RiseOutlined />,
  constancia_ejecutoria: <SafetyCertificateOutlined />,
  resolver_recursos: <BankOutlined />,
  confirmar_pago: <DollarOutlined />,
  constancia_incumplimiento_pago: <WarningOutlined />,
  confirmar_actividad: <TeamOutlined />,
  constancia_incumplimiento_actividad: <WarningOutlined />,
  remitir_cobro_coactivo: <SendOutlined />,
  archivar: <InboxOutlined />,
  terminar_por_inactividad: <StopOutlined />,
};

/** Acciones sin metadata propia — un único modal de confirmación por tipo. */
const SIMPLE_ACCIONES: Partial<
  Record<AccionComparendoTipo, { estado: EstadoComparendo; titulo: string; descripcion: string; exito: string }>
> = {
  verificar_comparendo: {
    estado: 'verificado',
    titulo: 'Verificar comparendo',
    descripcion:
      'Confirme que revisó el checklist de verificación humana (firma del infractor, causal, tipo de multa, datos legibles) antes de darle trámite.',
    exito: 'Comparendo verificado.',
  },
  abrir_termino_objecion: {
    estado: 'en_espera_objecion',
    titulo: 'Abrir término de objeción',
    descripcion:
      'Se habilita el término de tres (3) días hábiles para objetar y de cinco (5) días hábiles para acogerse a los beneficios del artículo 180.',
    exito: 'Término de objeción abierto.',
  },
  constancia_no_objecion: {
    estado: 'sin_objecion',
    titulo: 'Dejar constancia de no objeción',
    descripcion:
      'Certifica que el citado no objetó ni compareció dentro de los términos legales. Habilita la firmeza por el literal e) del artículo 223A.',
    exito: 'Constancia de no objeción registrada.',
  },
  instalar_audiencia: {
    estado: 'en_audiencia',
    titulo: 'Instalar audiencia pública',
    descripcion: 'Confirma la instalación de la audiencia pública dentro del proceso verbal abreviado.',
    exito: 'Audiencia instalada.',
  },
  constancia_inasistencia: {
    estado: 'suspendida_inasistencia',
    titulo: 'Dejar constancia de inasistencia',
    descripcion:
      'El citado no compareció dentro de los quince (15) minutos de espera. Se suspende la audiencia por tres (3) días para acreditar justa causa.',
    exito: 'Constancia de inasistencia registrada.',
  },
  reanudar_audiencia: {
    estado: 'en_audiencia',
    titulo: 'Reanudar audiencia',
    descripcion: 'Vencido el término probatorio, se reanuda la audiencia pública al día siguiente.',
    exito: 'Audiencia reanudada.',
  },
  conceder_recursos: {
    estado: 'en_recurso',
    titulo: 'Conceder reposición/apelación',
    descripcion:
      'Los recursos se conceden y sustentan en la misma audiencia; la apelación se concede en efecto devolutivo.',
    exito: 'Recursos concedidos.',
  },
  constancia_ejecutoria: {
    estado: 'en_firmeza',
    titulo: 'Dejar constancia de firmeza',
    descripcion: 'No se interpusieron recursos dentro del término. La decisión queda en firme.',
    exito: 'Constancia de firmeza registrada.',
  },
  confirmar_pago: {
    estado: 'archivado',
    titulo: 'Confirmar pago y archivar',
    descripcion: 'Confirma el soporte de pago del pronto pago dentro del término. El expediente se archiva.',
    exito: 'Pago confirmado. Expediente archivado.',
  },
  constancia_incumplimiento_pago: {
    estado: 'incumplimiento_constatado',
    titulo: 'Constancia de incumplimiento de pronto pago',
    descripcion: 'No se allegó soporte de pago dentro del término. Se remitirá a cobro coactivo por el valor total.',
    exito: 'Incumplimiento de pronto pago constatado.',
  },
  confirmar_actividad: {
    estado: 'archivado',
    titulo: 'Confirmar actividad pedagógica y archivar',
    descripcion:
      'Confirma la asistencia y cumplimiento de la actividad pedagógica o programa comunitario (Sispaz). El expediente se archiva.',
    exito: 'Actividad pedagógica confirmada. Expediente archivado.',
  },
  constancia_incumplimiento_actividad: {
    estado: 'incumplimiento_constatado',
    titulo: 'Constancia de inasistencia a actividad pedagógica',
    descripcion:
      'No se acreditó la asistencia a la actividad pedagógica o programa comunitario. Se remitirá a cobro coactivo por el valor total.',
    exito: 'Inasistencia a actividad pedagógica constatada.',
  },
  remitir_cobro_coactivo: {
    estado: 'archivado',
    titulo: 'Remitir a cobro coactivo y archivar',
    descripcion: 'Remite el expediente a la Unidad de Recursos Tributarios para el cobro coactivo y ordena el archivo.',
    exito: 'Expediente remitido a cobro coactivo y archivado.',
  },
  archivar: {
    estado: 'archivado',
    titulo: 'Ordenar archivo',
    descripcion: 'Ordena el archivo definitivo del expediente.',
    exito: 'Expediente archivado.',
  },
  terminar_por_inactividad: {
    estado: 'terminado_inactividad',
    titulo: 'Terminar por inactividad',
    descripcion: 'El trámite termina por inactividad procesal (ausencia de impulso dentro de los términos).',
    exito: 'Trámite terminado por inactividad procesal.',
  },
};

const MEDIO_IMPUGNACION_OPCIONES = [
  { value: 'escrito', label: 'Escrito radicado en el despacho' },
  { value: 'verbal', label: 'Verbal (constancia secretarial)' },
  { value: 'correo_electronico', label: 'Correo electrónico' },
  { value: 'otro', label: 'Otro medio' },
];

export function SiguientePasoComparendo({
  id,
  estado,
  caseMetadata,
  caso,
}: {
  id: string;
  estado: EstadoComparendo;
  /** Raw caseMetadata del caso (opaco para el backend) — se fusiona, nunca se reemplaza entero. */
  caseMetadata?: string | null;
  /** Expediente completo: necesario para generar el acta de firmeza de la etapa. */
  caso?: ComparendoDetalle;
}) {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const paso = siguientePasoComparendo(estado);
  const cambiarEstado = useChangeCaseState();
  const actualizarCampos = useUpdateCaseFields();
  const inspeccion = useInspeccionStore((s) => s.config);

  function transicionar(nuevoEstado: EstadoComparendo, metaExtra?: Record<string, unknown>, exito?: string) {
    cambiarEstado.mutate(
      { id, state: nuevoEstado },
      {
        onSuccess: () => {
          if (metaExtra) {
            const metaActual = parseCaseMetadata<Record<string, unknown>>(caseMetadata ?? null);
            actualizarCampos.mutate({ id, fields: { caseMetadata: buildCaseMetadata({ ...metaActual, ...metaExtra }) } });
          }
          if (exito) message.success(exito);
        },
        onError: () => message.error('No se pudo actualizar el estado del expediente.'),
      },
    );
  }

  // ── Modal genérico de confirmación (acciones sin metadata propia) ────────
  const [modalSimple, setModalSimple] = useState<AccionComparendoTipo | null>(null);

  // ── Citar / reagendar audiencia / admitir justa causa ─────────────────────
  const [modalAudiencia, setModalAudiencia] = useState<
    'avocar_y_citar_audiencia' | 'reagendar_audiencia' | 'admitir_justa_causa' | null
  >(null);
  const [fechaAudiencia, setFechaAudiencia] = useState<Dayjs | null>(null);
  const [horaAudiencia, setHoraAudiencia] = useState<Dayjs | null>(null);
  const [lugarAudiencia, setLugarAudiencia] = useState('');

  // ── Decretar pruebas y suspender ───────────────────────────────────────────
  const [modalPruebas, setModalPruebas] = useState(false);
  const [pruebasDecretadas, setPruebasDecretadas] = useState<string[]>([]);
  const [fechaReanudacion, setFechaReanudacion] = useState<Dayjs | null>(null);

  // ── Registrar impugnación ──────────────────────────────────────────────────
  const [modalImpugnacion, setModalImpugnacion] = useState(false);
  const [medioImpugnacion, setMedioImpugnacion] = useState<string | null>(null);

  // ── Suscribir acta de pronto pago / conmutación ───────────────────────────
  const [modalCompromiso, setModalCompromiso] = useState<
    'suscribir_acta_pronto_pago' | 'suscribir_acta_conmutacion' | null
  >(null);
  const [fechaCompromiso, setFechaCompromiso] = useState<Dayjs | null>(null);

  // ── Emitir fallo / fallo por inasistencia ─────────────────────────────────
  const [modalFallo, setModalFallo] = useState<'emitir_fallo' | 'fallo_por_inasistencia' | null>(null);
  const [sentido, setSentido] = useState<'absuelve' | 'sanciona' | null>(null);
  const [variante, setVariante] = useState('');

  // ── Resolver recursos ──────────────────────────────────────────────────────
  const [modalResolucion, setModalResolucion] = useState(false);
  const [resolucionRecurso, setResolucionRecurso] = useState<'confirma' | 'revoca_absuelve' | 'modifica' | null>(null);

  // ── Generar acta de firmeza ────────────────────────────────────────────────
  const [modalActaFirmeza, setModalActaFirmeza] = useState(false);

  const pendiente = cambiarEstado.isPending || actualizarCampos.isPending;

  const ejecutar = (tipo: AccionComparendoTipo) => {
    switch (tipo) {
      case 'avocar_y_citar_audiencia':
      case 'reagendar_audiencia':
      case 'admitir_justa_causa':
        setFechaAudiencia(null);
        setHoraAudiencia(null);
        setLugarAudiencia('');
        return setModalAudiencia(tipo);
      case 'decretar_pruebas':
        setPruebasDecretadas([]);
        setFechaReanudacion(null);
        return setModalPruebas(true);
      case 'registrar_impugnacion':
        setMedioImpugnacion(null);
        return setModalImpugnacion(true);
      case 'suscribir_acta_pronto_pago':
      case 'suscribir_acta_conmutacion':
        setFechaCompromiso(null);
        return setModalCompromiso(tipo);
      case 'emitir_fallo':
      case 'fallo_por_inasistencia':
        setSentido(null);
        setVariante('');
        return setModalFallo(tipo);
      case 'resolver_recursos':
        setResolucionRecurso(null);
        return setModalResolucion(true);
      case 'generar_acta_firmeza':
        return setModalActaFirmeza(true);
      default:
        return setModalSimple(tipo);
    }
  };

  function generarYDescargarActaFirmeza() {
    if (!caso) return;
    const datos: DatosActaFirmeza = {
      municipio: inspeccion.municipio || 'Manizales',
      inspeccion: inspeccion.inspeccion || 'Inspección Permanente de Convivencia y Paz',
      inspectorNombre: inspeccion.inspectorNombre || 'Inspector de Convivencia y Paz',
      inspectorCargo: 'Inspector Permanente de Convivencia y Paz',
      proceso: caso.radicado,
      fechaResolucion: dayjs().format('YYYY-MM-DD'),
      comparendo: caso.numeroComparendo,
      fechaComparendo: caso.fechaComparendo,
      articuloNumeral: caso.articuloNumeral,
      lugar: caso.lugar,
      solicitado: caso.infractor,
      cedula: caso.cedula,
      direccion: caso.direccion,
      telefono: caso.telefono,
      solicitante: caso.solicitante,
      hechos: caso.hechos,
      tipoMulta: caso.tipoMulta,
      causal: caso.causal,
    };
    const acta = generarActaFirmeza(datos);
    // Advisory: la descarga del PDF nunca bloquea la actuación procesal ya registrada.
    void descargarActaPdf(acta, inspeccion.membreteDataUrl).catch(() => undefined);
  }

  function darTramiteActaFirmeza() {
    // `generar_acta_firmeza` es convierte_a en el YAML: el MISMO expediente
    // cambia de caseType (comparendo -> acta_firmeza) y arranca en el estado
    // inicial de esa máquina, no en 'en_firmeza' del comparendo — mismo
    // patrón que darTramiteQuerella en SiguientePasoQueja.
    generarYDescargarActaFirmeza();
    actualizarCampos.mutate(
      { id, fields: { caseType: CONVERSION_ACTA_FIRMEZA.caseType } },
      {
        onSuccess: () => {
          cambiarEstado.mutate(
            { id, state: CONVERSION_ACTA_FIRMEZA.estadoInicial },
            {
              onSuccess: () => {
                setModalActaFirmeza(false);
                message.success('Acta de firmeza generada. La multa general queda en firme (lit. e, art. 223A).');
                navigate('/panel/comparendos');
              },
              onError: () => message.error('No se pudo dejar en firme el expediente. Intente de nuevo.'),
            },
          );
        },
        onError: () => message.error('No se pudo generar el acta de firmeza. Intente de nuevo.'),
      },
    );
  }

  if (paso.terminal) {
    return <Alert type="success" showIcon message="Trámite finalizado" description={paso.mensaje} />;
  }

  return (
    <>
      <Card
        variant="borderless"
        style={{
          background: `linear-gradient(120deg, ${PALETA.azulSuave} 0%, #ffffff 78%)`,
          borderRadius: 20,
        }}
        styles={{ body: { padding: '18px 22px 20px' } }}
      >
        <Text type="secondary" style={{ fontSize: 11, letterSpacing: '0.09em', fontWeight: 600 }}>
          PRÓXIMA ACTUACIÓN
        </Text>
        <div style={{ margin: '6px 0 14px', color: PALETA.texto }}>{paso.mensaje}</div>
        <Space wrap>
          {paso.acciones.map((a) => (
            <Button
              key={a.tipo}
              type={a.primaria ? 'primary' : 'default'}
              icon={ICONO[a.tipo]}
              loading={pendiente}
              onClick={() => ejecutar(a.tipo)}
            >
              {a.label}
            </Button>
          ))}
        </Space>
      </Card>

      {/* Confirmación simple (acciones sin metadata propia) */}
      <Modal
        open={modalSimple !== null}
        title={modalSimple ? SIMPLE_ACCIONES[modalSimple]?.titulo : ''}
        okText="Confirmar"
        cancelText="Cancelar"
        okButtonProps={{ loading: pendiente }}
        onCancel={() => setModalSimple(null)}
        onOk={() => {
          if (!modalSimple) return;
          const cfg = SIMPLE_ACCIONES[modalSimple];
          setModalSimple(null);
          if (cfg) transicionar(cfg.estado, undefined, cfg.exito);
        }}
      >
        <Text type="secondary">{modalSimple ? SIMPLE_ACCIONES[modalSimple]?.descripcion : ''}</Text>
      </Modal>

      {/* Avocar y citar / reagendar audiencia / admitir justa causa */}
      <Modal
        open={modalAudiencia !== null}
        title={
          modalAudiencia === 'reagendar_audiencia'
            ? 'Reagendar audiencia'
            : modalAudiencia === 'admitir_justa_causa'
              ? 'Admitir justa causa y reprogramar'
              : 'Proferir auto que avoca y fija audiencia'
        }
        okText="Confirmar citación"
        cancelText="Cancelar"
        okButtonProps={{ disabled: !fechaAudiencia || !horaAudiencia || !lugarAudiencia, loading: pendiente }}
        onCancel={() => setModalAudiencia(null)}
        onOk={() => {
          const origen = modalAudiencia;
          setModalAudiencia(null);
          transicionar(
            'audiencia_programada',
            {
              fechaAudiencia: fechaAudiencia?.format('YYYY-MM-DD'),
              horaAudiencia: horaAudiencia?.format('HH:mm'),
              lugarAudiencia,
            },
            origen === 'reagendar_audiencia'
              ? 'Audiencia reagendada.'
              : origen === 'admitir_justa_causa'
                ? 'Justa causa admitida. Audiencia reprogramada.'
                : 'Audiencia señalada.',
          );
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          <Text type="secondary">Señale la fecha, hora y lugar de la audiencia pública.</Text>
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            placeholder="Fecha de la audiencia"
            value={fechaAudiencia}
            onChange={setFechaAudiencia}
          />
          <TimePicker
            style={{ width: '100%' }}
            format="HH:mm"
            placeholder="Hora de la audiencia"
            value={horaAudiencia}
            onChange={setHoraAudiencia}
          />
          <Input
            placeholder="Lugar de la audiencia (p. ej. Despacho de la Inspección)"
            value={lugarAudiencia}
            onChange={(e) => setLugarAudiencia(e.target.value)}
          />
        </Space>
      </Modal>

      {/* Decretar pruebas y suspender */}
      <Modal
        open={modalPruebas}
        title="Decretar pruebas y suspender"
        okText="Decretar y suspender"
        cancelText="Cancelar"
        okButtonProps={{ disabled: pruebasDecretadas.length === 0 || !fechaReanudacion, loading: pendiente }}
        onCancel={() => setModalPruebas(false)}
        onOk={() => {
          setModalPruebas(false);
          transicionar(
            'suspendida_pruebas',
            {
              pruebasDecretadas,
              fechaReanudacion: fechaReanudacion?.format('YYYY-MM-DD'),
            },
            'Pruebas decretadas. Audiencia suspendida.',
          );
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          <Text type="secondary">
            Relacione las pruebas decretadas (Enter para agregar cada una) y la fecha de reanudación de la
            audiencia — máximo cinco (5) días hábiles (art. 223 num. 3 lit. c).
          </Text>
          <Select
            mode="tags"
            style={{ width: '100%' }}
            placeholder="Pruebas decretadas…"
            value={pruebasDecretadas}
            onChange={setPruebasDecretadas}
            tokenSeparators={[',']}
          />
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            placeholder="Fecha de reanudación"
            value={fechaReanudacion}
            onChange={setFechaReanudacion}
          />
        </Space>
      </Modal>

      {/* Registrar impugnación oportuna */}
      <Modal
        open={modalImpugnacion}
        title="Registrar impugnación oportuna"
        okText="Registrar impugnación"
        cancelText="Cancelar"
        okButtonProps={{ disabled: !medioImpugnacion, loading: pendiente }}
        onCancel={() => setModalImpugnacion(false)}
        onOk={() => {
          setModalImpugnacion(false);
          transicionar(
            'objetado',
            { medioImpugnacion },
            'Impugnación registrada. Se habilita el proceso verbal abreviado.',
          );
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          <Alert
            type="warning"
            showIcon
            message="Pérdida del beneficio de pronto pago"
            description="Con la impugnación se pierde el beneficio del descuento por pronto pago (art. 180)."
          />
          <Text>¿Por qué medio se presentó la impugnación?</Text>
          <Select
            style={{ width: '100%' }}
            placeholder="Medio de impugnación"
            value={medioImpugnacion}
            onChange={setMedioImpugnacion}
            options={MEDIO_IMPUGNACION_OPCIONES}
          />
        </Space>
      </Modal>

      {/* Suscribir acta de pronto pago / conmutación */}
      <Modal
        open={modalCompromiso !== null}
        title={modalCompromiso === 'suscribir_acta_conmutacion' ? 'Suscribir acta de conmutación' : 'Suscribir acta de pronto pago'}
        okText="Suscribir acta"
        cancelText="Cancelar"
        okButtonProps={{ disabled: !fechaCompromiso, loading: pendiente }}
        onCancel={() => setModalCompromiso(null)}
        onOk={() => {
          const esConmutacion = modalCompromiso === 'suscribir_acta_conmutacion';
          setModalCompromiso(null);
          transicionar(
            esConmutacion ? 'conmutacion_acordada' : 'pronto_pago_acordado',
            { fechaCompromiso: fechaCompromiso?.format('YYYY-MM-DD') },
            esConmutacion ? 'Acta de conmutación suscrita.' : 'Acta de pronto pago suscrita.',
          );
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          <Text type="secondary">
            {modalCompromiso === 'suscribir_acta_conmutacion'
              ? 'Registre la fecha de compromiso para la asistencia a la actividad pedagógica o programa comunitario (art. 180).'
              : 'Registre la fecha de compromiso para el pago con descuento del 50% (art. 180).'}
          </Text>
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            placeholder="Fecha de compromiso"
            value={fechaCompromiso}
            onChange={setFechaCompromiso}
          />
        </Space>
      </Modal>

      {/* Emitir fallo / fallo por inasistencia */}
      <Modal
        open={modalFallo !== null}
        title={modalFallo === 'fallo_por_inasistencia' ? 'Resolver de fondo por inasistencia' : 'Emitir fallo en audiencia'}
        okText="Proferir decisión"
        cancelText="Cancelar"
        okButtonProps={{ disabled: !sentido, loading: pendiente }}
        onCancel={() => setModalFallo(null)}
        onOk={() => {
          setModalFallo(null);
          transicionar(
            'fallo_emitido',
            { sentido, variante },
            sentido === 'sanciona' ? 'Fallo emitido: se impone medida correctiva.' : 'Fallo emitido: se absuelve al citado.',
          );
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          <Text>¿Cuál es el sentido de la decisión?</Text>
          <Radio.Group value={sentido} onChange={(e) => setSentido(e.target.value)}>
            <Space direction="vertical">
              <Radio value="absuelve">Absuelve al citado</Radio>
              <Radio value="sanciona">Sanciona con medida correctiva</Radio>
            </Space>
          </Radio.Group>
          <div>
            <Text style={{ display: 'block', marginBottom: 6 }}>
              Variante de la decisión (medida impuesta o motivo de la absolución):
            </Text>
            <TextArea
              rows={3}
              value={variante}
              onChange={(e) => setVariante(e.target.value)}
              placeholder="Ej.: Multa general tipo 2 con incremento del 75% por reiteración…"
            />
          </div>
        </Space>
      </Modal>

      {/* Resolver recursos */}
      <Modal
        open={modalResolucion}
        title="Registrar resolución de recursos"
        okText="Registrar resolución"
        cancelText="Cancelar"
        okButtonProps={{ disabled: !resolucionRecurso, loading: pendiente }}
        onCancel={() => setModalResolucion(false)}
        onOk={() => {
          if (!resolucionRecurso) return;
          setModalResolucion(false);
          // El YAML solo define en_recurso -> en_firmeza para resolver_recursos:
          // el sentido de la resolución es metadata de la actuación, nunca un
          // estado alterno (revocar/absolver tampoco archiva directo).
          const metaExtra: Record<string, unknown> =
            resolucionRecurso === 'revoca_absuelve'
              ? { resolucionRecurso, sentido: 'absuelve' }
              : { resolucionRecurso };
          transicionar(
            ESTADO_DESTINO_RESOLVER_RECURSOS,
            metaExtra,
            resolucionRecurso === 'revoca_absuelve'
              ? 'Decisión revocada: se absuelve al citado. Decisión en firme.'
              : 'Resolución de recursos registrada. Decisión en firme.',
          );
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          <Text>¿Cómo se resolvieron la reposición y/o apelación?</Text>
          <Radio.Group value={resolucionRecurso} onChange={(e) => setResolucionRecurso(e.target.value)}>
            <Space direction="vertical">
              <Radio value="confirma">Confirma la decisión — queda en firme</Radio>
              <Radio value="modifica">Modifica la decisión — mantiene la sanción, queda en firme</Radio>
              <Radio value="revoca_absuelve">Revoca la decisión — se absuelve, queda en firme</Radio>
            </Space>
          </Radio.Group>
        </Space>
      </Modal>

      {/* Generar acta de firmeza */}
      <Modal
        open={modalActaFirmeza}
        title="Generar acta de firmeza"
        okText="Generar acta y dejar en firme"
        cancelText="Cancelar"
        okButtonProps={{ loading: pendiente }}
        onCancel={() => setModalActaFirmeza(false)}
        onOk={darTramiteActaFirmeza}
      >
        <Alert
          type="info"
          showIcon
          message="Firmeza por vencimiento de términos"
          description="Vencidos los términos sin objeción ni comparecencia, se genera el acta de firmeza de la multa general y se descarga el PDF para el expediente."
        />
      </Modal>
    </>
  );
}
