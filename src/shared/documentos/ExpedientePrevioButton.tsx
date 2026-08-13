import { useState } from 'react';
import { Button, DatePicker, Input, Modal, Space, App } from 'antd';
import { FolderOpenOutlined, DownloadOutlined, FileWordOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  generarExpedientePrevio,
  type DocumentoLegal,
  type TipoActaFinal,
  type TipoMulta,
} from '@/derecho';
import { descargarDocumentoLegalPdf } from './documentoLegalPdf';
import { descargarDocumentoLegalDocx } from './documentoLegalDocx';

export interface DatosExpedienteBase {
  municipio: string;
  inspeccion: string;
  proceso: string;
  comparendo: string;
  articuloNumeral: string;
  solicitante: string;
  solicitado: string;
  cedulaSolicitado: string;
  direccionSolicitado?: string;
  telefonoSolicitado?: string;
  fechaComparendo: string; // ISO
  hechos: string;
  tipoMulta: TipoMulta;
}

/**
 * Botón "Descargar expediente", compartido por ActasFirmezaPage y
 * ProntoPagoPage (firmeza, pronto pago y conmutación): compone el legajo
 * previo (carátula + constancias + consulta RNMC + acta final) a partir del
 * acta ya generada por la página que lo invoca, sin conocer qué generador la
 * produjo (Open/Closed — cualquier `DocumentoLegal` + su `TipoActaFinal` sirve).
 * Pide en un modal los pocos datos que el acta no trae (identificación de
 * archivo, firmante secretarial, consulta RNMC).
 */
export function ExpedientePrevioButton({
  acta,
  tipoActaFinal,
  membreteDataUrl,
  datosBase,
}: {
  acta: DocumentoLegal | null;
  tipoActaFinal: TipoActaFinal;
  membreteDataUrl?: string | null;
  datosBase: DatosExpedienteBase;
}) {
  const { message } = App.useApp();
  const [abierto, setAbierto] = useState(false);
  const [unidad, setUnidad] = useState('Seguridad Ciudadana');
  const [grupo, setGrupo] = useState(datosBase.inspeccion);
  const [expediente, setExpediente] = useState(datosBase.proceso);
  const [firmanteNombre, setFirmanteNombre] = useState('');
  const [firmanteRol, setFirmanteRol] = useState('Auxiliar Administrativo');
  const [rnmcFechaConsulta, setRnmcFechaConsulta] = useState(dayjs().format('YYYY-MM-DD'));
  const [rnmcEstado, setRnmcEstado] = useState('EN PROCESO');
  const [generando, setGenerando] = useState<'pdf' | 'docx' | null>(null);

  function construirExpediente() {
    if (!acta) return null;
    return generarExpedientePrevio(
      {
        municipio: datosBase.municipio,
        inspeccion: datosBase.inspeccion,
        unidad,
        grupo,
        anio: new Date(datosBase.fechaComparendo).getFullYear() || new Date().getFullYear(),
        expediente,
        proceso: datosBase.proceso,
        comparendo: datosBase.comparendo,
        articuloNumeral: datosBase.articuloNumeral,
        solicitante: datosBase.solicitante,
        solicitado: datosBase.solicitado,
        cedulaSolicitado: datosBase.cedulaSolicitado,
        direccionSolicitado: datosBase.direccionSolicitado,
        telefonoSolicitado: datosBase.telefonoSolicitado,
        fechaComparendo: datosBase.fechaComparendo,
        fechaResolucion: dayjs().format('YYYY-MM-DD'),
        hechos: datosBase.hechos,
        tipoMulta: datosBase.tipoMulta,
        firmanteNombre,
        firmanteRol,
        rnmcFechaConsulta,
        rnmcEstado,
        tipoActaFinal,
      },
      acta,
    );
  }

  async function generar(formato: 'pdf' | 'docx') {
    if (!firmanteNombre.trim()) {
      message.warning('Indique quién suscribe la constancia secretarial del expediente.');
      return;
    }
    const expedientePrevio = construirExpediente();
    if (!expedientePrevio) return;
    setGenerando(formato);
    try {
      if (formato === 'pdf') await descargarDocumentoLegalPdf(expedientePrevio, membreteDataUrl);
      else await descargarDocumentoLegalDocx(expedientePrevio, membreteDataUrl);
      message.success('Expediente generado.');
    } catch {
      message.error('No se pudo generar el expediente.');
    } finally {
      setGenerando(null);
    }
  }

  return (
    <>
      <Button icon={<FolderOpenOutlined />} disabled={!acta} onClick={() => setAbierto(true)}>
        Descargar expediente
      </Button>
      <Modal
        title="Expediente previo — datos del legajo"
        open={abierto}
        onCancel={() => setAbierto(false)}
        footer={
          <Space>
            <Button onClick={() => setAbierto(false)}>Cerrar</Button>
            <Button icon={<FileWordOutlined />} loading={generando === 'docx'} onClick={() => void generar('docx')}>
              Descargar .docx
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={generando === 'pdf'}
              onClick={() => void generar('pdf')}
            >
              Descargar PDF
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <div>
            <div style={{ fontSize: 12, marginBottom: 4 }}>Unidad del archivo</div>
            <Input value={unidad} onChange={(e) => setUnidad(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 12, marginBottom: 4 }}>Grupo</div>
            <Input value={grupo} onChange={(e) => setGrupo(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 12, marginBottom: 4 }}>No. de expediente</div>
            <Input value={expediente} onChange={(e) => setExpediente(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 12, marginBottom: 4 }}>Suscribe la constancia secretarial</div>
            <Input
              value={firmanteNombre}
              onChange={(e) => setFirmanteNombre(e.target.value)}
              placeholder="Nombre del auxiliar administrativo"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, marginBottom: 4 }}>Cargo</div>
            <Input value={firmanteRol} onChange={(e) => setFirmanteRol(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 12, marginBottom: 4 }}>Fecha de consulta RNMC</div>
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              value={dayjs(rnmcFechaConsulta)}
              onChange={(d) => d && setRnmcFechaConsulta(d.format('YYYY-MM-DD'))}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, marginBottom: 4 }}>Estado reportado por el RNMC</div>
            <Input value={rnmcEstado} onChange={(e) => setRnmcEstado(e.target.value)} />
          </div>
        </Space>
      </Modal>
    </>
  );
}
