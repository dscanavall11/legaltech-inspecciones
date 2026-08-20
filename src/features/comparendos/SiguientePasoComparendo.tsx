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
  Checkbox,
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
  actaFirmezaComoDocumento,
  generarAutoAvocaCitaAudiencia,
  generarAutoDecretaPruebasSuspende,
  generarAutoInasistencia,
  generarFalloComparendo,
  generarConstanciaIncumplimientoProntoPago,
  generarConstanciaIncumplimientoActividadPedagogica,
  buscarComportamiento,
  ESTADO_DESTINO_RESOLVER_RECURSOS,
  CONVERSION_ACTA_FIRMEZA,
  type AccionComparendoTipo,
  type EstadoComparendo,
  type DatosActaFirmeza,
  type DocumentoLegal,
  type VarianteFallo,
} from '@/derecho';
import { useChangeCaseState, useUpdateCaseFields } from '@/shared/legalCases/api';
import { parseCaseMetadata, buildCaseMetadata } from '@/shared/legalCases/types';
import { descargarDocumentoLegalPdf } from '@/shared/documentos/documentoLegalPdf';
import { generarDocumentoLegalBlob } from '@/shared/documentos/documentoLegalPdf';
import { PdfViewer } from '@/shared/documentos/PdfViewer';
import { useUploadCaseDocument } from '@/shared/documentos/api';
import { useInspeccionStore } from '@/store/inspeccionStore';
import type { ComparendoDetalle, ComparendoMetadata } from './types';
import { PALETA } from '@/theme/theme';
import { ChecklistVisual } from '@/shared/components/ChecklistVisual';
import { CHECKLIST_VERIFICACION_COMPARENDO } from './checklistVerificacionComparendo';
import { derivarRequisitosFallo, requisitosFalloCumplidos } from './falloRequisitos';
import { TEXTO } from '@/theme/escala';

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
  confirmar_actividad: {
    estado: 'archivado',
    titulo: 'Confirmar actividad pedagógica y archivar',
    descripcion:
      'Confirma la asistencia y cumplimiento de la actividad pedagógica o programa comunitario (Sispaz). El expediente se archiva.',
    exito: 'Actividad pedagógica confirmada. Expediente archivado.',
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
  const subirDocumento = useUploadCaseDocument(id);
  const inspeccion = useInspeccionStore((s) => s.config);
  // Datos jurídicos ya capturados en actuaciones anteriores del mismo
  // expediente (bienJuridico, medidasCorrectivas, descargos, pruebas…) se
  // recuerdan aquí para no pedirlos de nuevo en cada modal.
  const meta = parseCaseMetadata<Partial<ComparendoMetadata>>(caseMetadata ?? null);
  // Catálogo normativo por articuloNumeral (src/derecho/catalogoComportamientos.ts)
  // — única fuente del fallback cuando el expediente no trae descripcionConducta/
  // bienJuridico/medidasCorrectivas propios (radicaciones previas a esta catalogación).
  const catalogoComportamiento = caso ? buscarComportamiento(caso.articuloNumeral) : undefined;

  function transicionar(nuevoEstado: EstadoComparendo, metaExtra?: Record<string, unknown>, exito?: string) {
    cambiarEstado.mutate(
      { id, state: nuevoEstado },
      {
        onSuccess: () => {
          if (metaExtra) {
            const metaActual = parseCaseMetadata<Record<string, unknown>>(caseMetadata ?? null);
            actualizarCampos.mutate(
              { id, fields: { caseMetadata: buildCaseMetadata({ ...metaActual, ...metaExtra }) } },
              {
                onError: () =>
                  message.error('El estado cambió pero los datos del paso no se guardaron — reintenta desde el detalle'),
              },
            );
          }
          if (exito) message.success(exito);
        },
        onError: () => message.error('No se pudo actualizar el estado del expediente.'),
      },
    );
  }

  // ── Modal genérico de confirmación (acciones sin metadata propia) ────────
  const [modalSimple, setModalSimple] = useState<AccionComparendoTipo | null>(null);

  // ── Verificar comparendo — checklist de verificación humana tickable ─────
  const [modalVerificacion, setModalVerificacion] = useState(false);
  const [itemsVerificados, setItemsVerificados] = useState<Record<string, boolean>>({});
  const verificacionCompleta = CHECKLIST_VERIFICACION_COMPARENDO.every((item) => itemsVerificados[item.key]);

  // ── Citar / reagendar audiencia / admitir justa causa ─────────────────────
  const [modalAudiencia, setModalAudiencia] = useState<
    'avocar_y_citar_audiencia' | 'reagendar_audiencia' | 'admitir_justa_causa' | null
  >(null);
  const [fechaAudiencia, setFechaAudiencia] = useState<Dayjs | null>(null);
  const [horaAudiencia, setHoraAudiencia] = useState<Dayjs | null>(null);
  const [lugarAudiencia, setLugarAudiencia] = useState('');
  const [medioNotificacionAutorizado, setMedioNotificacionAutorizado] = useState('');

  // ── Constancia de inasistencia a audiencia (auto-inasistencia.yaml) ──────
  const [modalInasistenciaAuto, setModalInasistenciaAuto] = useState(false);

  // ── Decretar pruebas y suspender ───────────────────────────────────────────
  const [modalPruebas, setModalPruebas] = useState(false);
  const [pruebasDecretadas, setPruebasDecretadas] = useState<string[]>([]);
  const [fechaReanudacion, setFechaReanudacion] = useState<Dayjs | null>(null);

  // ── Datos jurídicos del comportamiento — compartidos por decretar_pruebas /
  //    constancia_inasistencia / emitir_fallo / fallo_por_inasistencia /
  //    terminar_por_inactividad; se piden una vez y se recuerdan. ───────────
  const [bienJuridico, setBienJuridico] = useState('');
  const [medidasCorrectivas, setMedidasCorrectivas] = useState('');
  const [apeloSiNo, setApeloSiNo] = useState<'SI' | 'NO'>('NO');
  const [descargos, setDescargos] = useState('');

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
  // Discriminador real de fallo-comparendo.yaml — distinto del rótulo libre `variante` de arriba.
  const [varianteFallo, setVarianteFallo] = useState<VarianteFallo | ''>('');
  const [pruebasPracticadas, setPruebasPracticadas] = useState<string[]>([]);
  const [fechaAudienciaAnterior, setFechaAudienciaAnterior] = useState<Dayjs | null>(null);
  const [aplicaActividadPedagogica, setAplicaActividadPedagogica] = useState(false);
  const [cuentaRecaudo, setCuentaRecaudo] = useState('');
  const [titularCuenta, setTitularCuenta] = useState('');
  const [nitTitular, setNitTitular] = useState('');

  // ── Terminar por inactividad (fallo-comparendo.yaml, terminacion_inactividad) ──
  const [modalTerminacionInactividad, setModalTerminacionInactividad] = useState(false);
  const [comparecioVoluntariamente, setComparecioVoluntariamente] = useState(false);
  const [terminoActividadPedagogica, setTerminoActividadPedagogica] = useState('dos (2) meses');

  // ── Resolver recursos ──────────────────────────────────────────────────────
  const [modalResolucion, setModalResolucion] = useState(false);
  const [resolucionRecurso, setResolucionRecurso] = useState<'confirma' | 'revoca_absuelve' | 'modifica' | null>(null);

  // ── Generar acta de firmeza ────────────────────────────────────────────────
  const [modalActaFirmeza, setModalActaFirmeza] = useState(false);

  // ── Constancias de incumplimiento (pronto pago / actividad pedagógica) ────
  const [modalIncumplimientoPago, setModalIncumplimientoPago] = useState(false);
  const [documentoCobro, setDocumentoCobro] = useState('');
  const [modalIncumplimientoActividad, setModalIncumplimientoActividad] = useState(false);
  const [firmanteNombre, setFirmanteNombre] = useState('');
  const [firmanteRol, setFirmanteRol] = useState('Auxiliar Administrativo');

  // ── Previsualización + incorporación al expediente, compartida por todas
  //    las actuaciones que producen un DocumentoLegal (Task 10 + 11): genera
  //    el PDF, se previsualiza con PdfViewer y, al confirmar, se sube con
  //    useUploadCaseDocument ANTES de aplicar la transición de estado. ──────
  const [previa, setPrevia] = useState<{ blob: Blob; nombreArchivo: string; alConfirmar: () => void } | null>(null);
  const [generandoPrevia, setGenerandoPrevia] = useState(false);

  async function generarYPrevisualizar(documento: DocumentoLegal, nombreArchivo: string, alConfirmar: () => void) {
    setGenerandoPrevia(true);
    try {
      const blob = await generarDocumentoLegalBlob(documento, inspeccion.membreteDataUrl);
      setPrevia({ blob, nombreArchivo, alConfirmar });
    } catch {
      message.error('No se pudo generar el documento. Intente de nuevo.');
    } finally {
      setGenerandoPrevia(false);
    }
  }

  function confirmarPrevia() {
    if (!previa) return;
    const archivo = new File([previa.blob], previa.nombreArchivo, { type: 'application/pdf' });
    subirDocumento.mutate(archivo, {
      onSuccess: () => {
        message.success('Documento incorporado al expediente.');
        previa.alConfirmar();
        setPrevia(null);
      },
      onError: () => message.error('No se pudo incorporar el documento al expediente. Intente de nuevo.'),
    });
  }

  const pendiente = cambiarEstado.isPending || actualizarCampos.isPending;

  // ── Validación del modal de fallo — habilita el OK solo con los datos
  //    mínimos exigidos por la variante seleccionada (fallo-comparendo.yaml),
  //    derivados por el helper puro falloRequisitos.ts (Task 17) y mostrados
  //    en vivo como checklist visual dentro del modal. ───────────────────────
  const requisitosFallo = derivarRequisitosFallo({
    modalFallo,
    sentido,
    varianteFallo,
    cuentaRecaudo,
    titularCuenta,
    nitTitular,
    tieneFechaAudienciaAnterior: Boolean(fechaAudienciaAnterior),
  });
  const modalFalloDeshabilitado = !requisitosFalloCumplidos(requisitosFallo);
  // Advertencia informativa (no bloqueante): el OKF solo modela sanciona_continuacion
  // — si se sanciona sin que el expediente registre una suspensión previa
  // (decretar_pruebas / constancia_inasistencia), el fallo narrará una
  // audiencia anterior que nunca ocurrió.
  const avisoSancionSinAudienciaPrevia =
    modalFallo === 'emitir_fallo' && sentido === 'sanciona' && !meta.fechaAudienciaAnterior;

  const ejecutar = (tipo: AccionComparendoTipo) => {
    switch (tipo) {
      case 'verificar_comparendo':
        setItemsVerificados({});
        return setModalVerificacion(true);
      case 'avocar_y_citar_audiencia':
      case 'reagendar_audiencia':
      case 'admitir_justa_causa':
        setFechaAudiencia(null);
        setHoraAudiencia(null);
        setLugarAudiencia('');
        setMedioNotificacionAutorizado(meta.medioNotificacionAutorizado || '');
        return setModalAudiencia(tipo);
      case 'decretar_pruebas':
        setPruebasDecretadas([]);
        setFechaReanudacion(null);
        setBienJuridico(meta.bienJuridico || catalogoComportamiento?.bienJuridico || '');
        setMedidasCorrectivas(meta.medidasCorrectivas || catalogoComportamiento?.medidasCorrectivas || '');
        setApeloSiNo(meta.apeloSiNo || 'NO');
        setDescargos(meta.descargos || '');
        return setModalPruebas(true);
      case 'constancia_inasistencia':
        setBienJuridico(meta.bienJuridico || catalogoComportamiento?.bienJuridico || '');
        setMedidasCorrectivas(meta.medidasCorrectivas || catalogoComportamiento?.medidasCorrectivas || '');
        return setModalInasistenciaAuto(true);
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
        setVarianteFallo(tipo === 'fallo_por_inasistencia' ? 'inasistencia' : '');
        setPruebasPracticadas(meta.pruebasDecretadas || []);
        // Preferir el marcador dedicado; fechaAudiencia queda como fallback para
        // expedientes suspendidos antes de que existiera fechaAudienciaAnterior.
        setFechaAudienciaAnterior(
          meta.fechaAudienciaAnterior
            ? dayjs(meta.fechaAudienciaAnterior)
            : meta.fechaAudiencia
              ? dayjs(meta.fechaAudiencia)
              : null,
        );
        setBienJuridico(meta.bienJuridico || catalogoComportamiento?.bienJuridico || '');
        setMedidasCorrectivas(meta.medidasCorrectivas || catalogoComportamiento?.medidasCorrectivas || '');
        setApeloSiNo(meta.apeloSiNo || 'NO');
        setDescargos(meta.descargos || '');
        setAplicaActividadPedagogica(false);
        setCuentaRecaudo(meta.cuentaRecaudo || '');
        setTitularCuenta(meta.titularCuenta || '');
        setNitTitular(meta.nitTitular || '');
        return setModalFallo(tipo);
      case 'terminar_por_inactividad':
        setBienJuridico(meta.bienJuridico || catalogoComportamiento?.bienJuridico || '');
        setMedidasCorrectivas(meta.medidasCorrectivas || catalogoComportamiento?.medidasCorrectivas || '');
        setApeloSiNo(meta.apeloSiNo || 'NO');
        setComparecioVoluntariamente(false);
        setTerminoActividadPedagogica('dos (2) meses');
        return setModalTerminacionInactividad(true);
      case 'constancia_incumplimiento_pago':
        setDocumentoCobro('');
        return setModalIncumplimientoPago(true);
      case 'constancia_incumplimiento_actividad':
        setFirmanteNombre('');
        setFirmanteRol('Auxiliar Administrativo');
        return setModalIncumplimientoActividad(true);
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
    void descargarDocumentoLegalPdf(actaFirmezaComoDocumento(acta), inspeccion.membreteDataUrl).catch(
      () => undefined,
    );
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

  // ── Datos comunes del despacho, reutilizados por todos los generadores ────
  function datosDespacho() {
    return {
      municipio: inspeccion.municipio || 'Manizales',
      inspeccion: inspeccion.inspeccion || 'Inspección Permanente de Convivencia y Paz',
      inspectorNombre: inspeccion.inspectorNombre || 'Inspector de Convivencia y Paz',
      inspectorRol: 'Inspector Permanente de Convivencia y Paz',
    };
  }

  // El medio de impugnación registrado admite valores libres (registrar_impugnacion);
  // el generador solo distingue personal vs. correo electrónico — todo lo demás
  // (escrito, verbal, otro) se trata como comparecencia personal ante el despacho.
  function datosAutoAvoca(): Parameters<typeof generarAutoAvocaCitaAudiencia>[0] | null {
    if (!caso || !fechaAudiencia || !horaAudiencia) return null;
    return {
      ...datosDespacho(),
      fechaResolucion: dayjs().format('YYYY-MM-DD'),
      proceso: caso.radicado,
      comparendo: caso.numeroComparendo,
      fechaComparendo: caso.fechaComparendo,
      articuloNumeral: caso.articuloNumeral,
      solicitado: caso.infractor,
      cedulaSolicitado: caso.cedula,
      medioImpugnacion: meta.medioImpugnacion === 'correo_electronico' ? 'correo_electronico' : 'personal',
      fechaAudiencia: fechaAudiencia.format('YYYY-MM-DD'),
      horaAudiencia: horaAudiencia.format('hh:mm a'),
      lugarAudiencia,
      medioNotificacionAutorizado: medioNotificacionAutorizado || undefined,
    };
  }

  function datosAutoDecretaPruebas(): Parameters<typeof generarAutoDecretaPruebasSuspende>[0] | null {
    if (!caso || pruebasDecretadas.length === 0 || !fechaReanudacion) return null;
    return {
      ...datosDespacho(),
      fechaResolucion: dayjs().format('YYYY-MM-DD'),
      proceso: caso.radicado,
      comparendo: caso.numeroComparendo,
      articuloNumeral: caso.articuloNumeral,
      fechaComparendo: caso.fechaComparendo,
      lugarComportamiento: caso.lugar,
      solicitado: caso.infractor,
      cedulaSolicitado: caso.cedula,
      direccionSolicitado: caso.direccion,
      telefonoSolicitado: caso.telefono,
      solicitante: caso.solicitante,
      tipoMulta: caso.tipoMulta,
      hechos: caso.hechos,
      descripcionConducta: caso.descripcionConducta || catalogoComportamiento?.descripcionConducta || '(no registrado)',
      bienJuridico,
      medidasCorrectivas,
      apeloSiNo,
      descargos,
      pruebasDecretadas,
      fechaReanudacion: fechaReanudacion.format('YYYY-MM-DD'),
    };
  }

  function datosAutoInasistencia(): Parameters<typeof generarAutoInasistencia>[0] | null {
    if (!caso) return null;
    return {
      ...datosDespacho(),
      fechaResolucion: dayjs().format('YYYY-MM-DD'),
      horaAudiencia: meta.horaAudiencia || 'NO REGISTRA',
      proceso: caso.radicado,
      comparendo: caso.numeroComparendo,
      articuloNumeral: caso.articuloNumeral,
      fechaComparendo: caso.fechaComparendo,
      lugarComportamiento: caso.lugar,
      solicitado: caso.infractor,
      cedulaSolicitado: caso.cedula,
      direccionSolicitado: caso.direccion,
      telefonoSolicitado: caso.telefono,
      solicitante: caso.solicitante,
      hechos: caso.hechos,
      descripcionConducta: caso.descripcionConducta || catalogoComportamiento?.descripcionConducta || '(no registrado)',
      bienJuridico,
      medidasCorrectivas,
      medioNotificacionAutorizado: meta.medioNotificacionAutorizado,
      fechaNotificacionPrevia: meta.fechaAudiencia || dayjs().format('YYYY-MM-DD'),
    };
  }

  function datosFallo(v: VarianteFallo): Parameters<typeof generarFalloComparendo>[0] | null {
    if (!caso) return null;
    return {
      ...datosDespacho(),
      fechaResolucion: dayjs().format('YYYY-MM-DD'),
      proceso: caso.radicado,
      comparendo: caso.numeroComparendo,
      articuloNumeral: caso.articuloNumeral,
      fechaComparendo: caso.fechaComparendo,
      lugarComportamiento: caso.lugar,
      solicitado: caso.infractor,
      cedulaSolicitado: caso.cedula,
      direccionSolicitado: caso.direccion,
      telefonoSolicitado: caso.telefono,
      solicitante: caso.solicitante,
      hechos: caso.hechos,
      descripcionConducta: caso.descripcionConducta || catalogoComportamiento?.descripcionConducta || '(no registrado)',
      bienJuridico,
      medidasCorrectivas,
      apeloSiNo,
      tipoMulta: caso.tipoMulta,
      descargos,
      pruebasPracticadas,
      variante: v,
      fechaAudienciaAnterior: fechaAudienciaAnterior ? fechaAudienciaAnterior.format('YYYY-MM-DD') : undefined,
      aplicaActividadPedagogica,
      cuentaRecaudo,
      titularCuenta,
      nitTitular,
      comparecioVoluntariamente,
      terminoActividadPedagogica,
    };
  }

  function datosConstanciaPago(): Parameters<typeof generarConstanciaIncumplimientoProntoPago>[0] | null {
    if (!caso || !documentoCobro) return null;
    return {
      ...datosDespacho(),
      fechaResolucion: dayjs().format('YYYY-MM-DD'),
      proceso: caso.radicado,
      comparendo: caso.numeroComparendo,
      fechaComparendo: caso.fechaComparendo,
      tipoMulta: caso.tipoMulta,
      solicitado: caso.infractor,
      cedulaSolicitado: caso.cedula,
      documentoCobro,
    };
  }

  function datosConstanciaActividad(): Parameters<typeof generarConstanciaIncumplimientoActividadPedagogica>[0] | null {
    if (!caso || !firmanteNombre || !firmanteRol) return null;
    return {
      municipio: inspeccion.municipio || 'Manizales',
      inspeccion: inspeccion.inspeccion || 'Inspección Permanente de Convivencia y Paz',
      firmanteNombre,
      firmanteRol,
      fechaResolucion: dayjs().format('YYYY-MM-DD'),
      proceso: caso.radicado,
      comparendo: caso.numeroComparendo,
      solicitado: caso.infractor,
      cedulaSolicitado: caso.cedula,
    };
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
        <Text type="secondary" style={{ fontSize: TEXTO.nota, letterSpacing: '0.09em', fontWeight: 600 }}>
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

      {/* Verificar comparendo — checklist de verificación humana tickable */}
      <Modal
        open={modalVerificacion}
        title="Verificar comparendo"
        okText="Confirmar verificación"
        cancelText="Cancelar"
        okButtonProps={{ disabled: !verificacionCompleta, loading: pendiente }}
        onCancel={() => setModalVerificacion(false)}
        onOk={() => {
          setModalVerificacion(false);
          transicionar('verificado', undefined, 'Comparendo verificado.');
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          <Text type="secondary">
            Marque cada punto del checklist de verificación humana antes de darle trámite al comparendo.
          </Text>
          <ChecklistVisual
            items={CHECKLIST_VERIFICACION_COMPARENDO.map((item) => ({
              key: item.key,
              label: item.label,
              done: Boolean(itemsVerificados[item.key]),
              onToggle: (key) => setItemsVerificados((prev) => ({ ...prev, [key]: !prev[key] })),
            }))}
            showSummary
          />
        </Space>
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
        okText={modalAudiencia === 'avocar_y_citar_audiencia' ? 'Generar auto y previsualizar' : 'Confirmar citación'}
        cancelText="Cancelar"
        okButtonProps={{ disabled: !fechaAudiencia || !horaAudiencia || !lugarAudiencia, loading: pendiente || generandoPrevia }}
        onCancel={() => setModalAudiencia(null)}
        onOk={() => {
          const origen = modalAudiencia;
          const metaExtra = {
            fechaAudiencia: fechaAudiencia?.format('YYYY-MM-DD'),
            horaAudiencia: horaAudiencia?.format('HH:mm'),
            lugarAudiencia,
            ...(origen === 'avocar_y_citar_audiencia' ? { medioNotificacionAutorizado } : {}),
          };
          if (origen === 'avocar_y_citar_audiencia') {
            const datos = datosAutoAvoca();
            if (!datos) return;
            const auto = generarAutoAvocaCitaAudiencia(datos);
            setModalAudiencia(null);
            void generarYPrevisualizar(auto, `Auto avoca y cita audiencia ${caso?.radicado}.pdf`, () =>
              transicionar('audiencia_programada', metaExtra, 'Audiencia señalada.'),
            );
            return;
          }
          setModalAudiencia(null);
          transicionar(
            'audiencia_programada',
            metaExtra,
            origen === 'reagendar_audiencia' ? 'Audiencia reagendada.' : 'Justa causa admitida. Audiencia reprogramada.',
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
          {modalAudiencia === 'avocar_y_citar_audiencia' && (
            <Input
              placeholder="Medio de notificación autorizado (correo y/o WhatsApp) — opcional"
              value={medioNotificacionAutorizado}
              onChange={(e) => setMedioNotificacionAutorizado(e.target.value)}
            />
          )}
          <ChecklistVisual
            items={[
              { key: 'fecha', label: 'Fecha de la audiencia', done: Boolean(fechaAudiencia) },
              { key: 'hora', label: 'Hora de la audiencia', done: Boolean(horaAudiencia) },
              { key: 'lugar', label: 'Lugar de la audiencia', done: Boolean(lugarAudiencia) },
            ]}
          />
        </Space>
      </Modal>

      {/* Constancia de inasistencia a audiencia */}
      <Modal
        open={modalInasistenciaAuto}
        title="Dejar constancia de inasistencia"
        okText="Generar auto y previsualizar"
        cancelText="Cancelar"
        okButtonProps={{ loading: pendiente || generandoPrevia }}
        onCancel={() => setModalInasistenciaAuto(false)}
        onOk={() => {
          const datos = datosAutoInasistencia();
          if (!datos) return;
          const auto = generarAutoInasistencia(datos);
          setModalInasistenciaAuto(false);
          void generarYPrevisualizar(auto, `Auto inasistencia ${caso?.radicado}.pdf`, () =>
            transicionar(
              'suspendida_inasistencia',
              {
                bienJuridico,
                medidasCorrectivas,
                // fechaAudiencia se reutiliza como "fecha de la audiencia previa" —
                // insumo de fallo_por_inasistencia (fechaAudienciaAnterior).
                fechaAudiencia: dayjs().format('YYYY-MM-DD'),
                // Marcador explícito: la audiencia que queda suspendida por esta
                // inasistencia es la que hasta ahora registraba meta.fechaAudiencia.
                fechaAudienciaAnterior: meta.fechaAudiencia,
              },
              'Constancia de inasistencia registrada.',
            ),
          );
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          <Alert
            type="warning"
            showIcon
            message="El citado no compareció dentro de los quince (15) minutos de espera"
            description="Se suspende la audiencia por tres (3) días hábiles para acreditar justa causa (Sentencia C-349/2017)."
          />
          <Input
            placeholder="Bien jurídico protegido (p. ej. afectan la relación entre personas y autoridades)"
            value={bienJuridico}
            onChange={(e) => setBienJuridico(e.target.value)}
          />
          <Input
            placeholder="Medidas correctivas previstas (p. ej. Multa General tipo 4)"
            value={medidasCorrectivas}
            onChange={(e) => setMedidasCorrectivas(e.target.value)}
          />
        </Space>
      </Modal>

      {/* Decretar pruebas y suspender */}
      <Modal
        open={modalPruebas}
        title="Decretar pruebas y suspender"
        okText="Generar auto y previsualizar"
        cancelText="Cancelar"
        okButtonProps={{ disabled: pruebasDecretadas.length === 0 || !fechaReanudacion, loading: pendiente || generandoPrevia }}
        onCancel={() => setModalPruebas(false)}
        onOk={() => {
          const datos = datosAutoDecretaPruebas();
          if (!datos) return;
          const auto = generarAutoDecretaPruebasSuspende(datos);
          setModalPruebas(false);
          void generarYPrevisualizar(auto, `Auto decreta pruebas ${caso?.radicado}.pdf`, () =>
            transicionar(
              'suspendida_pruebas',
              {
                pruebasDecretadas,
                fechaReanudacion: fechaReanudacion?.format('YYYY-MM-DD'),
                bienJuridico,
                medidasCorrectivas,
                apeloSiNo,
                descargos,
                // fechaAudiencia se reutiliza como "fecha de la audiencia previa
                // que decretó pruebas" — insumo de las variantes *_continuacion.
                fechaAudiencia: dayjs().format('YYYY-MM-DD'),
                // Marcador explícito: la audiencia que queda suspendida por este
                // decreto de pruebas es la que hasta ahora registraba meta.fechaAudiencia.
                fechaAudienciaAnterior: meta.fechaAudiencia,
              },
              'Pruebas decretadas. Audiencia suspendida.',
            ),
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
          <Input
            placeholder="Bien jurídico protegido (p. ej. afectan la relación entre personas y autoridades)"
            value={bienJuridico}
            onChange={(e) => setBienJuridico(e.target.value)}
          />
          <Input
            placeholder="Medidas correctivas previstas (p. ej. Multa General tipo 4)"
            value={medidasCorrectivas}
            onChange={(e) => setMedidasCorrectivas(e.target.value)}
          />
          <Radio.Group value={apeloSiNo} onChange={(e) => setApeloSiNo(e.target.value)}>
            <Radio value="NO">No apeló la medida accesoria ante la Policía</Radio>
            <Radio value="SI">Sí apeló la medida accesoria ante la Policía</Radio>
          </Radio.Group>
          <Input.TextArea
            rows={3}
            placeholder="Resumen de los argumentos y pruebas anunciadas por el solicitado en la diligencia"
            value={descargos}
            onChange={(e) => setDescargos(e.target.value)}
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
        width={640}
        title={modalFallo === 'fallo_por_inasistencia' ? 'Resolver de fondo por inasistencia' : 'Emitir fallo en audiencia'}
        okText="Generar fallo y previsualizar"
        cancelText="Cancelar"
        okButtonProps={{
          disabled: modalFalloDeshabilitado,
          loading: pendiente || generandoPrevia,
        }}
        onCancel={() => setModalFallo(null)}
        onOk={() => {
          const v: VarianteFallo | '' = modalFallo === 'fallo_por_inasistencia' ? 'inasistencia' : varianteFallo;
          if (!v) return;
          const datos = datosFallo(v);
          if (!datos) return;
          const fallo = generarFalloComparendo(datos);
          setModalFallo(null);
          void generarYPrevisualizar(fallo, `Fallo comparendo ${caso?.radicado}.pdf`, () =>
            transicionar(
              'fallo_emitido',
              {
                sentido: modalFallo === 'fallo_por_inasistencia' ? 'sanciona' : sentido,
                variante,
                varianteFallo: v,
                bienJuridico,
                medidasCorrectivas,
                apeloSiNo,
                descargos,
                cuentaRecaudo,
                titularCuenta,
                nitTitular,
              },
              v === 'sanciona_continuacion' || v === 'inasistencia'
                ? 'Fallo emitido: se impone medida correctiva.'
                : 'Fallo emitido: se absuelve al citado.',
            ),
          );
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          {requisitosFallo.length > 0 && (
            <div
              style={{
                background: PALETA.fondo,
                borderRadius: 12,
                padding: '10px 14px',
                border: `1px solid ${PALETA.borde}`,
              }}
            >
              <ChecklistVisual
                items={requisitosFallo.map((r) => ({ key: r.key, label: r.label, done: r.cumplido }))}
                showSummary
              />
            </div>
          )}
          {modalFallo === 'emitir_fallo' && (
            <>
              <Text>¿Cuál es el sentido de la decisión?</Text>
              <Radio.Group
                value={sentido}
                onChange={(e) => {
                  const s = e.target.value as 'absuelve' | 'sanciona';
                  setSentido(s);
                  // La variante única (sin suspensión previa) solo existe para absolver;
                  // sancionar directo del primer fallo no está modelado en el OKF — se
                  // trata como sanciona_continuacion (ver concerns del reporte).
                  setVarianteFallo(
                    s === 'sanciona' ? 'sanciona_continuacion' : fechaAudienciaAnterior ? 'absuelve_continuacion' : 'absuelve_unica',
                  );
                }}
              >
                <Space direction="vertical">
                  <Radio value="absuelve">Absuelve al citado</Radio>
                  <Radio value="sanciona">Sanciona con medida correctiva</Radio>
                </Space>
              </Radio.Group>
              {sentido === 'absuelve' && (
                <Radio.Group value={varianteFallo} onChange={(e) => setVarianteFallo(e.target.value)}>
                  <Space direction="vertical">
                    <Radio value="absuelve_unica">Audiencia única, sin suspensión previa</Radio>
                    <Radio value="absuelve_continuacion">Continuación de audiencia suspendida por pruebas</Radio>
                  </Space>
                </Radio.Group>
              )}
              {avisoSancionSinAudienciaPrevia && (
                <Alert
                  type="warning"
                  showIcon
                  message="Sanción sin audiencia previa registrada"
                  description="El OKF aún no modela una variante de sanción en audiencia única: el documento narrará una audiencia anterior que decretó pruebas y suspendió el trámite, pero el expediente no tiene registrada esa audiencia previa. Verifique la fecha de la audiencia previa antes de continuar."
                />
              )}
              <div>
                <Text style={{ display: 'block', marginBottom: 6 }}>
                  Nota de la decisión (medida impuesta o motivo de la absolución, para el historial):
                </Text>
                <TextArea
                  rows={2}
                  value={variante}
                  onChange={(e) => setVariante(e.target.value)}
                  placeholder="Ej.: Multa general tipo 2 con incremento del 75% por reiteración…"
                />
              </div>
            </>
          )}

          <Input
            placeholder="Bien jurídico protegido"
            value={bienJuridico}
            onChange={(e) => setBienJuridico(e.target.value)}
          />
          <Input
            placeholder="Medidas correctivas previstas para el comportamiento"
            value={medidasCorrectivas}
            onChange={(e) => setMedidasCorrectivas(e.target.value)}
          />
          <Radio.Group value={apeloSiNo} onChange={(e) => setApeloSiNo(e.target.value)}>
            <Radio value="NO">No apeló la medida accesoria</Radio>
            <Radio value="SI">Sí apeló la medida accesoria</Radio>
          </Radio.Group>

          {(varianteFallo === 'absuelve_continuacion' || varianteFallo === 'sanciona_continuacion' || modalFallo === 'fallo_por_inasistencia') && (
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder="Fecha de la audiencia previa (decretó pruebas / constató inasistencia)"
              value={fechaAudienciaAnterior}
              onChange={setFechaAudienciaAnterior}
            />
          )}

          {modalFallo === 'emitir_fallo' && sentido === 'absuelve' && varianteFallo === 'absuelve_unica' && (
            <Checkbox
              checked={aplicaActividadPedagogica}
              onChange={(e) => setAplicaActividadPedagogica(e.target.checked)}
            >
              Se aplica actividad pedagógica de convivencia en reemplazo de la multa
            </Checkbox>
          )}

          {modalFallo === 'emitir_fallo' && (
            <>
              <Text type="secondary" style={{ display: 'block' }}>
                Argumentos y pruebas practicadas por el solicitado en audiencia:
              </Text>
              <Input.TextArea
                rows={2}
                placeholder="Resumen de los descargos"
                value={descargos}
                onChange={(e) => setDescargos(e.target.value)}
              />
            </>
          )}

          {modalFallo === 'emitir_fallo' && (
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Pruebas incorporadas y practicadas…"
              value={pruebasPracticadas}
              onChange={setPruebasPracticadas}
              tokenSeparators={[',']}
            />
          )}

          {(varianteFallo === 'sanciona_continuacion' || modalFallo === 'fallo_por_inasistencia') && (
            <>
              <Alert
                type="info"
                showIcon
                message="Datos de recaudo de la multa"
                description="Cuenta oficial de recaudo del municipio — nunca se hardcodea en el documento. Se pregunta aquí, por fallo, hasta que exista una fuente confiable de oficina."
              />
              {/* Único punto donde se piden estos datos hoy (ver caseMetadata.cuentaRecaudo/titularCuenta/nitTitular).
                  Futuro: parsear la plantilla de fallo que suba el inspector en Ajustes > Despacho en vez de config. */}
              <Input
                placeholder="Cuenta de recaudo (banco, tipo y número)"
                value={cuentaRecaudo}
                onChange={(e) => setCuentaRecaudo(e.target.value)}
              />
              <Input
                placeholder="Titular de la cuenta (municipio)"
                value={titularCuenta}
                onChange={(e) => setTitularCuenta(e.target.value)}
              />
              <Input placeholder="NIT del titular" value={nitTitular} onChange={(e) => setNitTitular(e.target.value)} />
            </>
          )}
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

      {/* Terminar por inactividad */}
      <Modal
        open={modalTerminacionInactividad}
        width={600}
        title="Terminar por inactividad"
        okText="Generar decisión y previsualizar"
        cancelText="Cancelar"
        okButtonProps={{ loading: pendiente || generandoPrevia }}
        onCancel={() => setModalTerminacionInactividad(false)}
        onOk={() => {
          const datos = datosFallo('terminacion_inactividad');
          if (!datos) return;
          const fallo = generarFalloComparendo(datos);
          setModalTerminacionInactividad(false);
          void generarYPrevisualizar(fallo, `Terminación por inactividad ${caso?.radicado}.pdf`, () =>
            transicionar(
              'terminado_inactividad',
              { bienJuridico, medidasCorrectivas, apeloSiNo, comparecioVoluntariamente, terminoActividadPedagogica },
              'Trámite terminado por inactividad procesal.',
            ),
          );
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          <Alert
            type="info"
            showIcon
            message="Inactividad procesal superior a un (1) año"
            description="Art. 2.2.8.18.9.4, Decreto 768 de 2025 — ausencia de decisión de fondo dentro del expediente."
          />
          <Checkbox
            checked={comparecioVoluntariamente}
            onChange={(e) => setComparecioVoluntariamente(e.target.checked)}
          >
            El ciudadano compareció voluntariamente solicitando resolver su situación
          </Checkbox>
          {comparecioVoluntariamente && (
            <>
              <Text type="secondary">
                Se ejerce control de legalidad y se sustituye la multa por actividad pedagógica.
              </Text>
              <Input
                placeholder="Término para acreditar la actividad pedagógica (p. ej. dos (2) meses)"
                value={terminoActividadPedagogica}
                onChange={(e) => setTerminoActividadPedagogica(e.target.value)}
              />
            </>
          )}
          <Input
            placeholder="Bien jurídico protegido"
            value={bienJuridico}
            onChange={(e) => setBienJuridico(e.target.value)}
          />
          <Input
            placeholder="Medidas correctivas previstas para el comportamiento"
            value={medidasCorrectivas}
            onChange={(e) => setMedidasCorrectivas(e.target.value)}
          />
        </Space>
      </Modal>

      {/* Constancia de incumplimiento de pronto pago */}
      <Modal
        open={modalIncumplimientoPago}
        title="Constancia de incumplimiento de pronto pago"
        okText="Generar constancia y previsualizar"
        cancelText="Cancelar"
        okButtonProps={{ disabled: !documentoCobro, loading: pendiente || generandoPrevia }}
        onCancel={() => setModalIncumplimientoPago(false)}
        onOk={() => {
          const datos = datosConstanciaPago();
          if (!datos) return;
          const constancia = generarConstanciaIncumplimientoProntoPago(datos);
          setModalIncumplimientoPago(false);
          void generarYPrevisualizar(constancia, `Constancia incumplimiento pago ${caso?.radicado}.pdf`, () =>
            transicionar('incumplimiento_constatado', { documentoCobro }, 'Incumplimiento de pronto pago constatado.'),
          );
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          <Alert
            type="warning"
            showIcon
            message="No se allegó soporte de pago dentro del término"
            description="Se remitirá el expediente a la Unidad de Recursos Tributarios para cobro coactivo por el valor total."
          />
          <Input
            placeholder="Número del documento de cobro expedido"
            value={documentoCobro}
            onChange={(e) => setDocumentoCobro(e.target.value)}
          />
        </Space>
      </Modal>

      {/* Constancia de inasistencia a actividad pedagógica */}
      <Modal
        open={modalIncumplimientoActividad}
        title="Constancia de inasistencia a actividad pedagógica"
        okText="Generar constancia y previsualizar"
        cancelText="Cancelar"
        okButtonProps={{ disabled: !firmanteNombre || !firmanteRol, loading: pendiente || generandoPrevia }}
        onCancel={() => setModalIncumplimientoActividad(false)}
        onOk={() => {
          const datos = datosConstanciaActividad();
          if (!datos) return;
          const constancia = generarConstanciaIncumplimientoActividadPedagogica(datos);
          setModalIncumplimientoActividad(false);
          void generarYPrevisualizar(constancia, `Constancia inasistencia actividad ${caso?.radicado}.pdf`, () =>
            transicionar('incumplimiento_constatado', { firmanteNombre, firmanteRol }, 'Inasistencia a actividad pedagógica constatada.'),
          );
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
          <Alert
            type="warning"
            showIcon
            message="No se acreditó la asistencia a la actividad pedagógica"
            description="Esta constancia la firma personal de la oficina (nunca el inspector por defecto)."
          />
          <Input
            placeholder="Nombre de quien firma (auxiliar administrativo)"
            value={firmanteNombre}
            onChange={(e) => setFirmanteNombre(e.target.value)}
          />
          <Input placeholder="Cargo de quien firma" value={firmanteRol} onChange={(e) => setFirmanteRol(e.target.value)} />
        </Space>
      </Modal>

      {/* Previsualización + incorporación del documento generado al expediente */}
      <Modal
        open={previa !== null}
        width={720}
        title="Previsualizar documento"
        okText="Incorporar al expediente y continuar"
        cancelText="Cancelar"
        okButtonProps={{ loading: subirDocumento.isPending }}
        onCancel={() => setPrevia(null)}
        onOk={confirmarPrevia}
      >
        {previa && (
          <div style={{ maxHeight: 560, overflowY: 'auto' }}>
            <PdfViewer archivo={previa.blob} />
          </div>
        )}
      </Modal>
    </>
  );
}
