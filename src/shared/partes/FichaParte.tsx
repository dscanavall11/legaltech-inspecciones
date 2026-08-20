import { Input, Select } from 'antd';
import { Bloque } from '@/shared/ui/Bloque';
import { Campo } from '@/shared/ui/Campo';
import { ESPACIO } from '@/theme/escala';
import { TIPOS_IDENTIFICACION, type DatosParte } from './parte';

export interface FichaParteProps {
  titulo: string;
  ayuda: string;
  parte: DatosParte;
  onChange: (p: DatosParte) => void;
}

/**
 * La ficha de identificación de una parte. Los mismos campos sirven al
 * querellante, al querellado y al presunto infractor de una queja: lo que
 * cambia entre trámites es el rótulo y la norma que lo exige, no los datos que
 * hay que recoger para notificar y para nombrarla en la decisión.
 */
export function FichaParte({ titulo, ayuda, parte, onChange }: FichaParteProps) {
  const set = <K extends keyof DatosParte>(k: K, v: DatosParte[K]) => onChange({ ...parte, [k]: v });

  return (
    <Bloque titulo={titulo} ayuda={ayuda}>
      <div style={{ display: 'grid', gap: ESPACIO.md }}>
        <Campo label="Nombre completo">
          <Input value={parte.nombre} onChange={(e) => set('nombre', e.target.value)} />
        </Campo>

        <div style={{ display: 'grid', gridTemplateColumns: '96px 1fr', gap: ESPACIO.md }}>
          <Campo label="Tipo">
            <Select
              style={{ width: '100%' }}
              value={parte.tipoIdentificacion}
              onChange={(v) => set('tipoIdentificacion', v)}
              options={TIPOS_IDENTIFICACION.map((t) => ({ value: t, label: t }))}
            />
          </Campo>
          <Campo label="Número de identificación">
            <Input
              value={parte.identificacion}
              onChange={(e) => set('identificacion', e.target.value)}
            />
          </Campo>
        </div>

        <Campo label="Dirección de notificación">
          <Input value={parte.direccion} onChange={(e) => set('direccion', e.target.value)} />
        </Campo>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: ESPACIO.md }}>
          <Campo label="Teléfono">
            <Input value={parte.telefono} onChange={(e) => set('telefono', e.target.value)} />
          </Campo>
          <Campo label="Correo electrónico">
            <Input value={parte.correo} onChange={(e) => set('correo', e.target.value)} />
          </Campo>
        </div>

        <Campo label="Apoderado (opcional)">
          <Input
            value={parte.apoderado}
            onChange={(e) => set('apoderado', e.target.value)}
            placeholder="No se requiere abogado (art. 2.2.8.18.4.3)"
          />
        </Campo>
      </div>
    </Bloque>
  );
}
