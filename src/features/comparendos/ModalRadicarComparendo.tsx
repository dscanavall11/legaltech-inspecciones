import { useRef, useState } from 'react';
import { Alert, App, Button, DatePicker, Input, Modal, Select, Space, Spin, Tag } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCreateComparendo, type NuevoComparendoInput } from './api';
import { extraerComparendoPdf } from '@/features/actas/extraerComparendoPdf';
import type { Comparendo as ComparendoExtraido } from '@/features/actas/comparendos';
import {
  INCREMENTO_LABEL,
  MULTA_GENERAL,
  buscarComportamiento,
  type CausalIncremento,
  type TipoMulta,
} from '@/derecho';

/**
 * Radicación de comparendos. Vive aparte de la bandeja de quejas porque radicar
 * no es un trámite del expediente: es la puerta de entrada, y se abre desde la
 * barra superior junto a la radicación general.
 */

const TIPO_MULTA_OPCIONES = ([1, 2, 3, 4] as TipoMulta[]).map((t) => ({
  value: t,
  label: `Tipo ${t} (${MULTA_GENERAL[t].smdlv} SMDLV)`,
}));

const CAUSAL_OPCIONES = (Object.entries(INCREMENTO_LABEL) as [CausalIncremento, string][]).map(
  ([value, label]) => ({ value, label }),
);

const CAMPO_VACIO: NuevoComparendoInput = {
  numeroComparendo: '',
  solicitado: '',
  cedula: '',
  direccion: '',
  telefono: '',
  lugar: '',
  fechaComparendo: '',
  solicitante: '',
  articuloNumeral: '',
  descripcionConducta: '',
  bienJuridico: '',
  medidasCorrectivas: '',
  hechos: '',
  tipoMulta: 1,
  causal: 'ninguna',
  medidaPolicia: '',
  autoridadPolicia: '',
  interponeApelacion: false,
  sustentacionApelacion: '',
  medidaInspector: '',
  descargos: '',
};

/** Modal de radicación: sube el PDF de la orden de comparendo y extrae los campos (mismo motor que Actas de firmeza). */
export function ModalRadicarComparendo({
  abierto,
  onCerrar,
  onRadicado,
}: {
  abierto: boolean;
  onCerrar: () => void;
  onRadicado: (id: string) => void;
}) {
  const { message } = App.useApp();
  const crear = useCreateComparendo();
  const archivoRef = useRef<HTMLInputElement>(null);
  const [datos, setDatos] = useState<NuevoComparendoInput>(CAMPO_VACIO);
  const [extrayendo, setExtrayendo] = useState(false);
  const [camposDetectados, setCamposDetectados] = useState<string[]>([]);
  const [pdfEscaneado, setPdfEscaneado] = useState(false);

  function set<K extends keyof NuevoComparendoInput>(k: K, v: NuevoComparendoInput[K]) {
    setDatos((prev) => ({ ...prev, [k]: v }));
  }

  /**
   * Al cambiar el artículo/numeral, autocompleta descripcionConducta,
   * bienJuridico y medidasCorrectivas desde el catálogo normativo
   * (src/derecho/catalogoComportamientos.ts) — solo si el inspector aún no
   * los diligenció a mano, para no pisar una corrección ya hecha.
   */
  function aplicarArticulo(valor: string) {
    const catalogo = buscarComportamiento(valor);
    setDatos((prev) => ({
      ...prev,
      articuloNumeral: valor,
      descripcionConducta: prev.descripcionConducta || catalogo?.descripcionConducta || '',
      bienJuridico: prev.bienJuridico || catalogo?.bienJuridico || '',
      medidasCorrectivas: prev.medidasCorrectivas || catalogo?.medidasCorrectivas || '',
    }));
  }

  async function cargarPdf(archivo: File | undefined) {
    if (!archivo) return;
    setExtrayendo(true);
    setPdfEscaneado(false);
    setCamposDetectados([]);
    try {
      const { datos: extraidos, camposDetectados: detectados, textoDisponible } = await extraerComparendoPdf(archivo);
      if (!textoDisponible) {
        setPdfEscaneado(true);
        return;
      }
      const e = extraidos as Partial<ComparendoExtraido>;
      setDatos((prev) => {
        const articuloNumeral = e.articuloNumeral ?? prev.articuloNumeral;
        const catalogo = buscarComportamiento(articuloNumeral);
        return {
          ...prev,
          numeroComparendo: e.comparendo ?? prev.numeroComparendo,
          solicitado: e.solicitado ?? prev.solicitado,
          cedula: e.cedula ?? prev.cedula,
          direccion: e.direccion ?? prev.direccion,
          telefono: e.telefono ?? prev.telefono,
          lugar: e.lugar ?? prev.lugar,
          fechaComparendo: e.fechaComparendo ?? prev.fechaComparendo,
          solicitante: e.solicitante ?? prev.solicitante,
          articuloNumeral,
          // El PDF (Literal RNMC) manda si trae texto; si no, cae al catálogo.
          descripcionConducta: e.descripcionConducta ?? catalogo?.descripcionConducta ?? prev.descripcionConducta,
          bienJuridico: prev.bienJuridico || catalogo?.bienJuridico || '',
          medidasCorrectivas: prev.medidasCorrectivas || catalogo?.medidasCorrectivas || '',
          hechos: e.hechos ?? prev.hechos,
          tipoMulta: e.tipoMulta ?? prev.tipoMulta,
          // Nuevos campos del PDF
          medidaPolicia: e.medidaPolicia ?? prev.medidaPolicia,
          autoridadPolicia: e.autoridadPolicia ?? prev.autoridadPolicia,
          interponeApelacion: e.interponeApelacion ?? prev.interponeApelacion,
          sustentacionApelacion: e.sustentacionApelacion ?? prev.sustentacionApelacion,
          medidaInspector: e.medidaInspector ?? prev.medidaInspector,
          descargos: e.descargos ?? prev.descargos,
        };
      });
      setCamposDetectados(detectados);
      message.success(`Comparendo leído: ${detectados.length} campos extraídos. Verifíquelos antes de radicar.`);
    } catch {
      message.error('No fue posible leer el PDF.');
    } finally {
      setExtrayendo(false);
      if (archivoRef.current) archivoRef.current.value = '';
    }
  }

  function radicar() {
    crear.mutate(datos, {
      onSuccess: (caso) => {
        message.success(`Comparendo radicado — expediente ${caso.filingNumber}.`);
        setDatos(CAMPO_VACIO);
        setCamposDetectados([]);
        onRadicado(caso.id);
      },
      onError: () => message.error('No se pudo radicar el comparendo. Intente de nuevo.'),
    });
  }

  const listoParaRadicar = Boolean(
    datos.numeroComparendo && datos.solicitado && datos.cedula && datos.fechaComparendo && datos.articuloNumeral,
  );

  return (
    <Modal
      open={abierto}
      title="Radicar comparendo"
      width={640}
      okText="Radicar"
      cancelText="Cancelar"
      okButtonProps={{ disabled: !listoParaRadicar, loading: crear.isPending }}
      onCancel={onCerrar}
      onOk={radicar}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 8 }}>
        <input
          ref={archivoRef}
          type="file"
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={(e) => void cargarPdf(e.target.files?.[0])}
        />
        <Button
          icon={extrayendo ? <Spin size="small" /> : <FilePdfOutlined />}
          block
          disabled={extrayendo}
          onClick={() => archivoRef.current?.click()}
        >
          {extrayendo ? 'Leyendo comparendo…' : 'Subir PDF de la orden de comparendo'}
        </Button>
        {camposDetectados.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {camposDetectados.map((c) => (
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
            message="Comparendo escaneado sin capa de texto"
            description="Diligencie los datos manualmente a continuación."
          />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12, rowGap: 10 }}>
          <Input
            placeholder="No. de comparendo"
            value={datos.numeroComparendo}
            onChange={(e) => set('numeroComparendo', e.target.value)}
          />
          <Input
            placeholder="Cédula del infractor"
            value={datos.cedula}
            onChange={(e) => set('cedula', e.target.value)}
          />
          <Input
            placeholder="Nombre completo del infractor"
            value={datos.solicitado}
            onChange={(e) => set('solicitado', e.target.value)}
            style={{ gridColumn: '1 / span 2' }}
          />
          <Input placeholder="Teléfono" value={datos.telefono} onChange={(e) => set('telefono', e.target.value)} />
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            placeholder="Fecha del comparendo"
            value={datos.fechaComparendo ? dayjs(datos.fechaComparendo) : null}
            onChange={(d) => set('fechaComparendo', d ? d.format('YYYY-MM-DD') : '')}
          />
          <Input
            placeholder="Dirección del infractor"
            value={datos.direccion}
            onChange={(e) => set('direccion', e.target.value)}
            style={{ gridColumn: '1 / span 2' }}
          />
          <Input
            placeholder="Lugar del comportamiento"
            value={datos.lugar}
            onChange={(e) => set('lugar', e.target.value)}
          />
          <Input
            placeholder="Procedencia (CAI)"
            value={datos.solicitante}
            onChange={(e) => set('solicitante', e.target.value)}
          />
          <Input
            placeholder="Artículo y numeral (Ley 1801)"
            value={datos.articuloNumeral}
            onChange={(e) => aplicarArticulo(e.target.value)}
            style={{ gridColumn: '1 / span 2' }}
          />
          <Input
            placeholder="Descripción de la conducta (autocompletada por el catálogo, editable)"
            value={datos.descripcionConducta}
            onChange={(e) => set('descripcionConducta', e.target.value)}
            style={{ gridColumn: '1 / span 2' }}
          />
          <Input
            placeholder="Medida dictada por la policía (ej: DESTRUCCIÓN DE BIEN)"
            value={datos.medidaPolicia}
            onChange={(e) => set('medidaPolicia', e.target.value)}
            style={{ gridColumn: '1 / span 2' }}
          />
          <Input
            placeholder="Autoridad (CAI, placa, grado, nombre)"
            value={datos.autoridadPolicia}
            onChange={(e) => set('autoridadPolicia', e.target.value)}
            style={{ gridColumn: '1 / span 2' }}
          />
          <Input
            placeholder="Descargos del infractor"
            value={datos.descargos}
            onChange={(e) => set('descargos', e.target.value)}
            style={{ gridColumn: '1 / span 2' }}
          />
          <Select
            style={{ width: '100%' }}
            placeholder="¿Interpone recurso de apelación?"
            value={datos.interponeApelacion}
            onChange={(v) => set('interponeApelacion', v)}
            options={[
              { value: true, label: 'Sí' },
              { value: false, label: 'No' },
            ]}
          />
          <Input
            placeholder="Sustentación del recurso"
            value={datos.sustentacionApelacion}
            onChange={(e) => set('sustentacionApelacion', e.target.value)}
          />
          <Input
            placeholder="Medida señalada por el inspector"
            value={datos.medidaInspector}
            onChange={(e) => set('medidaInspector', e.target.value)}
            style={{ gridColumn: '1 / span 2' }}
          />
          <Select
            style={{ width: '100%' }}
            value={datos.tipoMulta}
            onChange={(v) => set('tipoMulta', v)}
            options={TIPO_MULTA_OPCIONES}
          />
          <Select
            style={{ width: '100%' }}
            value={datos.causal}
            onChange={(v) => set('causal', v)}
            options={CAUSAL_OPCIONES}
          />
        </div>
        <Input.TextArea
          rows={3}
          placeholder="Hechos (descripción del comportamiento)"
          value={datos.hechos}
          onChange={(e) => set('hechos', e.target.value)}
        />
      </Space>
    </Modal>
  );
}
