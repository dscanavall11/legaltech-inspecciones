import { useCallback } from 'react';
import { AreaTrabajoExpediente } from '@/shared/expediente/AreaTrabajoExpediente';
import type { PasoExpediente } from '@/shared/expediente/tipos';
import {
  ResumenDocumentos,
  ResumenFallo,
  ResumenPruebas,
} from '@/shared/expediente/resumenes';
import { DocumentosExpediente } from '@/shared/documentos/DocumentosExpediente';
import { PruebasExpediente } from '@/shared/pruebas/PruebasExpediente';
import { OrientacionesInspector } from '@/shared/orientaciones/OrientacionesInspector';
import { AnalisisPage } from '@/features/analisis/AnalisisPage';
import { Bloque } from '@/shared/ui/Bloque';
import { ESPACIO } from '@/theme/escala';
import type { LegalCase } from '@/shared/legalCases/types';
import { PartesQuejaForm } from './PartesQuejaForm';
import { faltantesParaDecision, leerPartesQueja } from './partesQueja';

const TEXTOS = {
  titulo: 'Quejas',
  descripcion:
    'Expediente del comparendo impugnado: proceso verbal abreviado de los comparendos objetados dentro de los tres días hábiles siguientes a la notificación (art. 223A, Ley 1801 de 2016). El archivo completo del despacho está en Mis procesos.',
  documentosEsperados: 'Comparendo, escrito de objeción, pruebas. PDF, Word o imagen.',
  buscar: 'O abrir una ya radicada',
  vacio: 'Suelte el comparendo y la objeción, o elija una queja ya radicada para empezar.',
};

function ResumenPartesQueja({ caso }: { caso: LegalCase }) {
  const faltantes = faltantesParaDecision(leerPartesQueja(caso.caseMetadata));
  return (
    <>
      {faltantes.length === 0
        ? 'Infractor y comparendo identificados'
        : `Faltan ${faltantes.length} datos`}
    </>
  );
}

/**
 * La queja, expresada como los cinco pasos del área de trabajo genérica.
 * Mismo recorrido y mismo riel que la querella: lo único que cambia es el
 * vocabulario del trámite y que aquí hay un solo sujeto procesal.
 */
export function AreaTrabajoQueja() {
  const pasos = useCallback(
    ({ recienDeDocumentos }: { recienDeDocumentos: boolean }): PasoExpediente[] => [
      {
        clave: 'documentos',
        titulo: 'Documentos',
        ayuda: 'El comparendo y el escrito de objeción. De aquí sale el análisis.',
        Resumen: ResumenDocumentos,
        render: (caso, { readOnly }) => <DocumentosExpediente caseId={caso.id} readOnly={readOnly} />,
      },
      {
        clave: 'datos',
        titulo: 'Datos del proceso',
        ayuda: 'Presunto infractor y comparendo impugnado (art. 223A, Ley 1801 de 2016).',
        Resumen: ResumenPartesQueja,
        render: (caso, { readOnly }) => (
          <PartesQuejaForm
            caseId={caso.id}
            caseMetadataRaw={caso.caseMetadata}
            autoExtraer={recienDeDocumentos}
            readOnly={readOnly}
          />
        ),
      },
      {
        clave: 'pruebas',
        titulo: 'Pruebas',
        ayuda: 'Cada pieza con quién la aporta y para qué. Se valoran en el aparte 5.',
        Resumen: ResumenPruebas,
        render: (caso, { readOnly }) => <PruebasExpediente caseId={caso.id} readOnly={readOnly} />,
      },
      {
        clave: 'decision',
        titulo: 'Proyecto de decisión',
        ayuda: 'Sus instrucciones, el borrador, la revisión y la descarga en Word.',
        Resumen: ResumenFallo,
        render: (caso, { readOnly }) => (
          <>
            {/* La orientación era un paso aparte, pero es lo que el inspector le
                dice a la IA antes de que redacte: pertenece a este mismo sitio. */}
            <Bloque
              titulo="Su orientación para este documento"
              ayuda="Instrucciones y dudas del funcionario. Nunca hechos probados."
              style={{ marginBottom: ESPACIO.lg }}
            >
              <OrientacionesInspector caseId={caso.id} caseMetadataRaw={caso.caseMetadata} readOnly={readOnly} />
            </Bloque>
            <AnalisisPage caseId={caso.id} embebido autoGenerar={recienDeDocumentos} readOnly={readOnly} />
          </>
        ),
      },
    ],
    [],
  );

  return (
    <AreaTrabajoExpediente caseType="queja" className="Queja" textos={TEXTOS} pasos={pasos} />
  );
}
