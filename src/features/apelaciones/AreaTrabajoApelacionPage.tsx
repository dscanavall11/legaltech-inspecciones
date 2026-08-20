import { useCallback } from 'react';
import { AreaTrabajoExpediente } from '@/shared/expediente/AreaTrabajoExpediente';
import type { PasoExpediente } from '@/shared/expediente/tipos';
import { ResumenDocumentos } from '@/shared/expediente/resumenes';
import { DocumentosExpediente } from '@/shared/documentos/DocumentosExpediente';
import { parseCaseMetadata, type LegalCase } from '@/shared/legalCases/types';
import { AreaTrabajoApelacion } from './AreaTrabajoApelacion';
import { faltantesParaAuto, leerRecurso } from './recursoApelacion';

const TEXTOS = {
  titulo: 'Apelaciones',
  descripcion:
    'Recurso contra la medida correctiva de este despacho. Aquí se verifica la oportunidad, se concede en el efecto devolutivo y se remite: quien resuelve es el superior jerárquico (Ley 1801, arts. 205.8 y 205.14). El archivo completo del despacho está en Mis procesos.',
  documentosEsperados: 'Escrito del recurso, decisión apelada, acta de audiencia. PDF, Word o imagen.',
  buscar: 'O abrir una ya radicada',
  vacio: 'Suelte el escrito del recurso y la decisión apelada, o elija una apelación ya radicada.',
};

interface MetadataApelacion {
  asunto?: string;
}

const comportamientoDe = (caso: LegalCase) =>
  parseCaseMetadata<MetadataApelacion>(caso.caseMetadata).asunto ??
  caso.background?.allegedFacts ??
  'Comportamiento no registrado';

function ResumenRecurso({ caso }: { caso: LegalCase }) {
  const faltantes = faltantesParaAuto(leerRecurso(caso.caseMetadata));
  return <>{faltantes.length === 0 ? 'Listo para el auto' : `Faltan ${faltantes.length} datos`}</>;
}

/**
 * La apelación, con el mismo recorrido y el mismo riel que la querella y la
 * queja. Son DOS pasos y no cinco a propósito: este despacho no practica
 * pruebas ni redacta un fallo sobre el recurso —eso es del superior—, así que
 * modelar esos pasos aquí invitaría a usarlos.
 */
export function AreaTrabajoApelacionPage() {
  const pasos = useCallback(
    (): PasoExpediente[] => [
      {
        clave: 'documentos',
        titulo: 'Documentos',
        ayuda: 'El escrito del recurso y la decisión apelada.',
        Resumen: ResumenDocumentos,
        render: (caso) => <DocumentosExpediente caseId={caso.id} />,
      },
      {
        clave: 'recurso',
        titulo: 'Concesión y remisión',
        ayuda: 'Oportunidad, efecto en que se concede y auto que remite al superior.',
        Resumen: ResumenRecurso,
        render: (caso) => (
          <AreaTrabajoApelacion
            caseId={caso.id}
            radicado={caso.filingNumber}
            comportamiento={comportamientoDe(caso)}
            caseMetadataRaw={caso.caseMetadata}
          />
        ),
      },
    ],
    [],
  );

  return (
    <AreaTrabajoExpediente
      caseType="apelacion"
      className="Apelación"
      textos={TEXTOS}
      pasos={pasos}
    />
  );
}
