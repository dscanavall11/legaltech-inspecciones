import { useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  DatePicker,
  Input,
  Segmented,
  Select,
  Spin,
  Tag,
  Typography,
  App,
} from 'antd';
import {
  DownloadOutlined,
  FileWordOutlined,
  FilePdfOutlined,
  PrinterOutlined,
  UploadOutlined,
  SearchOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  generarActaProntoPago,
  generarActaConmutacion,
  rutasDisponibles,
  liquidarProntoPago,
  liquidarMulta,
  TIPOS_CONMUTACION_PERMITIDOS,
  MULTA_GENERAL,
  type CausalIncremento,
  type DocumentoLegal,
  type RutaComparendo,
  type TipoMulta,
} from '@/derecho';
import {
  COMPARENDOS_DEMO,
  parsearBdComparendos,
  type Comparendo,
  type ReporteImportacion,
} from '@/features/actas/comparendos';
import { extraerComparendoPdf } from '@/features/actas/extraerComparendoPdf';
import { descargarDocumentoLegalPdf } from '@/shared/documentos/documentoLegalPdf';
import { descargarDocumentoLegalDocx } from '@/shared/documentos/documentoLegalDocx';
import { ExpedientePrevioButton } from '@/shared/documentos/ExpedientePrevioButton';
import { ReincidenciaCausalField } from '@/shared/components/ReincidenciaCausalField';
import { PdfViewer } from '@/shared/documentos/PdfViewer';
import { ELEVACION, PALETA } from '@/theme/theme';
import { useInspeccionStore } from '@/store/inspeccionStore';

const { Title, Text } = Typography;

const CLAVE_DESPACHO = 'pronto-pago:despacho';

type RutaCarga = 'pdf' | 'excel';
type RutaAcogida = 'pronto_pago' | 'conmutacion';

interface FormularioProntoPago {
  municipio: string;
  inspeccion: string;
  inspectorNombre: string;
  inspectorRol: string;
  proceso: string;
  fechaResolucion: string; // ISO
  comparendo: string;
  fechaComparendo: string; // ISO
  articuloNumeral: string;
  solicitado: string;
  cedula: string;
  direccion: string;
  telefono: string;
  solicitante: string;
  hechos: string;
  tipoMulta: TipoMulta;
  causal: CausalIncremento;
  causalEvidencia: string;
  // Pronto pago
  documentoCobro: string;
  // Conmutación
  actividadAsignada: string;
  entidadPrograma: string;
  fechaLimiteActividad: string; // ISO
}

const DATOS_INICIALES: FormularioProntoPago = {
  municipio: 'Manizales',
  inspeccion: 'Inspección Permanente de Convivencia y Paz Turno Uno',
  inspectorNombre: 'LUIS GABRIEL LADINO AYALA',
  inspectorRol: 'Inspector Permanente de Convivencia y Paz – Turno Uno',
  proceso: '',
  fechaResolucion: dayjs().format('YYYY-MM-DD'),
  comparendo: '',
  fechaComparendo: '',
  articuloNumeral: '',
  solicitado: '',
  cedula: '',
  direccion: '',
  telefono: '',
  solicitante: '',
  hechos: '',
  tipoMulta: 1,
  causal: 'ninguna',
  causalEvidencia: '',
  documentoCobro: '',
  actividadAsignada: 'Jornada pedagógica de convivencia ciudadana',
  entidadPrograma: '',
  fechaLimiteActividad: dayjs().add(30, 'day').format('YYYY-MM-DD'),
};

const RUTA_LABEL: Record<RutaComparendo, string> = {
  objecion: 'Objeción',
  pronto_pago: 'Pronto pago',
  conmutacion: 'Conmutación',
  firmeza: 'Firmeza',
};

function CampoActa({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: PALETA.textoSuave,
          marginBottom: 6,
          paddingLeft: 2,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Tarjeta({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: PALETA.superficie,
        borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        padding: '24px 28px',
        marginBottom: 24,
        border: `1px solid ${PALETA.borde}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Fila de valores base→incremento→subtotal→descuento→total, en pantalla y espejo del acta. */
function DesgloseValor({ ruta, tipoMulta, causal }: { ruta: RutaAcogida; tipoMulta: TipoMulta; causal: CausalIncremento }) {
  const esProntoPago = ruta === 'pronto_pago';
  const liqProntoPago = liquidarProntoPago(tipoMulta, causal);
  const liqBase = esProntoPago ? liqProntoPago : liquidarMulta(tipoMulta, causal);

  const filas: { etiqueta: string; valor: number }[] = [
    { etiqueta: `Multa tipo ${liqBase.tipo} (${liqBase.smdlvLetras} SMDLV)`, valor: liqBase.valorBase },
  ];
  if (liqBase.porcentajeIncremento > 0) {
    filas.push({ etiqueta: `Incremento por reincidencia (${liqBase.porcentajeIncremento}%)`, valor: liqBase.valorIncremento });
    filas.push({ etiqueta: 'Subtotal', valor: liqBase.valorTotal });
  }
  if (esProntoPago) {
    filas.push({ etiqueta: 'Descuento pronto pago (50%)', valor: -liqProntoPago.descuento });
  }
  const totalMostrado = esProntoPago ? liqProntoPago.valorAPagar : liqBase.valorTotal;

  return (
    <div style={{ background: '#eef4fa', borderRadius: 16, padding: '12px 16px' }}>
      {filas.map((f) => (
        <div key={f.etiqueta} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginTop: 4 }}>
          <Text type="secondary">{f.etiqueta}</Text>
          <Text>{f.valor < 0 ? '− ' : ''}$ {Math.abs(f.valor).toLocaleString('es-CO')}</Text>
        </div>
      ))}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 8,
          paddingTop: 8,
          borderTop: `1px solid ${PALETA.borde}`,
        }}
      >
        <Text strong>{esProntoPago ? 'Valor a pagar' : 'Valor de cobro si incumple la actividad'}</Text>
        <Text strong style={{ color: PALETA.azulOscuro }}>
          $ {totalMostrado.toLocaleString('es-CO')}
        </Text>
      </div>
    </div>
  );
}

export function ProntoPagoPage() {
  const { message } = App.useApp();
  const inspeccion = useInspeccionStore((s) => s.config);
  const [rutaCarga, setRutaCarga] = useState<RutaCarga>('pdf');
  const [datos, setDatos] = useState<FormularioProntoPago>(() => {
    const despacho = localStorage.getItem(CLAVE_DESPACHO);
    const base = despacho ? { ...DATOS_INICIALES, ...JSON.parse(despacho) } : DATOS_INICIALES;
    const store = useInspeccionStore.getState().config;
    return {
      ...base,
      municipio: store.municipio || base.municipio,
      inspectorNombre: store.inspectorNombre || base.inspectorNombre,
      inspeccion: store.inspeccion || base.inspeccion,
    };
  });
  const [bd, setBd] = useState<Comparendo[]>(COMPARENDOS_DEMO);
  const [origenBd, setOrigenBd] = useState<'demo' | 'archivo'>('demo');
  const [extrayendo, setExtrayendo] = useState(false);
  const [camposExtraidos, setCamposExtraidos] = useState<(keyof Comparendo)[]>([]);
  const [pdfEscaneado, setPdfEscaneado] = useState(false);
  const [archivoComparendo, setArchivoComparendo] = useState<File | null>(null);
  const [reporteImportacion, setReporteImportacion] = useState<ReporteImportacion | null>(null);
  const [tieneMultasPendientes, setTieneMultasPendientes] = useState(false);
  const [ruta, setRuta] = useState<RutaAcogida>('pronto_pago');
  const archivoBdRef = useRef<HTMLInputElement>(null);
  const archivoPdfRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof FormularioProntoPago>(k: K, v: FormularioProntoPago[K]) {
    setDatos((prev) => ({ ...prev, [k]: v }));
  }

  async function cargarComparendoPdf(archivo: File | undefined) {
    if (!archivo) return;
    setExtrayendo(true);
    setPdfEscaneado(false);
    setCamposExtraidos([]);
    setArchivoComparendo(archivo);
    try {
      const { datos: extraidos, camposDetectados, textoDisponible } = await extraerComparendoPdf(archivo);
      if (!textoDisponible) {
        setPdfEscaneado(true);
        return;
      }
      setDatos((prev) => ({ ...prev, ...extraidos }));
      setCamposExtraidos(camposDetectados);
      message.success(`Comparendo leído: ${camposDetectados.length} campos extraídos. Verifíquelos.`);
    } catch {
      message.error('No fue posible leer el PDF.');
    } finally {
      setExtrayendo(false);
      if (archivoPdfRef.current) archivoPdfRef.current.value = '';
    }
  }

  async function cargarExcel(archivo: File | undefined) {
    if (!archivo) return;
    try {
      const { comparendos: registros, reporte } = await parsearBdComparendos(archivo);
      setReporteImportacion(reporte);
      if (registros.length === 0) {
        message.warning('El archivo no contiene comparendos reconocibles.');
        return;
      }
      setBd(registros);
      setOrigenBd('archivo');
      message.success(`BD cargada: ${reporte.leidas.toLocaleString('es-CO')} comparendos.`);
    } catch {
      message.error('No fue posible leer el archivo.');
    } finally {
      if (archivoBdRef.current) archivoBdRef.current.value = '';
    }
  }

  function seleccionarComparendo(numero: string) {
    const c = bd.find((x) => x.comparendo === numero);
    if (!c) return;
    setCamposExtraidos([]);
    setDatos((prev) => ({
      ...prev,
      proceso: c.proceso,
      comparendo: c.comparendo,
      solicitado: c.solicitado,
      cedula: c.cedula,
      direccion: c.direccion,
      telefono: c.telefono,
      solicitante: c.solicitante,
      fechaComparendo: c.fechaComparendo,
      articuloNumeral: c.articuloNumeral,
      hechos: c.hechos,
      tipoMulta: c.tipoMulta,
      causal: c.causal,
    }));
  }

  const rutasHoy = useMemo(() => {
    if (!datos.fechaComparendo) return null;
    return rutasDisponibles(datos.tipoMulta, new Date(datos.fechaComparendo), new Date(), tieneMultasPendientes);
  }, [datos.fechaComparendo, datos.tipoMulta, tieneMultasPendientes]);

  const conmutacionPermitidaPorTipo = TIPOS_CONMUTACION_PERMITIDOS.includes(datos.tipoMulta);
  const rutaEfectiva: RutaAcogida = ruta === 'conmutacion' && !conmutacionPermitidaPorTipo ? 'pronto_pago' : ruta;

  const listoParaGenerar = Boolean(
    datos.comparendo && datos.solicitado && datos.cedula && datos.fechaComparendo && datos.proceso,
  );

  const acta: DocumentoLegal | null = useMemo(() => {
    if (!listoParaGenerar) return null;
    const comun = {
      municipio: datos.municipio,
      inspeccion: datos.inspeccion,
      inspectorNombre: datos.inspectorNombre,
      inspectorRol: datos.inspectorRol,
      proceso: datos.proceso,
      fechaResolucion: datos.fechaResolucion,
      comparendo: datos.comparendo,
      fechaComparendo: datos.fechaComparendo,
      articuloNumeral: datos.articuloNumeral,
      solicitado: datos.solicitado,
      cedula: datos.cedula,
      direccion: datos.direccion,
      telefono: datos.telefono,
      tipoMulta: datos.tipoMulta,
      causal: datos.causal,
      causalEvidencia: datos.causalEvidencia,
    };
    if (rutaEfectiva === 'conmutacion') {
      if (!conmutacionPermitidaPorTipo) return null;
      return generarActaConmutacion({
        ...comun,
        actividadAsignada: datos.actividadAsignada,
        entidadPrograma: datos.entidadPrograma,
        fechaLimiteActividad: datos.fechaLimiteActividad,
      });
    }
    return generarActaProntoPago({ ...comun, documentoCobro: datos.documentoCobro });
  }, [datos, listoParaGenerar, rutaEfectiva, conmutacionPermitidaPorTipo]);

  async function descargarPdf() {
    if (!acta) return;
    await descargarDocumentoLegalPdf(acta, inspeccion.membreteDataUrl);
  }
  async function descargarDocx() {
    if (!acta) return;
    await descargarDocumentoLegalDocx(acta, inspeccion.membreteDataUrl);
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: 8, fontWeight: 700, color: PALETA.texto }}>
        Pronto pago y conmutación
      </Title>
      <div style={{ marginBottom: 32 }}>
        <Text type="secondary" style={{ fontSize: 16, lineHeight: 1.6 }}>
          Beneficios del parágrafo del artículo 180 de la Ley 1801 de 2016 (modificado por el
          artículo 42 de la Ley 2197 de 2022): descuento del 50% por pronto pago, o conmutación
          por actividad pedagógica (solo multas tipo 1 y 2).
        </Text>
      </div>

      <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 380px', maxWidth: 460, minWidth: 340 }}>
          {/* Origen de los datos */}
          <Tarjeta>
            <Text strong style={{ display: 'block', marginBottom: 12 }}>
              Origen de los datos del comparendo
            </Text>
            <Segmented
              block
              value={rutaCarga}
              onChange={(v) => setRutaCarga(v as RutaCarga)}
              options={[
                { value: 'pdf', label: 'Subir comparendo (PDF)', icon: <FilePdfOutlined /> },
                { value: 'excel', label: 'Base de datos (Excel)', icon: <SearchOutlined /> },
              ]}
              style={{ marginBottom: 14 }}
            />
            {rutaCarga === 'pdf' ? (
              <>
                <input
                  ref={archivoPdfRef}
                  type="file"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => void cargarComparendoPdf(e.target.files?.[0])}
                />
                <Button
                  icon={extrayendo ? <Spin size="small" /> : <FilePdfOutlined />}
                  block
                  disabled={extrayendo}
                  onClick={() => archivoPdfRef.current?.click()}
                >
                  {extrayendo ? 'Leyendo comparendo…' : 'Subir PDF de la orden de comparendo'}
                </Button>
                {camposExtraidos.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {camposExtraidos.map((c) => (
                      <Tag key={c} color="green">
                        {c}
                      </Tag>
                    ))}
                  </div>
                )}
                {pdfEscaneado && (
                  <Alert
                    type="info"
                    showIcon
                    style={{ marginTop: 12, borderRadius: 14 }}
                    message="Comparendo escaneado sin capa de texto"
                    description="Diligencie los datos manualmente."
                  />
                )}
                {archivoComparendo && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${PALETA.borde}` }}>
                    <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                      <PdfViewer archivo={archivoComparendo} />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <Select
                  showSearch
                  placeholder="Número de comparendo, cédula o nombre…"
                  style={{ width: '100%', marginBottom: 10 }}
                  suffixIcon={<SearchOutlined />}
                  value={datos.comparendo || undefined}
                  onChange={seleccionarComparendo}
                  filterOption={(input, option) =>
                    String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={bd.map((c) => ({
                    value: c.comparendo,
                    label: `${c.comparendo} · ${c.solicitado} · CC ${c.cedula}`,
                  }))}
                />
                <input
                  ref={archivoBdRef}
                  type="file"
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  onChange={(e) => void cargarExcel(e.target.files?.[0])}
                />
                <Button icon={<UploadOutlined />} onClick={() => archivoBdRef.current?.click()} block>
                  Cargar BD de comparendos (.xlsx)
                </Button>
                {reporteImportacion && (
                  <Alert
                    type="info"
                    showIcon
                    style={{ marginTop: 10, borderRadius: 14 }}
                    message={`Válidas: ${reporteImportacion.leidas} · Descartadas: ${reporteImportacion.descartadas}`}
                  />
                )}
                <Tag style={{ marginTop: 10 }} color={origenBd === 'archivo' ? 'green' : 'blue'}>
                  {origenBd === 'archivo' ? 'BD del despacho' : 'BD de demostración'}
                </Tag>
              </>
            )}
          </Tarjeta>

          {/* Estado del plazo y rutas disponibles */}
          <Tarjeta>
            <Text strong style={{ display: 'block', marginBottom: 12 }}>
              Estado del plazo (art. 180 par. / art. 223A)
            </Text>
            {!rutasHoy ? (
              <Text type="secondary">Cargue el comparendo para ver en qué día hábil del plazo va.</Text>
            ) : (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  {(['objecion', 'pronto_pago', 'conmutacion', 'firmeza'] as RutaComparendo[]).map((r) => (
                    <Tag key={r} color={rutasHoy.rutas.includes(r) ? 'green' : 'default'}>
                      {RUTA_LABEL[r]}: {rutasHoy.rutas.includes(r) ? 'disponible' : 'vencida'}
                    </Tag>
                  ))}
                </div>
                {!rutasHoy.rutas.includes('pronto_pago') && !rutasHoy.rutas.includes('conmutacion') && (
                  <Alert
                    type="error"
                    showIcon
                    style={{ marginBottom: 10, borderRadius: 14 }}
                    message="Vencido el término del art. 180 par."
                    description="Ya no proceden pronto pago ni conmutación: corresponde acta de firmeza."
                  />
                )}
                <Checkbox
                  checked={tieneMultasPendientes}
                  onChange={(e) => setTieneMultasPendientes(e.target.checked)}
                >
                  El infractor registra multas pendientes
                </Checkbox>
                {rutasHoy.advertencia && (
                  <Alert
                    type="warning"
                    showIcon
                    style={{ marginTop: 10, borderRadius: 14 }}
                    message="Advertencia — no bloquea la ruta"
                    description={rutasHoy.advertencia}
                  />
                )}
              </>
            )}
          </Tarjeta>

          {/* Ruta elegida */}
          <Tarjeta>
            <Text strong style={{ display: 'block', marginBottom: 12 }}>
              Ruta que acoge el inspector
            </Text>
            <Segmented
              block
              value={rutaEfectiva}
              onChange={(v) => setRuta(v as RutaAcogida)}
              options={[
                { value: 'pronto_pago', label: 'Pronto pago (50%)' },
                {
                  value: 'conmutacion',
                  label: 'Conmutación',
                  disabled: !conmutacionPermitidaPorTipo,
                },
              ]}
              style={{ marginBottom: conmutacionPermitidaPorTipo ? 0 : 10 }}
            />
            {!conmutacionPermitidaPorTipo && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                La conmutación solo aplica a multas tipo 1 y 2 (art. 180 par.). Multa actual: tipo{' '}
                {datos.tipoMulta} ({MULTA_GENERAL[datos.tipoMulta].smdlv} SMDLV).
              </Text>
            )}
          </Tarjeta>

          {/* Reincidencia y liquidación */}
          <Tarjeta>
            <Text strong style={{ display: 'block', marginBottom: 14 }}>
              Reincidencia y liquidación
            </Text>
            <div style={{ marginBottom: 16 }}>
              <ReincidenciaCausalField
                causal={datos.causal}
                evidencia={datos.causalEvidencia}
                onCausalChange={(v) => set('causal', v)}
                onEvidenciaChange={(v) => set('causalEvidencia', v)}
              />
            </div>
            <DesgloseValor ruta={rutaEfectiva} tipoMulta={datos.tipoMulta} causal={datos.causal} />
          </Tarjeta>

          {/* Datos del comparendo */}
          <Tarjeta>
            <Text strong style={{ display: 'block', marginBottom: 14 }}>
              Datos del comparendo
            </Text>
            <CampoActa label="No. comparendo">
              <Input value={datos.comparendo} onChange={(e) => set('comparendo', e.target.value)} placeholder="17-001-…" />
            </CampoActa>
            <CampoActa label="No. de acta / proceso">
              <Input value={datos.proceso} onChange={(e) => set('proceso', e.target.value)} placeholder="2026-0000" />
            </CampoActa>
            <CampoActa label="Solicitado (infractor)">
              <Input value={datos.solicitado} onChange={(e) => set('solicitado', e.target.value)} />
            </CampoActa>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12 }}>
              <CampoActa label="Cédula">
                <Input value={datos.cedula} onChange={(e) => set('cedula', e.target.value)} />
              </CampoActa>
              <CampoActa label="Teléfono">
                <Input value={datos.telefono} onChange={(e) => set('telefono', e.target.value)} placeholder="NO APORTA" />
              </CampoActa>
            </div>
            <CampoActa label="Dirección">
              <Input value={datos.direccion} onChange={(e) => set('direccion', e.target.value)} />
            </CampoActa>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12 }}>
              <CampoActa label="Fecha del comparendo">
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  value={datos.fechaComparendo ? dayjs(datos.fechaComparendo) : null}
                  onChange={(d) => set('fechaComparendo', d ? d.format('YYYY-MM-DD') : '')}
                />
              </CampoActa>
              <CampoActa label="Fecha del acta">
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  value={dayjs(datos.fechaResolucion)}
                  onChange={(d) => d && set('fechaResolucion', d.format('YYYY-MM-DD'))}
                />
              </CampoActa>
            </div>
            <CampoActa label="Artículo y numeral (Ley 1801)">
              <Input value={datos.articuloNumeral} onChange={(e) => set('articuloNumeral', e.target.value)} placeholder="Artículo 140 Numeral 14" />
            </CampoActa>
            <CampoActa label="Procedencia (CAI)">
              <Input value={datos.solicitante} onChange={(e) => set('solicitante', e.target.value)} />
            </CampoActa>
            <CampoActa label="Hechos">
              <Input.TextArea
                autoSize={{ minRows: 2, maxRows: 5 }}
                value={datos.hechos}
                onChange={(e) => set('hechos', e.target.value)}
              />
            </CampoActa>
            <CampoActa label="Multa general (art. 180)">
              <Select
                style={{ width: '100%' }}
                value={datos.tipoMulta}
                onChange={(v) => set('tipoMulta', v)}
                options={([1, 2, 3, 4] as TipoMulta[]).map((t) => ({ value: t, label: `Tipo ${t} (${MULTA_GENERAL[t].smdlv} SMDLV)` }))}
              />
            </CampoActa>

            {rutaEfectiva === 'pronto_pago' ? (
              <CampoActa label="No. de recibo de cobro expedido">
                <Input
                  value={datos.documentoCobro}
                  onChange={(e) => set('documentoCobro', e.target.value)}
                  placeholder="RC-2026-000000"
                />
              </CampoActa>
            ) : (
              <>
                <CampoActa label="Actividad / programa comunitario asignado">
                  <Input value={datos.actividadAsignada} onChange={(e) => set('actividadAsignada', e.target.value)} />
                </CampoActa>
                <CampoActa label="Entidad u operador del programa">
                  <Input
                    value={datos.entidadPrograma}
                    onChange={(e) => set('entidadPrograma', e.target.value)}
                    placeholder="Secretaría de Gobierno Municipal…"
                  />
                </CampoActa>
                <CampoActa label="Plazo para acreditar la actividad">
                  <DatePicker
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                    value={dayjs(datos.fechaLimiteActividad)}
                    onChange={(d) => d && set('fechaLimiteActividad', d.format('YYYY-MM-DD'))}
                  />
                </CampoActa>
              </>
            )}
          </Tarjeta>

          {/* Despacho y acciones */}
          <Tarjeta>
            <Text strong style={{ display: 'block', marginBottom: 14 }}>
              Despacho
            </Text>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12 }}>
              <CampoActa label="Municipio">
                <Input value={datos.municipio} onChange={(e) => set('municipio', e.target.value)} />
              </CampoActa>
              <CampoActa label="Inspector">
                <Input value={datos.inspectorNombre} onChange={(e) => set('inspectorNombre', e.target.value)} />
              </CampoActa>
            </div>
            <CampoActa label="Inspección">
              <Input value={datos.inspeccion} onChange={(e) => set('inspeccion', e.target.value)} />
            </CampoActa>

            <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
              <Button type="primary" icon={<DownloadOutlined />} disabled={!acta} onClick={() => void descargarPdf()} style={{ fontWeight: 600 }}>
                Descargar PDF
              </Button>
              <Button icon={<FileWordOutlined />} disabled={!acta} onClick={() => void descargarDocx()}>
                Descargar .docx
              </Button>
              <Button icon={<PrinterOutlined />} disabled={!acta} onClick={() => window.print()}>
                Imprimir
              </Button>
              <ExpedientePrevioButton
                acta={acta}
                tipoActaFinal={rutaEfectiva === 'pronto_pago' ? 'acta_pronto_pago' : 'acta_conmutacion'}
                membreteDataUrl={inspeccion.membreteDataUrl}
                datosBase={{
                  municipio: datos.municipio,
                  inspeccion: datos.inspeccion,
                  proceso: datos.proceso,
                  comparendo: datos.comparendo,
                  articuloNumeral: datos.articuloNumeral,
                  solicitante: datos.solicitante,
                  solicitado: datos.solicitado,
                  cedulaSolicitado: datos.cedula,
                  direccionSolicitado: datos.direccion,
                  telefonoSolicitado: datos.telefono,
                  fechaComparendo: datos.fechaComparendo,
                  hechos: datos.hechos,
                  tipoMulta: datos.tipoMulta,
                }}
              />
            </div>
          </Tarjeta>
        </div>

        {/* Vista previa */}
        <div style={{ flex: '1 1 520px', minWidth: 380 }}>
          {!acta ? (
            <div
              style={{
                background: PALETA.superficie,
                borderRadius: 24,
                boxShadow: ELEVACION.base,
                padding: '70px 40px',
                textAlign: 'center',
                color: PALETA.textoTenue,
              }}
            >
              <WalletOutlined style={{ fontSize: 40, marginBottom: 14, color: '#c9cdd3' }} />
              <div style={{ fontSize: 15 }}>
                Cargue el comparendo y complete los datos; el acta se redacta aquí en tiempo real.
              </div>
            </div>
          ) : (
            <div
              style={{
                background: PALETA.superficie,
                borderRadius: 24,
                boxShadow: ELEVACION.media,
                padding: '46px 52px',
                fontFamily: "'Newsreader', Georgia, serif",
                fontSize: 13.5,
                lineHeight: 1.65,
                color: '#1b1b1f',
              }}
            >
              {inspeccion.membreteDataUrl && (
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <img
                    src={inspeccion.membreteDataUrl}
                    alt="Membrete de la alcaldía"
                    style={{ maxWidth: '100%', maxHeight: 96, objectFit: 'contain' }}
                  />
                </div>
              )}
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <div style={{ fontWeight: 600, letterSpacing: '0.04em' }}>{acta.entidad}</div>
                <div style={{ fontWeight: 700, fontSize: 17, marginTop: 10 }}>{acta.tituloDocumento}</div>
                <div style={{ marginTop: 2 }}>QUEJA {acta.proceso}</div>
                <div style={{ marginTop: 2 }}>{acta.fechaResolucionLetras}</div>
              </div>
              {acta.epigrafe && (
                <p style={{ textAlign: 'center', fontWeight: 600, fontSize: 12.5 }}>{acta.epigrafe}</p>
              )}
              <table style={{ width: '100%', margin: '16px 0', borderCollapse: 'collapse' }}>
                <tbody>
                  {acta.tablaDatos.map((f) => (
                    <tr key={f.etiqueta}>
                      <td style={{ padding: '3px 10px 3px 0', fontWeight: 600, whiteSpace: 'nowrap', verticalAlign: 'top', fontSize: 12 }}>
                        {f.etiqueta}:
                      </td>
                      <td style={{ padding: '3px 0', fontSize: 12.5 }}>{f.valor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {acta.secciones.map((s, i) => (
                <div key={i}>
                  {s.titulo && <p style={{ textAlign: 'center', fontWeight: 700, marginTop: 18 }}>{s.titulo}</p>}
                  {s.parrafos.map((p, j) => (
                    <p key={j} style={{ textAlign: 'justify' }}>
                      {p}
                    </p>
                  ))}
                </div>
              ))}
              {acta.resuelve.length > 0 && (
                <>
                  <p style={{ textAlign: 'center', fontWeight: 700, marginTop: 18 }}>RESUELVE:</p>
                  {acta.resuelve.map((p, i) => (
                    <p key={i} style={{ textAlign: 'justify' }}>
                      {p}
                    </p>
                  ))}
                </>
              )}
              <p style={{ marginTop: 18 }}>{acta.cierre}</p>
              <p style={{ fontWeight: 600 }}>CÚMPLASE,</p>
              {acta.firma.map((f, i) => (
                <div key={i} style={{ marginTop: 30 }}>
                  <div style={{ fontWeight: 700 }}>{f.nombre}</div>
                  <div>{f.rol}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
