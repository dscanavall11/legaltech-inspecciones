import { useState } from 'react';
import { Alert, Button, DatePicker, Modal, Space, App } from 'antd';
import { FileWordOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import {
  camposFaltantesExpedienteOficial,
  mapearCamposExpedienteOficial,
  nombreArchivoExpedienteOficial,
} from '@/derecho/plantillas/expedienteOficial';
import {
  cargarPlantillaExpedienteOficial,
  descargarExpedienteOficialDocx,
  PlantillaExpedienteNoDisponibleError,
} from './expedienteOficialDocx';
import { TEXTO } from '@/theme/escala';

export interface DatosRegistroExpediente {
  proceso: string;
  comparendo: string;
  articuloNumeral: string;
  solicitante: string;
  solicitado: string;
  cedula: string;
  direccion: string;
  telefono: string;
  fechaComparendo: string; // ISO
  hechos: string;
}

/**
 * Botón "Descargar Expediente" — documento INDEPENDIENTE del acta, generado
 * rellenando la plantilla oficial real del despacho
 * (`public/Plantillas/expediente-oficial.docx`) con los datos del mismo
 * registro ya seleccionado. No redacta ni sintetiza texto (a diferencia de
 * `ExpedientePrevioButton`, que arma un `DocumentoLegal` desde cero): solo
 * reemplaza los campos de combinación de correspondencia (MERGEFIELD) del
 * DOCX real, así que conserva membrete, logos, tablas y estilos originales.
 * A diferencia del Acta, esta plantilla no bifurca por género — no hay nada
 * que preguntar en ese sentido.
 *
 * Un solo dato no viene en la BD y el inspector debe confirmarlo aquí, nunca
 * inventado: la fecha de la constancia de inasistencia (se sugiere la del
 * término de firmeza ya calculado, pero exige confirmación explícita antes
 * de generar).
 */
export function DescargarExpedienteOficialButton({
  disabled,
  registro,
  fechaConstanciaSugerida,
}: {
  disabled?: boolean;
  registro: DatosRegistroExpediente;
  fechaConstanciaSugerida?: Dayjs | null;
}) {
  const { message } = App.useApp();
  const [abierto, setAbierto] = useState(false);
  const [fechaConstancia, setFechaConstancia] = useState<string | null>(
    fechaConstanciaSugerida ? fechaConstanciaSugerida.format('YYYY-MM-DD') : null,
  );
  const [confirmada, setConfirmada] = useState(false);
  const [generando, setGenerando] = useState(false);

  function abrir() {
    setConfirmada(false);
    setFechaConstancia(fechaConstanciaSugerida ? fechaConstanciaSugerida.format('YYYY-MM-DD') : null);
    setAbierto(true);
  }

  async function generar() {
    const faltantes = camposFaltantesExpedienteOficial(registro);
    if (faltantes.length > 0) {
      message.error(`Faltan datos del registro seleccionado: ${faltantes.join(', ')}.`);
      return;
    }
    if (!fechaConstancia || !confirmada) {
      message.warning('DEBE CONFIRMAR LA FECHA DE LA CONSTANCIA DE INASISTENCIA');
      return;
    }
    setGenerando(true);
    try {
      const plantilla = await cargarPlantillaExpedienteOficial();
      const campos = mapearCamposExpedienteOficial({
        proceso: registro.proceso,
        comparendo: registro.comparendo,
        articuloNumeral: registro.articuloNumeral,
        solicitante: registro.solicitante,
        solicitado: registro.solicitado,
        cedula: registro.cedula,
        direccion: registro.direccion,
        telefono: registro.telefono,
        fechaComparendo: registro.fechaComparendo,
        hechos: registro.hechos,
        fechaRecepcion: registro.fechaComparendo,
        fechaConstanciaInasistencia: fechaConstancia,
      });
      const nombreArchivo = nombreArchivoExpedienteOficial(registro.proceso, registro.solicitado);
      const { camposSinDato } = await descargarExpedienteOficialDocx(plantilla, campos, nombreArchivo);
      if (camposSinDato.length > 0) {
        message.warning(
          `Expediente generado, pero la plantilla trae campos sin dato disponible (quedaron en blanco): ${camposSinDato.join(', ')}.`,
        );
      } else {
        message.success('Expediente generado.');
      }
      setAbierto(false);
    } catch (e) {
      message.error(
        e instanceof PlantillaExpedienteNoDisponibleError ? e.message : 'No se pudo generar el expediente.',
      );
    } finally {
      setGenerando(false);
    }
  }

  return (
    <>
      <Button icon={<FileWordOutlined />} disabled={disabled} onClick={abrir}>
        Descargar Expediente (plantilla oficial)
      </Button>
      <Modal
        title="Expediente — confirmación de datos"
        open={abierto}
        onCancel={() => setAbierto(false)}
        footer={
          <Space>
            <Button onClick={() => setAbierto(false)}>Cerrar</Button>
            <Button type="primary" icon={<FileWordOutlined />} loading={generando} onClick={() => void generar()}>
              Generar expediente (.docx)
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size={14}>
          <Alert
            type="info"
            showIcon
            message="Plantilla oficial del despacho"
            description="Se usa el DOCX real del expediente solo con los datos de este registro. Nada se completa, corrige ni deduce con IA."
          />
          <div>
            <div style={{ fontSize: TEXTO.menor, marginBottom: 4 }}>
              Fecha de la constancia de inasistencia
              {fechaConstanciaSugerida
                ? ' — sugerida por el término de firmeza ya calculado; confírmela o ajústela'
                : ' — no hay fecha calculada; ingrésela y confírmela'}
            </div>
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              value={fechaConstancia ? dayjs(fechaConstancia) : null}
              onChange={(d) => {
                setFechaConstancia(d ? d.format('YYYY-MM-DD') : null);
                setConfirmada(false);
              }}
            />
          </div>
          {fechaConstancia && !confirmada && (
            <Alert
              type="warning"
              showIcon
              message="DEBE CONFIRMAR LA FECHA DE LA CONSTANCIA DE INASISTENCIA"
              action={
                <Button size="small" onClick={() => setConfirmada(true)}>
                  Confirmar fecha
                </Button>
              }
            />
          )}
          {confirmada && (
            <Alert type="success" showIcon message="Fecha de la constancia de inasistencia confirmada." />
          )}
        </Space>
      </Modal>
    </>
  );
}
