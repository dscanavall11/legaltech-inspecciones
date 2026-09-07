import { useEffect, useState } from 'react';
import { Alert, Button, Input, Modal, Select, Space, App } from 'antd';
import { FileWordOutlined } from '@ant-design/icons';
import { detectarGeneroCiudadano } from '@/derecho/generoDetectado';
import {
  seleccionarPlantillaActaFirmeza,
  type CasoEspecialActa,
  type CausalActa,
  type GeneroCiudadano,
} from '@/derecho/plantillas/catalogoActaFirmeza';
import {
  camposFaltantesActaFirmezaOficial,
  mapearCamposActaFirmezaOficial,
  nombreArchivoActaFirmezaOficial,
  valoresFijosActaFirmeza,
  type DatosActaFirmezaOficial,
} from '@/derecho/plantillas/actaFirmezaOficial';
import {
  cargarPlantillaActaFirmeza,
  descargarActaFirmezaOficialDocx,
  PlantillaActaFirmezaNoDisponibleError,
} from './actaFirmezaOficialDocx';
import { TEXTO } from '@/theme/escala';

export interface DatosRegistroActaFirmeza
  extends Omit<DatosActaFirmezaOficial, 'caso' | 'representanteNombre' | 'representanteCedula'> {}

const OPCIONES_CASO: { value: CasoEspecialActa; label: string }[] = [
  { value: 'normal', label: 'Persona natural (caso común)' },
  { value: 'extranjero', label: 'Persona natural — cédula de extranjería' },
  { value: 'menor_representante_legal', label: 'Menor de edad, representado por representante legal' },
  { value: 'establecimiento_comercio', label: 'Establecimiento de comercio' },
];

const REQUIERE_REPRESENTANTE: CasoEspecialActa[] = ['menor_representante_legal', 'establecimiento_comercio'];
const CAUSAL_LABEL: Record<CausalActa, string> = {
  ninguna: 'Sin reincidencia',
  reiteracion_dentro_del_anio: 'Reiteración dentro del año (+75%)',
  reiteracion_despues_del_anio: 'Reiteración después del año (+50%)',
  moroso_bdme: 'Moroso BDME (+50%)',
};

/**
 * Botón "Descargar Acta de Firmeza (plantilla oficial)" — usa el catálogo
 * determinístico (`catalogoActaFirmeza.ts`) para elegir, entre las 13
 * plantillas .docx reales del despacho, la que corresponde exactamente al
 * caso, género, tipo de multa y causal ya definidos en el formulario.
 *
 * Es ADICIONAL al botón "Descargar .docx" existente (que sintetiza el acta
 * desde cero con `documentoLegalDocx.ts`): esta ruta abre el archivo real
 * del despacho y solo reemplaza los datos variables, así que conserva
 * membrete, logos, tablas y estilos originales byte a byte.
 *
 * Si la combinación no tiene plantilla real (p. ej. tipo de multa 1, causal
 * moroso BDME, o mujer con reincidencia — ninguna de esas existe hoy), no se
 * intenta adivinar "la más parecida": se bloquea con un mensaje explícito.
 */
export function DescargarActaFirmezaOficialButton({
  disabled,
  registro,
}: {
  disabled?: boolean;
  registro: DatosRegistroActaFirmeza;
}) {
  const { message } = App.useApp();
  const [abierto, setAbierto] = useState(false);
  const [caso, setCaso] = useState<CasoEspecialActa>('normal');
  // null = sin decidir todavía (ni detectado ni elegido a mano) — nunca arranca en un
  // género por defecto, para no inducir a generar con el que quedó de un registro anterior.
  const [genero, setGenero] = useState<GeneroCiudadano | null>(null);
  const [generoCorregidoManualmente, setGeneroCorregidoManualmente] = useState(false);
  const [representanteNombre, setRepresentanteNombre] = useState('');
  const [representanteCedula, setRepresentanteCedula] = useState('');
  const [generando, setGenerando] = useState(false);

  // Detección automática por evidencia textual del comparendo (hechos) — nunca por el
  // nombre, nunca con IA generativa. Se recalcula cada vez que cambia el registro o se
  // vuelve a abrir el modal; una corrección manual del inspector no se pisa mientras el
  // modal siga abierto sobre el mismo registro.
  const generoDetectado = detectarGeneroCiudadano(registro.hechos);
  useEffect(() => {
    if (abierto && !generoCorregidoManualmente) setGenero(generoDetectado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, registro.hechos]);

  const seleccion =
    genero &&
    seleccionarPlantillaActaFirmeza({
      caso,
      genero,
      tipoMulta: registro.tipoMulta as 1 | 2 | 3 | 4,
      causal: registro.liquidacion.causal,
    });

  async function generar() {
    const faltantes = camposFaltantesActaFirmezaOficial(registro);
    if (faltantes.length > 0) {
      message.error(`Faltan datos del registro seleccionado: ${faltantes.join(', ')}.`);
      return;
    }
    if (caso === 'normal' && !genero) {
      message.error('NO SE PUDO DETERMINAR EL GÉNERO CON CERTEZA. Selecciónelo manualmente antes de generar.');
      return;
    }
    if (!seleccion) {
      message.error(
        'No existe una plantilla oficial real para esta combinación (caso, género, tipo de multa y causal). Seleccione manualmente en Word o ajuste los datos.',
      );
      return;
    }
    if (REQUIERE_REPRESENTANTE.includes(caso) && (!representanteNombre.trim() || !representanteCedula.trim())) {
      message.warning('Indique el nombre y la cédula del representante legal.');
      return;
    }
    setGenerando(true);
    try {
      const plantilla = await cargarPlantillaActaFirmeza(seleccion.archivo);
      const campos = mapearCamposActaFirmezaOficial({
        ...registro,
        caso,
        representanteNombre: REQUIERE_REPRESENTANTE.includes(caso) ? representanteNombre : undefined,
        representanteCedula: REQUIERE_REPRESENTANTE.includes(caso) ? representanteCedula : undefined,
      });
      const nombreArchivo = nombreArchivoActaFirmezaOficial(registro.proceso, registro.solicitado);
      const valoresFijos = valoresFijosActaFirmeza(registro.liquidacion);
      const { camposSinDato } = await descargarActaFirmezaOficialDocx(plantilla, campos, valoresFijos, nombreArchivo);
      if (camposSinDato.length > 0) {
        message.warning(`Acta generada, pero quedaron en blanco campos sin dato: ${camposSinDato.join(', ')}.`);
      } else {
        message.success('Acta de firmeza (plantilla oficial) generada.');
      }
      setAbierto(false);
    } catch (e) {
      message.error(
        e instanceof PlantillaActaFirmezaNoDisponibleError ? e.message : 'No se pudo generar el acta.',
      );
    } finally {
      setGenerando(false);
    }
  }

  return (
    <>
      <Button
        icon={<FileWordOutlined />}
        disabled={disabled}
        onClick={() => {
          setGeneroCorregidoManualmente(false);
          setAbierto(true);
        }}
      >
        Descargar Acta (plantilla oficial)
      </Button>
      <Modal
        title="Acta de firmeza — plantilla oficial del despacho"
        open={abierto}
        onCancel={() => setAbierto(false)}
        footer={
          <Space>
            <Button onClick={() => setAbierto(false)}>Cerrar</Button>
            <Button type="primary" icon={<FileWordOutlined />} loading={generando} disabled={!seleccion} onClick={() => void generar()}>
              Generar acta (.docx)
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size={14}>
          <div>
            <div style={{ fontSize: TEXTO.menor, marginBottom: 4 }}>Caso</div>
            <Select style={{ width: '100%' }} value={caso} onChange={setCaso} options={OPCIONES_CASO} />
          </div>
          {caso === 'normal' && (
            <div>
              <div style={{ fontSize: TEXTO.menor, marginBottom: 4 }}>
                Género del presunto infractor (nunca se infiere del nombre)
              </div>
              <Select
                style={{ width: '100%' }}
                placeholder="Seleccione…"
                value={genero ?? undefined}
                onChange={(v) => {
                  setGenero(v);
                  setGeneroCorregidoManualmente(true);
                }}
                options={[
                  { value: 'masculino', label: 'Masculino' },
                  { value: 'femenino', label: 'Femenino' },
                ]}
              />
              {generoDetectado && !generoCorregidoManualmente && (
                <Alert
                  type="success"
                  showIcon
                  style={{ marginTop: 8 }}
                  message={`Género detectado automáticamente: ${generoDetectado === 'masculino' ? 'Masculino' : 'Femenino'}`}
                  description="Por evidencia textual explícita en los hechos del comparendo (nunca por el nombre). Puede corregirlo arriba si no corresponde."
                />
              )}
              {!generoDetectado && !generoCorregidoManualmente && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginTop: 8 }}
                  message="NO SE PUDO DETERMINAR EL GÉNERO CON CERTEZA"
                  description="Los hechos del comparendo no traen una marca de género inequívoca (o traen de ambos). Selecciónelo manualmente."
                />
              )}
            </div>
          )}
          {REQUIERE_REPRESENTANTE.includes(caso) && (
            <>
              <div>
                <div style={{ fontSize: TEXTO.menor, marginBottom: 4 }}>
                  {caso === 'establecimiento_comercio' ? 'Razón social del establecimiento' : 'Nombre del representante legal'}
                </div>
                <Input value={representanteNombre} onChange={(e) => setRepresentanteNombre(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: TEXTO.menor, marginBottom: 4 }}>
                  {caso === 'establecimiento_comercio' ? 'NIT del establecimiento' : 'Cédula del representante legal'}
                </div>
                <Input value={representanteCedula} onChange={(e) => setRepresentanteCedula(e.target.value)} />
              </div>
            </>
          )}

          <Alert
            type="info"
            showIcon
            message={`Tipo de multa ${registro.tipoMulta} · ${CAUSAL_LABEL[registro.liquidacion.causal]}`}
            description="Tomados del formulario del acta — no se piden de nuevo."
          />

          {seleccion ? (
            <>
              <Alert type="info" showIcon message="Plantilla que se usará" description={seleccion.archivo} />
              {seleccion.advertencias.map((a, i) => (
                <Alert key={i} type="warning" showIcon message={a} />
              ))}
            </>
          ) : (
            <Alert
              type="error"
              showIcon
              message="No existe una plantilla oficial real para esta combinación"
              description="No se elige automáticamente 'la más parecida'. Cambie el caso/género o gestione el acta manualmente en Word para esta combinación."
            />
          )}
        </Space>
      </Modal>
    </>
  );
}
