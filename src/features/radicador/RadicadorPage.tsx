import { useState } from 'react';
import { IntakePage } from '@/features/intake/IntakePage';
import { RadicarDocumentoPage } from './RadicarDocumentoPage';
import { SelectorTipoRadicacion } from './SelectorTipoRadicacion';
import { metaDe, type TipoRadicacion } from './tipoRadicacion';

/**
 * Radicador unificado: un solo chat inteligente. Los tres trámites que este
 * despacho radica viven en el selector del sidebar derecho; al cambiar de tipo
 * cambian el chat y los campos de la ficha. Querella y queja usan el flujo de
 * intake; la apelación, el de recurso (subida + campos).
 */
export function RadicadorPage() {
  const [tipo, setTipo] = useState<TipoRadicacion>('querella');
  const selector = <SelectorTipoRadicacion tipo={tipo} onChange={setTipo} />;

  return metaDe(tipo).familia === 'intake' ? (
    <IntakePage key={tipo} selector={selector} />
  ) : (
    <RadicarDocumentoPage key={tipo} selector={selector} />
  );
}
