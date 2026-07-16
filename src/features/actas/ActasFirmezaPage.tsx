import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  Button,
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
  FilePdfOutlined,
  PrinterOutlined,
  UploadOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  generarActaFirmeza,
  liquidarMulta,
  INCREMENTO_LABEL,
  MULTA_GENERAL,
  TERMINOS_COMPARENDO,
  type CausalIncremento,
  type DatosActaFirmeza,
  type TipoMulta,
} from '@/derecho';
import { calcularTermino } from '@/shared/terminos/diasHabiles';
import { COMPARENDOS_DEMO, parsearBdComparendos, type Comparendo, type ReporteImportacion } from './comparendos';
import { extraerComparendoPdf } from './extraerComparendoPdf';
import { descargarActaPdf } from './actaPdf';
import { ELEVACION, PALETA } from '@/theme/theme';
import { useInspeccionStore } from '@/store/inspeccionStore';

const { Title, Text } = Typography;

const CLAVE_DESPACHO = 'acta-firmeza:despacho';

const DATOS_INICIALES: DatosActaFirmeza = {
  municipio: 'Manizales',
  inspeccion: 'Inspección Permanente de Convivencia y Paz Turno Uno',
  inspectorNombre: 'LUIS GABRIEL LADINO AYALA',
  inspectorCargo: 'Inspector Permanente de Convivencia y Paz – Turno Uno',
  proceso: '',
  fechaResolucion: dayjs().format('YYYY-MM-DD'),
  comparendo: '',
  fechaComparendo: '',
  articuloNumeral: '',
  lugar: '',
  solicitado: '',
  cedula: '',
  direccion: '',
  telefono: '',
  solicitante: '',
  hechos: '',
  tipoMulta: 1,
  causal: 'ninguna',
};

const CAUSAL_OPCIONES = (Object.entries(INCREMENTO_LABEL) as [CausalIncremento, string][]).map(
  ([value, label]) => ({ value, label }),
);

const TIPO_MULTA_OPCIONES = ([1, 2, 3, 4] as TipoMulta[]).map((t) => ({
  value: t,
  label: `Tipo ${t}: ${MULTA_GENERAL[t].smdlv} SMDLV ($ ${liquidarMulta(t).valorBase.toLocaleString('es-CO')})`,
}));

const ETIQUETA_CAMPO: Partial<Record<keyof Comparendo, string>> = {
  comparendo: 'No. comparendo',
  solicitado: 'Nombre',
  cedula: 'Cédula',
  direccion: 'Dirección',
  telefono: 'Teléfono',
  lugar: 'Lugar',
  fechaComparendo: 'Fecha',
  solicitante: 'CAI',
  articuloNumeral: 'Artículo',
  tipoMulta: 'Tipo de multa',
  hechos: 'Hechos',
};

function CampoActa({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: PALETA.textoTenue,
          marginBottom: 4,
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
        borderRadius: 20,
        boxShadow: ELEVACION.base,
        padding: '18px 20px',
        marginBottom: 18,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function ActasFirmezaPage() {
  const { message } = App.useApp();
  const inspeccion = useInspeccionStore((s) => s.config);
  const [ruta, setRuta] = useState<'pdf' | 'excel'>('pdf');
  const [datos, setDatos] = useState<DatosActaFirmeza>(() => {
    // Prioridad: store de inspección (contexto persistido) > recuerdo local > defaults.
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
  const [apelo, setApelo] = useState(false);
  const [extrayendo, setExtrayendo] = useState(false);
  const [camposExtraidos, setCamposExtraidos] = useState<(keyof Comparendo)[]>([]);
  const [pdfEscaneado, setPdfEscaneado] = useState(false);
  const [reporteImportacion, setReporteImportacion] = useState<ReporteImportacion | null>(null);
  const archivoBdRef = useRef<HTMLInputElement>(null);
  const archivoPdfRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof DatosActaFirmeza>(k: K, v: DatosActaFirmeza[K]) {
    setDatos((prev) => ({ ...prev, [k]: v }));
  }

  // El despacho (municipio, inspección, inspector) se recuerda entre sesiones.
  useEffect(() => {
    const { municipio, inspeccion, inspectorNombre, inspectorCargo } = datos;
    localStorage.setItem(
      CLAVE_DESPACHO,
      JSON.stringify({ municipio, inspeccion, inspectorNombre, inspectorCargo }),
    );
  }, [datos.municipio, datos.inspeccion, datos.inspectorNombre, datos.inspectorCargo]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Ruta A: PDF del comparendo ───────────────────────────────────────
  async function cargarComparendoPdf(archivo: File | undefined) {
    if (!archivo) return;
    setExtrayendo(true);
    setPdfEscaneado(false);
    setCamposExtraidos([]);
    try {
      const { datos: extraidos, camposDetectados, textoDisponible } =
        await extraerComparendoPdf(archivo);
      if (!textoDisponible) {
        setPdfEscaneado(true);
        return;
      }
      setApelo(false);
      setDatos((prev) => ({ ...prev, ...extraidos }));
      setCamposExtraidos(camposDetectados);
      message.success(
        `Comparendo leído: ${camposDetectados.length} campos extraídos. Verifíquelos y complete el formulario.`,
      );
    } catch {
      message.error('No fue posible leer el PDF.');
    } finally {
      setExtrayendo(false);
      if (archivoPdfRef.current) archivoPdfRef.current.value = '';
    }
  }

  // ── Ruta B: BD de comparendos (Excel) ────────────────────────────────
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
      message.success(`BD cargada: ${reporte.leidas.toLocaleString('es-CO')} comparendos (${reporte.descartadas} descartados).`);
    } catch {
      message.error('No fue posible leer el archivo. Verifique que sea la BD de comparendos (.xlsx).');
    } finally {
      if (archivoBdRef.current) archivoBdRef.current.value = '';
    }
  }

  function seleccionarComparendo(numero: string) {
    const c = bd.find((x) => x.comparendo === numero);
    if (!c) return;
    setApelo(c.apelo);
    setCamposExtraidos([]);
    setDatos((prev) => ({
      ...prev,
      proceso: c.proceso,
      comparendo: c.comparendo,
      solicitado: c.solicitado,
      cedula: c.cedula,
      direccion: c.direccion,
      telefono: c.telefono,
      lugar: c.lugar,
      fechaComparendo: c.fechaComparendo,
      solicitante: c.solicitante,
      articuloNumeral: c.articuloNumeral,
      hechos: c.hechos,
      tipoMulta: c.tipoMulta,
      causal: c.causal, // reincidencia registrada en la BD
    }));
    if (c.causal !== 'ninguna') {
      message.info(`La BD registra reincidencia: ${INCREMENTO_LABEL[c.causal]}.`);
    }
  }

  // ── Términos y acta ──────────────────────────────────────────────────
  const terminos = useMemo(() => {
    if (!datos.fechaComparendo) return null;
    const inicio = dayjs(datos.fechaComparendo);
    return {
      objecion: calcularTermino(inicio, TERMINOS_COMPARENDO.objecionDias),
      firmeza: calcularTermino(inicio, TERMINOS_COMPARENDO.firmezaDias),
    };
  }, [datos.fechaComparendo]);

  const listaParaGenerar =
    datos.comparendo && datos.solicitado && datos.cedula && datos.fechaComparendo && datos.proceso;

  const acta = useMemo(
    () => (listaParaGenerar ? generarActaFirmeza(datos) : null),
    [datos, listaParaGenerar],
  );

  const liq = acta?.liquidacion ?? liquidarMulta(datos.tipoMulta, datos.causal);

  return (
    <div>
      <Title level={2} style={{ marginBottom: 4 }}>
        Actas de firmeza
      </Title>
      <div style={{ marginBottom: 22 }}>
        <Text type="secondary" style={{ fontSize: 15 }}>
          Constancia de firmeza de la multa general señalada en una orden de comparendo
          (art. 223A, literal e, Ley 1801 de 2016, adicionado por la Ley 2197 de 2022).
        </Text>
      </div>

      <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* ── Columna izquierda ─────────────────────────────────── */}
        <div style={{ flex: '1 1 380px', maxWidth: 460, minWidth: 340 }}>
          {/* Origen de los datos: dos rutas */}
          <Tarjeta>
            <Text strong style={{ display: 'block', marginBottom: 12 }}>
              Origen de los datos del comparendo
            </Text>
            <Segmented
              block
              value={ruta}
              onChange={(v) => setRuta(v as 'pdf' | 'excel')}
              options={[
                { value: 'pdf', label: 'Subir comparendo (PDF)', icon: <FilePdfOutlined /> },
                { value: 'excel', label: 'Base de datos (Excel)', icon: <SearchOutlined /> },
              ]}
              style={{ marginBottom: 14 }}
            />

            {ruta === 'pdf' ? (
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
                      <Tag key={c} color="green" style={{ marginInlineEnd: 0 }}>
                        {ETIQUETA_CAMPO[c] ?? c}
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
                    description="La lectura de comparendos escaneados la hará el agente de IA (OCR) del backend. Por ahora diligencie los datos manualmente."
                  />
                )}
                <div style={{ fontSize: 12, color: PALETA.textoTenue, marginTop: 10 }}>
                  El sistema extrae los datos del comparendo; el número de acta, la fecha y la
                  reincidencia se diligencian en el formulario.
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Buscar comparendo
                  </Text>
                  <Tag color={origenBd === 'archivo' ? 'green' : 'blue'}>
                    {origenBd === 'archivo' ? 'BD del despacho' : 'BD de demostración'} ·{' '}
                    {bd.length.toLocaleString('es-CO')}
                  </Tag>
                </div>
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
                    message={`Filas leídas: ${reporteImportacion.totalFilas} · Válidas: ${reporteImportacion.leidas} · Descartadas: ${reporteImportacion.descartadas}`}
                    description={
                      reporteImportacion.descartadas > 0 ? (
                        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                          {Object.entries(reporteImportacion.motivos).map(([motivo, count]) => (
                            <li key={motivo} style={{ fontSize: 12.5 }}>
                              {motivo}: {count}
                            </li>
                          ))}
                        </ul>
                      ) : null
                    }
                  />
                )}
                <div style={{ fontSize: 12, color: PALETA.textoTenue, marginTop: 10 }}>
                  Si la BD trae la columna REINCIDENTE, la reincidencia se precarga y puede
                  ajustarse en el formulario.
                </div>
              </>
            )}
          </Tarjeta>

          {/* Verificación de términos */}
          {apelo && (
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 18, borderRadius: 16 }}
              message="El comparendo registra objeción"
              description="La orden fue objetada dentro del término: no procede acta de firmeza. Corresponde dar trámite de proceso verbal abreviado."
            />
          )}
          {!apelo && terminos && (
            terminos.firmeza.vencido ? (
              <Alert
                type="success"
                showIcon
                style={{ marginBottom: 18, borderRadius: 16 }}
                message="Procede la firmeza"
                description={`Vencieron los ${TERMINOS_COMPARENDO.firmezaDias} días hábiles (el ${terminos.firmeza.fechaVencimiento.format('D [de] MMMM')}) sin objeción ni ejercicio de los beneficios del art. 180.`}
              />
            ) : (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 18, borderRadius: 16 }}
                message="Términos aún en curso: no procede la firmeza"
                description={`El ciudadano puede objetar hasta el ${terminos.objecion.fechaVencimiento.format('D [de] MMMM')} (3 días hábiles) y acogerse a los beneficios del art. 180 hasta el ${terminos.firmeza.fechaVencimiento.format('D [de] MMMM')} (5 días hábiles, art. 223A).`}
              />
            )
          )}

          {/* Datos del acta (formulario del inspector) */}
          <Tarjeta>
            <Text strong style={{ display: 'block', marginBottom: 14 }}>
              Datos del acta
            </Text>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12 }}>
              <CampoActa label="No. de acta / proceso">
                <Input value={datos.proceso} onChange={(e) => set('proceso', e.target.value)} placeholder="2026-0000" />
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

            <CampoActa label="Reincidencia (RNMC / BDME, art. 223A lits. i, j)">
              <Select
                style={{ width: '100%' }}
                value={datos.causal}
                onChange={(v) => set('causal', v)}
                options={CAUSAL_OPCIONES}
              />
            </CampoActa>

            {/* Liquidación */}
            <div style={{ background: '#f6f7f9', borderRadius: 16, padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                <Text type="secondary">
                  Multa tipo {liq.tipo} ({liq.smdlvLetras} SMDLV)
                </Text>
                <Text>$ {liq.valorBase.toLocaleString('es-CO')}</Text>
              </div>
              {liq.porcentajeIncremento > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginTop: 4 }}>
                  <Text type="secondary">Incremento {liq.porcentajeIncremento}%</Text>
                  <Text>$ {liq.valorIncremento.toLocaleString('es-CO')}</Text>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: `1px solid ${PALETA.borde}`,
                }}
              >
                <Text strong>Valor a recaudar</Text>
                <Text strong style={{ color: PALETA.azulOscuro }}>
                  $ {liq.valorTotal.toLocaleString('es-CO')}
                </Text>
              </div>
            </div>
          </Tarjeta>

          {/* Datos del comparendo (editables) */}
          <Tarjeta>
            <Text strong style={{ display: 'block', marginBottom: 14 }}>
              Datos del comparendo
            </Text>

            <CampoActa label="No. comparendo">
              <Input value={datos.comparendo} onChange={(e) => set('comparendo', e.target.value)} placeholder="17-001-…" />
            </CampoActa>

            <CampoActa label="Presunto infractor">
              <Input value={datos.solicitado} onChange={(e) => set('solicitado', e.target.value)} placeholder="Nombre completo" />
            </CampoActa>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12 }}>
              <CampoActa label="Cédula">
                <Input value={datos.cedula} onChange={(e) => set('cedula', e.target.value)} />
              </CampoActa>
              <CampoActa label="Teléfono">
                <Input value={datos.telefono} onChange={(e) => set('telefono', e.target.value)} placeholder="NO APORTA" />
              </CampoActa>
            </div>

            <CampoActa label="Dirección del infractor">
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
              <CampoActa label="Procedencia (CAI)">
                <Input value={datos.solicitante} onChange={(e) => set('solicitante', e.target.value)} placeholder="CAI …" />
              </CampoActa>
            </div>

            <CampoActa label="Lugar del comportamiento">
              <Input value={datos.lugar} onChange={(e) => set('lugar', e.target.value)} />
            </CampoActa>

            <CampoActa label="Artículo y numeral (Ley 1801)">
              <Input
                value={datos.articuloNumeral}
                onChange={(e) => set('articuloNumeral', e.target.value)}
                placeholder="Artículo 140 Numeral 14"
              />
            </CampoActa>

            <CampoActa label="Hechos (descripción del comportamiento)">
              <Input.TextArea
                autoSize={{ minRows: 3, maxRows: 6 }}
                value={datos.hechos}
                onChange={(e) => set('hechos', e.target.value)}
              />
            </CampoActa>

            <CampoActa label="Multa general (art. 180)">
              <Select
                style={{ width: '100%' }}
                value={datos.tipoMulta}
                onChange={(v) => set('tipoMulta', v)}
                options={TIPO_MULTA_OPCIONES}
              />
            </CampoActa>
          </Tarjeta>

          {/* Despacho y membrete */}
          <Tarjeta>
            <Text strong style={{ display: 'block', marginBottom: 14 }}>
              Despacho
            </Text>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12 }}>
              <CampoActa label="Municipio (alcaldía)">
                <Input value={datos.municipio} onChange={(e) => set('municipio', e.target.value)} />
              </CampoActa>
              <CampoActa label="Inspector">
                <Input value={datos.inspectorNombre} onChange={(e) => set('inspectorNombre', e.target.value)} />
              </CampoActa>
            </div>
            <CampoActa label="Inspección">
              <Input value={datos.inspeccion} onChange={(e) => set('inspeccion', e.target.value)} />
            </CampoActa>

            <CampoActa label="Membrete de la alcaldía (encabezado del acta)">
              <div
                style={{
                  background: inspeccion.membreteDataUrl ? PALETA.azulSuave : '#f1f3f4',
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontSize: 13,
                  color: inspeccion.membreteDataUrl ? PALETA.azulOscuro : PALETA.textoSuave,
                }}
              >
                {inspeccion.membreteDataUrl
                  ? 'Membrete cargado desde la configuración de la inspección.'
                  : 'Aún no hay membrete. Ábrelo con el asistente "Configurar inspección" (botón flotante) para guardarlo una vez.'}
              </div>
            </CampoActa>

            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <Button
                type="primary"
                size="large"
                block
                icon={<DownloadOutlined />}
                disabled={!acta || apelo}
                onClick={() => acta && descargarActaPdf(acta, inspeccion.membreteDataUrl)}
                style={{ fontWeight: 600 }}
              >
                Descargar PDF
              </Button>
              <Button
                size="large"
                icon={<PrinterOutlined />}
                disabled={!acta || apelo}
                onClick={() => window.print()}
              >
                Imprimir
              </Button>
            </div>
          </Tarjeta>
        </div>

        {/* ── Columna derecha: vista previa del acta ─────────────── */}
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
              <SafetyCertificateOutlined style={{ fontSize: 40, marginBottom: 14, color: '#c9cdd3' }} />
              <div style={{ fontSize: 15 }}>
                Suba el PDF del comparendo o selecciónelo de la base de datos.
                El acta se redacta aquí en tiempo real.
              </div>
            </div>
          ) : (
            <div
              id="acta-imprimible"
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
                <div style={{ fontWeight: 700, fontSize: 17, marginTop: 10 }}>
                  {acta.tituloDocumento}
                </div>
                <div style={{ marginTop: 2 }}>QUEJA {acta.proceso}</div>
                <div style={{ marginTop: 2 }}>{acta.fechaResolucionLetras}</div>
              </div>

              <p style={{ textAlign: 'center', fontWeight: 600, fontSize: 12.5 }}>{acta.epigrafe}</p>

              <table style={{ width: '100%', margin: '16px 0', borderCollapse: 'collapse' }}>
                <tbody>
                  {acta.tablaDatos.map((f) => (
                    <tr key={f.etiqueta}>
                      <td
                        style={{
                          padding: '3px 10px 3px 0',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          verticalAlign: 'top',
                          fontSize: 12,
                        }}
                      >
                        {f.etiqueta}:
                      </td>
                      <td style={{ padding: '3px 0', fontSize: 12.5 }}>{f.valor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {acta.secciones.map((s, i) => (
                <div key={i}>
                  {s.titulo && (
                    <p style={{ textAlign: 'center', fontWeight: 700, marginTop: 18 }}>{s.titulo}</p>
                  )}
                  {s.parrafos.map((p, j) => (
                    <p key={j} style={{ textAlign: 'justify' }}>
                      {p}
                    </p>
                  ))}
                </div>
              ))}

              <p style={{ textAlign: 'center', fontWeight: 700, marginTop: 18 }}>DISPONE:</p>
              {acta.dispone.map((p, i) => (
                <p key={i} style={{ textAlign: 'justify' }}>
                  {p}
                </p>
              ))}

              <p style={{ marginTop: 18 }}>{acta.cierre}</p>
              <p style={{ fontWeight: 600 }}>CÚMPLASE,</p>

              <div style={{ marginTop: 44 }}>
                <div style={{ fontWeight: 700 }}>{acta.firma.nombre}</div>
                <div>{acta.firma.cargo}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
