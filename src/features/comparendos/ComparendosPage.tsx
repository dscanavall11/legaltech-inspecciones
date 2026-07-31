import { useMemo, useRef, useState } from 'react';
import {
  Table,
  Tag,
  Input,
  Typography,
  Space,
  Button,
  Alert,
  Card,
  Modal,
  DatePicker,
  Select,
  Spin,
  Tooltip,
  App,
} from 'antd';
import { PlusOutlined, SearchOutlined, RightOutlined, FilePdfOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useComparendos, useCreateComparendo, type NuevoComparendoInput } from './api';
import { ESTADO_COMPARENDO_COLOR, ESTADO_COMPARENDO_LABEL, type Comparendo } from './types';
import { extraerComparendoPdf } from '@/features/actas/extraerComparendoPdf';
import type { Comparendo as ComparendoExtraido } from '@/features/actas/comparendos';
import {
  ETAPAS_COMPARENDO,
  ETAPA_COMPARENDO_ACTIVA,
  MULTA_GENERAL,
  INCREMENTO_LABEL,
  buscarComportamiento,
  type TipoMulta,
  type CausalIncremento,
} from '@/derecho';
import { ELEVACION, PALETA } from '@/theme/theme';

const { Title } = Typography;

/** Riel compacto de etapa para la fila del listado — versión en miniatura de EtapaProcesal. */
function EtapaMini({ activa }: { activa: number }) {
  return (
    <Tooltip title={`Etapa: ${ETAPAS_COMPARENDO[activa]}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {ETAPAS_COMPARENDO.map((etapa, i) => (
          <span
            key={etapa}
            style={{
              width: i === activa ? 8 : 6,
              height: i === activa ? 8 : 6,
              borderRadius: '50%',
              background: i <= activa ? PALETA.azul : '#d6d9de',
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    </Tooltip>
  );
}

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
};

/** Modal de radicación: sube el PDF de la orden de comparendo y extrae los campos (mismo motor que Actas de firmeza). */
function ModalRadicarComparendo({
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
            placeholder="Bien jurídico protegido (autocompletado por el catálogo, editable)"
            value={datos.bienJuridico}
            onChange={(e) => set('bienJuridico', e.target.value)}
            style={{ gridColumn: '1 / span 2' }}
          />
          <Input
            placeholder="Medidas correctivas previstas (autocompletadas por el catálogo, editable)"
            value={datos.medidasCorrectivas}
            onChange={(e) => set('medidasCorrectivas', e.target.value)}
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

export function ComparendosPage() {
  const { data, isLoading, isError } = useComparendos();
  const [busqueda, setBusqueda] = useState('');
  const [modalRadicar, setModalRadicar] = useState(false);
  const navigate = useNavigate();

  const filtrados = useMemo(() => {
    if (!data) return [];
    const q = busqueda.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (item) =>
        item.radicado.toLowerCase().includes(q) ||
        item.numeroComparendo.toLowerCase().includes(q) ||
        item.infractor.toLowerCase().includes(q) ||
        item.articuloNumeral.toLowerCase().includes(q),
    );
  }, [data, busqueda]);

  const columns: ColumnsType<Comparendo> = [
    {
      title: 'Radicado',
      dataIndex: 'radicado',
      key: 'radicado',
      render: (v: string) => (
        <span className="font-display" style={{ fontSize: 15 }}>
          {v}
        </span>
      ),
    },
    { title: 'No. comparendo', dataIndex: 'numeroComparendo', key: 'numeroComparendo' },
    { title: 'Infractor', dataIndex: 'infractor', key: 'infractor' },
    {
      title: 'Artículo',
      dataIndex: 'articuloNumeral',
      key: 'articuloNumeral',
      ellipsis: true,
      responsive: ['lg'],
    },
    {
      title: 'Fecha',
      dataIndex: 'fechaComparendo',
      key: 'fechaComparendo',
      render: (v: string) => dayjs(v).format('D MMM YYYY'),
      responsive: ['md'],
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado: Comparendo['estado']) => (
        <Tag color={ESTADO_COMPARENDO_COLOR[estado]}>{ESTADO_COMPARENDO_LABEL[estado]}</Tag>
      ),
      filters: Object.entries(ESTADO_COMPARENDO_LABEL).map(([value, text]) => ({ text, value })),
      onFilter: (value, record) => record.estado === value,
    },
    {
      title: 'Etapa',
      key: 'etapa',
      width: 90,
      render: (_, record) => <EtapaMini activa={ETAPA_COMPARENDO_ACTIVA[record.estado]} />,
    },
    {
      title: '',
      key: 'accion',
      width: 48,
      render: () => <RightOutlined style={{ color: '#9aa0a6' }} />,
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Comparendos
        </Title>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setModalRadicar(true)}>
          Radicar comparendo
        </Button>
      </div>

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="No se pudieron cargar los comparendos"
          description="Verifica tu conexión o intenta de nuevo en unos minutos."
        />
      ) : (
        <Card variant="borderless" style={{ boxShadow: ELEVACION.base }} styles={{ body: { padding: 8 } }}>
          <div style={{ padding: '6px 6px 10px' }}>
            <Input
              allowClear
              placeholder="Buscar por radicado, comparendo, infractor o artículo"
              prefix={<SearchOutlined />}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ maxWidth: 480 }}
            />
          </div>
          <Table<Comparendo>
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={filtrados}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 'max-content' }}
            onRow={(record) => ({
              onClick: () => navigate(`/panel/comparendos/${record.id}`),
              style: { cursor: 'pointer' },
            })}
          />
        </Card>
      )}

      <ModalRadicarComparendo
        abierto={modalRadicar}
        onCerrar={() => setModalRadicar(false)}
        onRadicado={(id) => {
          setModalRadicar(false);
          navigate(`/panel/comparendos/${id}`);
        }}
      />
    </Space>
  );
}
