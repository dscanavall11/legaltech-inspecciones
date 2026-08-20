import { useMemo, useRef, useState } from 'react';
import { Alert, App, Button, Checkbox, DatePicker, Input, Segmented, Select, Spin, Tag, Typography } from 'antd';
import {
  DownloadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  PrinterOutlined,
  SearchOutlined,
  UploadOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  liquidarMulta,
  liquidarProntoPago,
  rutasDisponibles,
  MULTA_GENERAL,
  type CausalIncremento,
  type DocumentoLegal,
  type RutaComparendo,
  type TipoMulta,
} from '@/derecho';
import {
  parsearBdComparendos,
  type Comparendo,
  type ReporteImportacion,
} from '@/features/actas/comparendos';
import { extraerComparendoPdf } from '@/features/actas/extraerComparendoPdf';
import { descargarDocumentoLegalDocx } from '@/shared/documentos/documentoLegalDocx';
import { descargarDocumentoLegalPdf } from '@/shared/documentos/documentoLegalPdf';
import { ExpedientePrevioButton } from '@/shared/documentos/ExpedientePrevioButton';
import { PdfViewer } from '@/shared/documentos/PdfViewer';
import { ReincidenciaCausalField } from '@/shared/components/ReincidenciaCausalField';
import { ELEVACION, PALETA } from '@/theme/theme';
import { useInspeccionStore } from '@/store/inspeccionStore';
import { Campo } from '@/shared/ui/Campo';
import { Bloque } from '@/shared/ui/Bloque';
import { datosInicialesAcogida, type FormularioAcogida } from './formularioAcogida';
import { viaAdmiteTipo, type ViaAcogida } from './viaAcogida';
import { VistaPreviaActa } from '@/shared/documentos/VistaPreviaActa';
import { TEXTO, RADIO, RELLENO } from '@/theme/escala';
import { useComparendosStore } from '@/shared/comparendos/store';
import { CabeceraPagina } from '@/shared/ui/CabeceraPagina';
import { ESPACIO } from '@/theme/escala';

const { Text } = Typography;

type RutaCarga = 'pdf' | 'excel';

const RUTA_LABEL: Record<RutaComparendo, string> = {
  objecion: 'Objeción',
  pronto_pago: 'Pronto pago',
  conmutacion: 'Conmutación',
  firmeza: 'Firmeza',
};

/** Desglose base → incremento → subtotal → descuento → total, espejo del acta. */
function DesgloseValor({
  via,
  tipoMulta,
  causal,
}: {
  via: ViaAcogida;
  tipoMulta: TipoMulta;
  causal: CausalIncremento;
}) {
  const liqProntoPago = liquidarProntoPago(tipoMulta, causal);
  const liqBase = via.aplicaDescuento ? liqProntoPago : liquidarMulta(tipoMulta, causal);

  const filas = [
    { etiqueta: `Multa tipo ${liqBase.tipo} (${liqBase.smdlvLetras} SMDLV)`, valor: liqBase.valorBase },
    ...(liqBase.porcentajeIncremento > 0
      ? [
          {
            etiqueta: `Incremento por reincidencia (${liqBase.porcentajeIncremento}%)`,
            valor: liqBase.valorIncremento,
          },
          { etiqueta: 'Subtotal', valor: liqBase.valorTotal },
        ]
      : []),
    ...(via.aplicaDescuento
      ? [{ etiqueta: 'Descuento pronto pago (50%)', valor: -liqProntoPago.descuento }]
      : []),
  ];
  const total = via.aplicaDescuento ? liqProntoPago.valorAPagar : liqBase.valorTotal;

  return (
    <div style={{ background: '#eef4fa', borderRadius: 16, padding: '12px 16px' }}>
      {filas.map((f) => (
        <div
          key={f.etiqueta}
          style={{ display: 'flex', justifyContent: 'space-between', fontSize: TEXTO.base, marginTop: 4 }}
        >
          <Text type="secondary">{f.etiqueta}</Text>
          <Text>
            {f.valor < 0 ? '− ' : ''}$ {Math.abs(f.valor).toLocaleString('es-CO')}
          </Text>
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
        <Text strong>{via.totalLabel}</Text>
        <Text strong style={{ color: PALETA.azulOscuro }}>
          $ {total.toLocaleString('es-CO')}
        </Text>
      </div>
    </div>
  );
}

/**
 * Área de trabajo de una vía de acogida del comparendo. No conoce ninguna vía
 * concreta: todo lo que cambia entre pronto pago y conmutación llega en `via`
 * (ver viaAcogida.tsx), así que una vía nueva no toca este archivo.
 */
export function AreaTrabajoAcogida({ via }: { via: ViaAcogida }) {
  const { message } = App.useApp();
  const inspeccion = useInspeccionStore((s) => s.config);
  const [rutaCarga, setRutaCarga] = useState<RutaCarga>('pdf');
  const [datos, setDatos] = useState<FormularioAcogida>(datosInicialesAcogida);
  // La BD es una sola para toda la app y sobrevive al cambio de pantalla: antes
  // cada página tenía su copia en useState y el .xlsx cargado aquí no existía
  // en la queja de al lado.
  const bd = useComparendosStore((s) => s.comparendos);
  const setBd = useComparendosStore((s) => s.cargar);
  const [origenBd, setOrigenBd] = useState<'demo' | 'archivo'>('demo');
  const [extrayendo, setExtrayendo] = useState(false);
  const [camposExtraidos, setCamposExtraidos] = useState<(keyof Comparendo)[]>([]);
  const [pdfEscaneado, setPdfEscaneado] = useState(false);
  const [archivoComparendo, setArchivoComparendo] = useState<File | null>(null);
  const [reporteImportacion, setReporteImportacion] = useState<ReporteImportacion | null>(null);
  const [tieneMultasPendientes, setTieneMultasPendientes] = useState(false);
  const archivoBdRef = useRef<HTMLInputElement>(null);
  const archivoPdfRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof FormularioAcogida>(k: K, v: FormularioAcogida[K]) {
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

  const rutasHoy = useMemo(
    () =>
      datos.fechaComparendo
        ? rutasDisponibles(
            datos.tipoMulta,
            new Date(datos.fechaComparendo),
            new Date(),
            tieneMultasPendientes,
          )
        : null,
    [datos.fechaComparendo, datos.tipoMulta, tieneMultasPendientes],
  );

  const tipoAdmitido = viaAdmiteTipo(via, datos.tipoMulta);
  const listoParaGenerar = Boolean(
    datos.comparendo && datos.solicitado && datos.cedula && datos.fechaComparendo && datos.proceso,
  );

  // Advisory: un tipo de multa no admitido no rompe la pantalla, solo impide
  // que se redacte el acta — el aviso explica por qué y a dónde ir.
  const acta: DocumentoLegal | null = useMemo(
    () => (listoParaGenerar && tipoAdmitido ? via.generarActa(datos) : null),
    [datos, listoParaGenerar, tipoAdmitido, via],
  );

  const viaVencida = rutasHoy !== null && !rutasHoy.rutas.includes(via.clave);

  return (
    <div>
      <CabeceraPagina titulo={via.titulo} descripcion={via.descripcion} />
      <div style={{ height: ESPACIO.lg }} />

      <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Un solo contenedor, no varias tarjetas compitiendo por peso —
            mismo lenguaje que querellas/quejas (AreaTrabajoExpediente). */}
        <section
          style={{
            flex: '1 1 380px',
            maxWidth: 460,
            minWidth: 340,
            background: PALETA.superficie,
            border: `1px solid ${PALETA.borde}`,
            borderRadius: RADIO.tarjeta,
            boxShadow: ELEVACION.base,
            padding: RELLENO.tarjeta,
            display: 'flex',
            flexDirection: 'column',
            gap: ESPACIO.lg,
          }}
        >
          <Bloque titulo="Origen de los datos del comparendo">
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
                    String(option?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
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
          </Bloque>

          <Bloque titulo="Estado del plazo (art. 180 par. / art. 223A)">
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
                {viaVencida && (
                  <Alert
                    type="error"
                    showIcon
                    style={{ marginBottom: 10, borderRadius: 14 }}
                    message={`Vencido el término para ${via.titulo.toLowerCase()}`}
                    description="Revise qué vía sigue disponible arriba; si ninguna, corresponde acta de firmeza."
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
          </Bloque>

          <Bloque titulo="Reincidencia y liquidación">
            <div style={{ marginBottom: 16 }}>
              <ReincidenciaCausalField
                causal={datos.causal}
                evidencia={datos.causalEvidencia}
                onCausalChange={(v) => set('causal', v)}
                onEvidenciaChange={(v) => set('causalEvidencia', v)}
              />
            </div>
            <DesgloseValor via={via} tipoMulta={datos.tipoMulta} causal={datos.causal} />
          </Bloque>

          <Bloque titulo="Datos del comparendo">
            <Campo label="No. comparendo">
              <Input value={datos.comparendo} onChange={(e) => set('comparendo', e.target.value)} placeholder="17-001-…" />
            </Campo>
            <Campo label="No. de acta / proceso">
              <Input value={datos.proceso} onChange={(e) => set('proceso', e.target.value)} placeholder="2026-0000" />
            </Campo>
            <Campo label="Solicitado (infractor)">
              <Input value={datos.solicitado} onChange={(e) => set('solicitado', e.target.value)} />
            </Campo>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12 }}>
              <Campo label="Cédula">
                <Input value={datos.cedula} onChange={(e) => set('cedula', e.target.value)} />
              </Campo>
              <Campo label="Teléfono">
                <Input value={datos.telefono} onChange={(e) => set('telefono', e.target.value)} placeholder="NO APORTA" />
              </Campo>
            </div>
            <Campo label="Dirección">
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
              <Campo label="Fecha del acta">
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  value={dayjs(datos.fechaResolucion)}
                  onChange={(d) => d && set('fechaResolucion', d.format('YYYY-MM-DD'))}
                />
              </Campo>
            </div>
            <Campo label="Artículo y numeral (Ley 1801)">
              <Input
                value={datos.articuloNumeral}
                onChange={(e) => set('articuloNumeral', e.target.value)}
                placeholder="Artículo 140 Numeral 14"
              />
            </Campo>
            <Campo label="Procedencia (CAI)">
              <Input value={datos.solicitante} onChange={(e) => set('solicitante', e.target.value)} />
            </Campo>
            <Campo label="Hechos">
              <Input.TextArea
                autoSize={{ minRows: 2, maxRows: 5 }}
                value={datos.hechos}
                onChange={(e) => set('hechos', e.target.value)}
              />
            </Campo>
            <Campo label="Multa general (art. 180)">
              <Select
                style={{ width: '100%' }}
                value={datos.tipoMulta}
                onChange={(v) => set('tipoMulta', v)}
                options={([1, 2, 3, 4] as TipoMulta[]).map((t) => ({
                  value: t,
                  label: `Tipo ${t} (${MULTA_GENERAL[t].smdlv} SMDLV)`,
                }))}
              />
            </Campo>

            {!tipoAdmitido && via.restriccion && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16, borderRadius: 14 }}
                message="Esta vía no procede para el tipo de multa"
                description={via.restriccion(datos.tipoMulta)}
              />
            )}

            {via.camposPropios(datos, set)}
          </Bloque>

          {/* El despacho (municipio/inspector/inspección) ya no se edita
              aquí, viene de Ajustes. */}
          <div
            style={{
              borderTop: `1px solid ${PALETA.borde}`,
              paddingTop: ESPACIO.lg,
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                disabled={!acta}
                onClick={() => acta && void descargarDocumentoLegalPdf(acta, inspeccion.membreteDataUrl)}
                style={{ fontWeight: 600 }}
              >
                Descargar PDF
              </Button>
              <Button
                icon={<FileWordOutlined />}
                disabled={!acta}
                onClick={() => acta && void descargarDocumentoLegalDocx(acta, inspeccion.membreteDataUrl)}
              >
                Descargar .docx
              </Button>
              <Button icon={<PrinterOutlined />} disabled={!acta} onClick={() => window.print()}>
                Imprimir
              </Button>
              <ExpedientePrevioButton
                ruta={via.clave}
                disabled={!listoParaGenerar}
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
          </div>
        </section>

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
              <div style={{ fontSize: TEXTO.titulo }}>
                {tipoAdmitido
                  ? 'Cargue el comparendo y complete los datos; el acta se redacta aquí en tiempo real.'
                  : 'Esta vía no procede para el tipo de multa cargado, así que no se redacta acta.'}
              </div>
            </div>
          ) : (
            <VistaPreviaActa acta={acta} membreteDataUrl={inspeccion.membreteDataUrl} />
          )}
        </div>
      </div>
    </div>
  );
}
