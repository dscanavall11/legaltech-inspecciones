import { Segmented, Tooltip } from 'antd';
import { useSettingsStore, type FontScale } from '@/store/settingsStore';

/**
 * Control A / A+ / A++ siempre visible. Pensado para que un inspector de edad
 * avanzada pueda agrandar toda la interfaz sin buscar en menús de configuración.
 */
export function FontSizeControl() {
  const fontScale = useSettingsStore((s) => s.fontScale);
  const setFontScale = useSettingsStore((s) => s.setFontScale);

  return (
    <Tooltip title="Tamaño del texto">
      <Segmented<FontScale>
        value={fontScale}
        onChange={setFontScale}
        options={[
          { label: 'A', value: 'normal' },
          { label: 'A+', value: 'large' },
          { label: 'A++', value: 'xlarge' },
        ]}
        aria-label="Cambiar tamaño del texto"
      />
    </Tooltip>
  );
}
