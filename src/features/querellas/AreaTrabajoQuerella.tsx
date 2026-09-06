import { useCallback } from 'react';
import { AreaTrabajoExpediente } from '@/shared/expediente/AreaTrabajoExpediente';
import type { PasoExpediente } from '@/shared/expediente/tipos';
import { DocumentosExpediente } from '@/shared/documentos/DocumentosExpediente';
import { PruebasExpediente } from '@/shared/pruebas/PruebasExpediente';
import { OrientacionesInspector } from '@/shared/orientaciones/OrientacionesInspector';
import { AnalisisPage } from '@/features/analisis/AnalisisPage';
import { Bloque } from '@/shared/ui/Bloque';
import { ESPACIO } from '@/theme/escala';
import {
  ResumenDocumentos,
  ResumenFallo,
  ResumenPruebas,
} from '@/shared/expediente/resumenes';
import { PartesQuerellaForm } from './PartesQuerellaForm';
import { ResumenPartesQuerella } from './ResumenPartesQuerella';

const TEXTOS = {
  titulo: 'Querellas',
  descripcion:
    'Proceso verbal abreviado por querella ciudadana (art. 223, Ley 1801 de 2016). El archivo completo del despacho está en Mis procesos.',
  documentosEsperados: 'Querella, contestación, actas, pruebas. PDF, Word o imagen.',
  buscar: 'O abrir una ya radicada',
  vacio: 'Suelte los documentos de la querella o elija una ya radicada para empezar.',
};

/**
 * La querella, expresada como los cinco pasos del área de trabajo genérica.
 * Aquí no hay layout: solo el vocabulario del trámite y qué componente atiende
 * cada paso. El recorrido, el riel y la navegación viven en
 * `shared/expediente/AreaTrabajoExpediente`, que la queja reutiliza igual.
 */
export function AreaTrabajoQuerella() {
  const pasos = useCallback(
    ({ recienDeDocumentos }: { recienDeDocumentos: boolean }): PasoExpediente[] => [
      {
        clave: 'documentos',
        titulo: 'Documentos',
        ayuda: 'Lo que hay en el expediente. De aquí sale el análisis.',
        Resumen: ResumenDocumentos,
        render: (caso, { readOnly }) => <DocumentosExpediente caseId={caso.id} readOnly={readOnly} />,
      },
      {
        clave: 'datos',
        titulo: 'Datos del proceso',
        ayuda: 'Querellante, querellado y calidad en que actúa (art. 2.2.8.18.4.1).',
        Resumen: ResumenPartesQuerella,
        render: (caso, { readOnly }) => (
          <PartesQuerellaForm
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
        clave: 'fallo',
        titulo: 'Proyecto de fallo',
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
    <AreaTrabajoExpediente
      caseType="querella"
      className="Querella"
      textos={TEXTOS}
      pasos={pasos}
    />
  );
}
