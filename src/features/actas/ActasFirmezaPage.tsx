import { useEffect, useMemo, useRef, useState } from 'react';
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
  Table,
} from 'antd';
import {
  DownloadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  PrinterOutlined,
  UploadOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Sparkles } from 'lucide-react';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import {
  generarActaFirmeza,
  actaFirmezaComoDocumento,
  liquidarMulta,
  INCREMENTO_LABEL,
  MULTA_GENERAL,
  TERMINOS_COMPARENDO,
  type CausalIncremento,
  type DatosActaFirmeza,
  type TipoMulta,
} from '@/derecho';
import { calcularTermino } from '@/shared/terminos/diasHabiles';
import { parsearBdComparendos, type Comparendo, type ReporteImportacion } from './comparendos';
import { extraerComparendoPdf } from './extraerComparendoPdf';
import { descargarDocumentoLegalPdf } from '@/shared/documentos/documentoLegalPdf';
import { VistaPreviaActa } from '@/shared/documentos/VistaPreviaActa';
import { descargarDocumentoLegalDocx } from '@/shared/documentos/documentoLegalDocx';
import { ExpedientePrevioButton } from '@/shared/documentos/ExpedientePrevioButton';
import { DescargarExpedienteOficialButton } from '@/shared/documentos/DescargarExpedienteOficialButton';
import { DescargarActaFirmezaOficialButton } from '@/shared/documentos/DescargarActaFirmezaOficialButton';
import { TextoCierreActa } from '@/shared/documentos/TextoCierreActa';
import { ReincidenciaCausalField } from '@/shared/components/ReincidenciaCausalField';
import { PdfViewer } from '@/shared/documentos/PdfViewer';
import { ELEVACION, PALETA } from '@/theme/theme';
import { useInspeccionStore } from '@/store/inspeccionStore';
import { useAiChat } from '@/shared/ai/useAiChat';
import { Campo } from '@/shared/ui/Campo';
import { Tarjeta } from '@/shared/ui/Tarjeta';
import { TEXTO } from '@/theme/escala';
import { useComparendosStore } from '@/shared/comparendos/store';

const { Title, Text } = Typography;

const CLAVE_DESPACHO = 'acta-firmeza:despacho';

const DATOS_INICIALES: DatosActaFirmeza = {
  municipio: 'Manizales',
  inspeccion: 'Inspección Permanente de Convivencia y Paz Turno Uno',
  inspectorNombre: 'ANDRÉS FELIPE EJEMPLO ROJAS',
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
  causalEvidencia: '',
};

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
  // La BD es una sola para toda la app y sobrevive al cambio de pantalla: antes
  // cada página tenía su copia en useState y el .xlsx cargado aquí no existía
  // en la queja de al lado.
  const bd = useComparendosStore((s) => s.comparendos);
  const setBd = useComparendosStore((s) => s.cargar);
  const [origenBd, setOrigenBd] = useState<'demo' | 'archivo'>('demo');
  const [apelo, setApelo] = useState(false);
  const [extrayendo, setExtrayendo] = useState(false);
  const [camposExtraidos, setCamposExtraidos] = useState<(keyof Comparendo)[]>([]);
  const [pdfEscaneado, setPdfEscaneado] = useState(false);
  const [archivoComparendo, setArchivoComparendo] = useState<File | null>(null);
  const [reporteImportacion, setReporteImportacion] = useState<ReporteImportacion | null>(null);
  const archivoBdRef = useRef<HTMLInputElement>(null);
  const archivoPdfRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof DatosActaFirmeza>(k: K, v: DatosActaFirmeza[K]) {
    setDatos((prev) => ({ ...prev, [k]: v }));
  }

  // ── Asistencia de IA (HITL): la IA redacta los hechos y sugiere la causal,
  //    el humano revisa y ajusta. No se delega el trabajo completo a la IA. ──
  const { mensajes: msjIA, enviar: enviarIA, detener: detenerIA, enviando: enviandoIA } = useAiChat({
    tipo: 'redaccion-acta-firmeza',
    id: datos.comparendo || 'borrador',
  });
  const [sugeridaCausal, setSugeridaCausal] = useState<CausalIncremento | null>(null);

  async function asistirConIA() {
    if (!datos.comparendo) {
      message.warning('Seleccione o cargue un comparendo antes de pedir asistencia.');
      return;
    }
    const fuente = [datos.hechos, datos.hechos, `Descargos: N/A`]
      .filter(Boolean)
      .join('\n');
    await enviarIA(
      `Redacta el párrafo de HECHOS del acta de firmeza para el comparendo ${datos.comparendo} ` +
        `con base en la conducta y los descargos del infractor. Luego, en una línea que empiece ` +
        `por "CAUSAL:", indica la causal de incremento sugerida (ninguna, reiteracion_dentro_del_anio, ` +
        `reiteracion_despues_del_anio, moroso_bdme). No inventes datos que no estén en el texto.\n\n${fuente}`,
    );
  }

  // Cuando la IA responde, extrae la causal sugerida (línea "CAUSAL:") para que
  // el inspector la aplique con un clic (HITL, no automático).
  useEffect(() => {
    const ultimo = msjIA[msjIA.length - 1];
    if (ultimo?.rol === 'asistente' && ultimo.contenido.includes('CAUSAL:')) {
      const match = /CAUSAL:\s*([a-z_]+)/i.exec(ultimo.contenido);
      if (match && ['ninguna', 'reiteracion_dentro_del_anio', 'reiteracion_despues_del_anio', 'moroso_bdme'].includes(match[1])) {
        setSugeridaCausal(match[1] as CausalIncremento);
      }
    }
  }, [msjIA]);

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
    // Se guarda el File aunque falle la extracción — el inspector debe poder
    // ver el PDF subido incluso si no se detectó ningún campo automáticamente.
    setArchivoComparendo(archivo);
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
      <Title level={2} style={{ marginBottom: 8, fontWeight: 700, color: PALETA.texto }}>
        Actas de firmeza
      </Title>
      <div style={{ marginBottom: 32 }}>
        <Text type="secondary" style={{ fontSize: TEXTO.titulo, lineHeight: 1.6 }}>
          Constancia de firmeza de la multa general señalada en una orden de comparendo
          (art. 223A, literal e, Ley 1801 de 2016, adicionado por la Ley 2197 de 2022).
        </Text>
      </div>

      {/* ── Cola de trabajo: actas de firmeza cargadas desde el CSV/Excel ── */}
      <Tarjeta style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text strong>Cola de trabajo — actas de firmeza ({bd.length})</Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to="/panel/procesos">
              <Button size="small" icon={<UnorderedListOutlined />}>
                Ver todos los procesos
              </Button>
            </Link>
            <Tag color={origenBd === 'archivo' ? 'green' : 'blue'}>
              {origenBd === 'archivo' ? 'BD del despacho' : 'BD de demostración'}
            </Tag>
          </div>
        </div>
        <Table<Comparendo>
          size="small"
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          dataSource={bd}
          rowKey={(c) => c.comparendo}
          onRow={(c) => ({
            onClick: () => seleccionarComparendo(c.comparendo),
            style: { cursor: 'pointer' },
          })}
          columns={[
            { title: 'Comparendo', dataIndex: 'comparendo', key: 'comparendo', width: 150 },
            { title: 'Infractor', dataIndex: 'solicitado', key: 'solicitado', ellipsis: true },
            {
              title: 'Multa',
              dataIndex: 'tipoMulta',
              key: 'tipoMulta',
              width: 80,
              render: (t: TipoMulta) => `Tipo ${t}`,
            },
            {
              title: 'Reincidencia',
              dataIndex: 'causal',
              key: 'causal',
              width: 160,
              render: (c: CausalIncremento) =>
                c === 'ninguna' ? (
                  <Tag color="default">Sin reincidencia</Tag>
                ) : (
                  <Tag color="volcano">{INCREMENTO_LABEL[c]}</Tag>
                ),
            },
            {
              title: 'Estado',
              key: 'estado',
              width: 110,
              render: (_: unknown, c: Comparendo) =>
                datos.comparendo === c.comparendo ? (
                  <Tag color="processing">En edición</Tag>
                ) : (
                  <Tag color="default">Pendiente</Tag>
                ),
            },
            {
              title: '',
              key: 'accion',
              width: 90,
              render: (_: unknown, c: Comparendo) => (
                <Button
                  size="small"
                  type={datos.comparendo === c.comparendo ? 'primary' : 'default'}
                  onClick={(e) => {
                    e.stopPropagation();
                    seleccionarComparendo(c.comparendo);
                  }}
                >
                  {datos.comparendo === c.comparendo ? 'Abierto' : 'Abrir'}
                </Button>
              ),
            },
          ]}
        />
        <div style={{ fontSize: TEXTO.menor, color: PALETA.textoTenue, marginTop: 8 }}>
          Seleccione un comparendo de la cola para cargarlo en el editor (HITL) y generar su acta.
        </div>
      </Tarjeta>

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
                <div style={{ fontSize: TEXTO.menor, color: PALETA.textoTenue, marginTop: 10 }}>
                  El sistema extrae los datos del comparendo; el número de acta, la fecha y la
                  reincidencia se diligencian en el formulario.
                </div>
                {archivoComparendo && (
                  <div
                    style={{
                      marginTop: 14,
                      paddingTop: 14,
                      borderTop: `1px solid ${PALETA.borde}`,
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: TEXTO.menor, display: 'block', marginBottom: 8 }}>
                      Comparendo subido — verifique visualmente los campos extraídos contra el
                      original:
                    </Text>
                    <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                      <PdfViewer archivo={archivoComparendo} />
                    </div>
                  </div>
                )}
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
                  <Text type="secondary" style={{ fontSize: TEXTO.base }}>
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
                            <li key={motivo} style={{ fontSize: TEXTO.menor }}>
                              {motivo}: {count}
                            </li>
                          ))}
                        </ul>
                      ) : null
                    }
                  />
                )}
                <div style={{ fontSize: TEXTO.menor, color: PALETA.textoTenue, marginTop: 10 }}>
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
              <Campo label="No. de acta / proceso">
                <Input value={datos.proceso} onChange={(e) => set('proceso', e.target.value)} placeholder="2026-0000" />
              </Campo>
              <Campo label="Fecha del acta">
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  value={dayjs(datos.fechaResolucion)}
                  onChange={(d) => d && set('fechaResolucion', d.format('YYYY-MM-DD'))}
                />
              </Campo>
            </div>

            <div style={{ marginBottom: 16 }}>
              <ReincidenciaCausalField
                causal={datos.causal}
                evidencia={datos.causalEvidencia ?? ''}
                onCausalChange={(v) => set('causal', v)}
                onEvidenciaChange={(v) => set('causalEvidencia', v)}
              />
            </div>

            {/* Liquidación */}
            <div style={{ background: '#eef4fa', borderRadius: 16, padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: TEXTO.base }}>
                <Text type="secondary">
                  Multa tipo {liq.tipo} ({liq.smdlvLetras} SMDLV)
                </Text>
                <Text>$ {liq.valorBase.toLocaleString('es-CO')}</Text>
              </div>
              {liq.porcentajeIncremento > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: TEXTO.base, marginTop: 4 }}>
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

            <Campo label="No. comparendo">
              <Input value={datos.comparendo} onChange={(e) => set('comparendo', e.target.value)} placeholder="17-001-…" />
            </Campo>

            <Campo label="Presunto infractor">
              <Input value={datos.solicitado} onChange={(e) => set('solicitado', e.target.value)} placeholder="Nombre completo" />
            </Campo>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12 }}>
              <Campo label="Cédula">
                <Input value={datos.cedula} onChange={(e) => set('cedula', e.target.value)} />
              </Campo>
              <Campo label="Teléfono">
                <Input value={datos.telefono} onChange={(e) => set('telefono', e.target.value)} placeholder="NO APORTA" />
              </Campo>
            </div>

            <Campo label="Dirección del infractor">
              <Input value={datos.direccion} onChange={(e) => set('direccion', e.target.value)} />
            </Campo>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12 }}>
              <Campo label="Fecha del comparendo">
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  value={datos.fechaComparendo ? dayjs(datos.fechaComparendo) : null}
                  onChange={(d) => set('fechaComparendo', d ? d.format('YYYY-MM-DD') : '')}
                />
              </Campo>
              <Campo label="Procedencia (CAI)">
                <Input value={datos.solicitante} onChange={(e) => set('solicitante', e.target.value)} placeholder="CAI …" />
              </Campo>
            </div>

            <Campo label="Lugar del comportamiento">
              <Input value={datos.lugar} onChange={(e) => set('lugar', e.target.value)} />
            </Campo>

            <Campo label="Artículo y numeral (Ley 1801)">
              <Input
                value={datos.articuloNumeral}
                onChange={(e) => set('articuloNumeral', e.target.value)}
                placeholder="Artículo 140 Numeral 14"
              />
            </Campo>

            <Campo label="Hechos (descripción del comportamiento)">
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <Button
                  icon={<Sparkles size={15} strokeWidth={1.75} />}
                  onClick={() => void asistirConIA()}
                  loading={enviandoIA}
                  disabled={enviandoIA}
                >
                  Asistir con IA (redacta hechos)
                </Button>
                {enviandoIA && (
                  <Button size="small" danger onClick={() => detenerIA()}>
                    Detener
                  </Button>
                )}
                {sugeridaCausal && sugeridaCausal !== datos.causal && (
                  <Tag
                    color="blue"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      set('causal', sugeridaCausal);
                      message.info(`Causal sugerida aplicada: ${INCREMENTO_LABEL[sugeridaCausal]}`);
                    }}
                  >
                    IA sugiere causal: {INCREMENTO_LABEL[sugeridaCausal]} ✓
                  </Tag>
                )}
              </div>
              <Input.TextArea
                autoSize={{ minRows: 3, maxRows: 6 }}
                value={datos.hechos}
                onChange={(e) => set('hechos', e.target.value)}
                placeholder="La IA redacta este párrafo a partir de la conducta y los descargos; usted lo revisa y ajusta."
              />
            </Campo>

            <Campo label="Multa general (art. 180)">
              <Select
                style={{ width: '100%' }}
                value={datos.tipoMulta}
                onChange={(v) => set('tipoMulta', v)}
                options={TIPO_MULTA_OPCIONES}
              />
            </Campo>
          </Tarjeta>

          {/* Despacho y membrete */}
          <Tarjeta>
            <Text strong style={{ display: 'block', marginBottom: 14 }}>
              Despacho
            </Text>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12 }}>
              <Campo label="Municipio (alcaldía)">
                <Input value={datos.municipio} onChange={(e) => set('municipio', e.target.value)} />
              </Campo>
              <Campo label="Inspector">
                <Input value={datos.inspectorNombre} onChange={(e) => set('inspectorNombre', e.target.value)} />
              </Campo>
            </div>
            <Campo label="Inspección">
              <Input value={datos.inspeccion} onChange={(e) => set('inspeccion', e.target.value)} />
            </Campo>

            <Campo label="Membrete de la alcaldía (encabezado del acta)">
              <div
                style={{
                  background: inspeccion.membreteDataUrl ? PALETA.azulSuave : '#eef4fa',
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontSize: TEXTO.base,
                  color: inspeccion.membreteDataUrl ? PALETA.azulOscuro : PALETA.textoSuave,
                }}
              >
                {inspeccion.membreteDataUrl
                  ? 'Membrete cargado desde la configuración de la inspección.'
                  : 'Aún no hay membrete. Ábrelo con el asistente "Configurar inspección" (botón flotante) para guardarlo una vez.'}
              </div>
            </Campo>

            <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
              <Button
                type="primary"
                size="large"
                icon={<DownloadOutlined />}
                disabled={!acta || apelo}
                onClick={() => acta && void descargarDocumentoLegalPdf(actaFirmezaComoDocumento(acta), inspeccion.membreteDataUrl)}
                style={{ fontWeight: 600 }}
              >
                Descargar PDF
              </Button>
              <Button
                size="large"
                icon={<FileWordOutlined />}
                disabled={!acta || apelo}
                onClick={() => acta && void descargarDocumentoLegalDocx(actaFirmezaComoDocumento(acta), inspeccion.membreteDataUrl)}
              >
                Descargar .docx
              </Button>
              <DescargarActaFirmezaOficialButton
                disabled={!acta || apelo}
                registro={{
                  proceso: datos.proceso,
                  comparendo: datos.comparendo,
                  articuloNumeral: datos.articuloNumeral,
                  solicitante: datos.solicitante,
                  solicitado: datos.solicitado,
                  cedula: datos.cedula,
                  direccion: datos.direccion,
                  telefono: datos.telefono,
                  fechaComparendo: datos.fechaComparendo,
                  fechaResolucion: datos.fechaResolucion,
                  lugar: datos.lugar,
                  hechos: datos.hechos,
                  tipoMulta: datos.tipoMulta,
                  liquidacion: liq,
                  apelo,
                }}
              />
              <Button
                size="large"
                icon={<PrinterOutlined />}
                disabled={!acta || apelo}
                onClick={() => window.print()}
              >
                Imprimir
              </Button>
              <ExpedientePrevioButton
                ruta="firmeza"
                disabled={!acta || apelo}
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
                }}
              />
              {/* Descarga independiente desde la plantilla oficial real del despacho
                  (EXPEDIENTE PLANTILLA.docx) — no se mezcla con el acta ni con el
                  expediente sintetizado de ExpedientePrevioButton. */}
              <DescargarExpedienteOficialButton
                disabled={!acta || apelo}
                registro={{
                  proceso: datos.proceso,
                  comparendo: datos.comparendo,
                  articuloNumeral: datos.articuloNumeral,
                  solicitante: datos.solicitante,
                  solicitado: datos.solicitado,
                  cedula: datos.cedula,
                  direccion: datos.direccion,
                  telefono: datos.telefono,
                  fechaComparendo: datos.fechaComparendo,
                  hechos: datos.hechos,
                }}
                fechaConstanciaSugerida={terminos?.firmeza.fechaVencimiento}
              />
            </div>
          </Tarjeta>

          {/* Independiente de la descarga del .docx: reutiliza el mismo nombre, queja,
              fecha, tipo de multa y causal ya seleccionados — no pide nada de nuevo. */}
          <TextoCierreActa
            nombre={datos.solicitado}
            queja={datos.proceso}
            fechaResolucion={datos.fechaResolucion}
            tipoMulta={datos.tipoMulta}
            causal={datos.causal}
          />
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
              <div style={{ fontSize: TEXTO.titulo }}>
                Suba el PDF del comparendo o selecciónelo de la base de datos.
                El acta se redacta aquí en tiempo real.
              </div>
            </div>
          ) : (
            <div id="acta-imprimible">
              <VistaPreviaActa
                acta={actaFirmezaComoDocumento(acta)}
                membreteDataUrl={inspeccion.membreteDataUrl}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
