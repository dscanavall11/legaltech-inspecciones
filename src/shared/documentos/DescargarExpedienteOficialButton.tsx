import { useState } from 'react';
import { Alert, Button, DatePicker, Modal, Select, Space, App } from 'antd';
import { FileWordOutlined, FolderOpenOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import {
  camposFaltantesExpedienteOficial,
  mapearCamposExpedienteOficial,
  nombreArchivoExpedienteOficial,
  type GeneroCiudadano,
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
 * rellenando la plantilla oficial real del despacho (EXPEDIENTE
 * PLANTILLA.docx) con los datos del mismo registro ya seleccionado. No
 * redacta ni sintetiza texto (a diferencia de `ExpedientePrevioButton`, que
 * arma un `DocumentoLegal` desde cero): solo reemplaza los tags del DOCX
 * real, así que conserva membrete, logos, tablas y estilos originales.
 *
 * Dos datos no vienen en la BD y el inspector debe confirmarlos aquí, nunca
 * inferidos: el género (afecta "señor/señora", "presunto/presunta") y la
 * fecha de la constancia de inasistencia (se sugiere la del término de
 * firmeza ya calculado, pero exige confirmación explícita antes de generar).
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
  const [genero, setGenero] = useState<GeneroCiudadano | undefined>(undefined);
  const [fechaConstancia, setFechaConstancia] = useState<string | null>(
    fechaConstanciaSugerida ? fechaConstanciaSugerida.format('YYYY-MM-DD') : null,
  );
  const [confirmada, setConfirmada] = useState(false);
  const [generando, setGenerando] = useState(false);

  function abrir() {
    setGenero(undefined);
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
    if (!genero) {
      message.warning('Confirme el género del presunto infractor — no se infiere del nombre.');
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
        genero,
      });
      const nombreArchivo = nombreArchivoExpedienteOficial(registro.proceso, registro.solicitado);
      await descargarExpedienteOficialDocx(plantilla, campos, nombreArchivo);
      message.success('Expediente generado.');
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
      <Button icon={<FolderOpenOutlined />} disabled={disabled} onClick={abrir}>
        Descargar Expediente
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
            description="Se usa el DOCX real EXPEDIENTE PLANTILLA.docx solo con los datos de este registro. Nada se completa, corrige ni deduce con IA."
          />
          <div>
            <div style={{ fontSize: TEXTO.menor, marginBottom: 4 }}>
              Género del presunto infractor (no se infiere del nombre)
            </div>
            <Select
              style={{ width: '100%' }}
              placeholder="Seleccione…"
              value={genero}
              onChange={setGenero}
              options={[
                { value: 'masculino', label: 'Masculino — el señor / presunto' },
                { value: 'femenino', label: 'Femenino — la señora / presunta' },
              ]}
            />
          </div>
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
