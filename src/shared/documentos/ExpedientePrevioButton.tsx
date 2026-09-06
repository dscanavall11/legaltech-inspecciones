import { useState } from 'react';
import { Button, DatePicker, Input, Modal, Space, App } from 'antd';
import { FolderOpenOutlined, DownloadOutlined, FileWordOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { generarExpedientePrevio, type RutaExpediente } from '@/derecho';
import { descargarDocumentoLegalPdf } from './documentoLegalPdf';
import { descargarDocumentoLegalDocx } from './documentoLegalDocx';
import { TEXTO } from '@/theme/escala';

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
}

/**
 * Botón "Descargar expediente", compartido por ActasFirmezaPage y
 * ProntoPagoPage (firmeza, pronto pago y conmutación): compone el legajo de
 * TRES piezas (carátula + constancia de recepción + constancia de
 * inasistencia o de comparecencia y solicitud, según `ruta`).
 *
 * Es un documento INDEPENDIENTE del acta — el inspector aclaró
 * expresamente que expediente y acta son dos descargas separadas, no una
 * sola: por eso este componente ya no recibe el acta generada, solo los
 * datos propios del legajo (Open/Closed — cualquier `ruta` sirve sin tocar
 * este archivo). Pide en un modal los pocos datos que la página que lo
 * invoca no trae (identificación de archivo, firmante secretarial, fecha
 * de recepción y, en pronto pago/conmutación, fecha de comparecencia).
 */
export function ExpedientePrevioButton({
  ruta,
  disabled,
  membreteDataUrl,
  datosBase,
}: {
  ruta: RutaExpediente;
  disabled?: boolean;
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
  // Por defecto igual a la fecha del comparendo ("normalmente" coincide), pero editable.
  const [fechaRecepcion, setFechaRecepcion] = useState(datosBase.fechaComparendo);
  const [fechaComparecencia, setFechaComparecencia] = useState(dayjs().format('YYYY-MM-DD'));
  const [generando, setGenerando] = useState<'pdf' | 'docx' | null>(null);

  function construirExpediente() {
    return generarExpedientePrevio({
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
      fechaRecepcion,
      fechaResolucion: dayjs().format('YYYY-MM-DD'),
      hechos: datosBase.hechos,
      firmanteNombre,
      firmanteRol,
      ruta,
      fechaComparecencia: ruta === 'firmeza' ? undefined : fechaComparecencia,
    });
  }

  async function generar(formato: 'pdf' | 'docx') {
    if (!firmanteNombre.trim()) {
      message.warning('Indique quién suscribe la constancia secretarial del expediente.');
      return;
    }
    const expedientePrevio = construirExpediente();
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
      <Button icon={<FolderOpenOutlined />} disabled={disabled} onClick={() => setAbierto(true)}>
        Descargar expediente
      </Button>
      <Modal
        title="Expediente — datos del legajo"
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
            <div style={{ fontSize: TEXTO.menor, marginBottom: 4 }}>Unidad del archivo</div>
            <Input value={unidad} onChange={(e) => setUnidad(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: TEXTO.menor, marginBottom: 4 }}>Grupo</div>
            <Input value={grupo} onChange={(e) => setGrupo(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: TEXTO.menor, marginBottom: 4 }}>No. de expediente</div>
            <Input value={expediente} onChange={(e) => setExpediente(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: TEXTO.menor, marginBottom: 4 }}>Suscribe las constancias secretariales</div>
            <Input
              value={firmanteNombre}
              onChange={(e) => setFirmanteNombre(e.target.value)}
              placeholder="Nombre del auxiliar administrativo"
            />
          </div>
          <div>
            <div style={{ fontSize: TEXTO.menor, marginBottom: 4 }}>Cargo</div>
            <Input value={firmanteRol} onChange={(e) => setFirmanteRol(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: TEXTO.menor, marginBottom: 4 }}>
              Fecha de recepción del comparendo (cargue al sistema — normalmente coincide con la del comparendo, pero es editable)
            </div>
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              value={dayjs(fechaRecepcion)}
              onChange={(d) => d && setFechaRecepcion(d.format('YYYY-MM-DD'))}
            />
          </div>
          {ruta !== 'firmeza' && (
            <div>
              <div style={{ fontSize: TEXTO.menor, marginBottom: 4 }}>Fecha de comparecencia y solicitud</div>
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                value={dayjs(fechaComparecencia)}
                onChange={(d) => d && setFechaComparecencia(d.format('YYYY-MM-DD'))}
              />
            </div>
          )}
        </Space>
      </Modal>
    </>
  );
}
