import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';

/**
 * Sistema de diseño — estética Google / Gemini: superficies blancas, mucho
 * aire, esquinas redondeadas, sombras suaves y paleta sobria.
 *
 * Paleta institucional (colores Google):
 *  azul #1a73e8 · rojo #d93025 · amarillo #f9ab00 · verde #1e8e3e
 *
 * Accesibilidad: tipografía base grande y controlable, controles altos.
 */
export const PALETA = {
  azul: '#1a73e8',
  azulOscuro: '#1967d2',
  azulSuave: '#eef3fc', // fondo de estado activo (suave)
  rojo: '#d93025',
  amarillo: '#f9ab00',
  verde: '#1e8e3e',
  texto: '#202124', // Google grey 900
  textoSuave: '#5f6368', // Google grey 700
  textoTenue: '#80868b', // grey 600 — para etiquetas
  superficie: '#ffffff',
  fondo: '#fafafa', // fondo casi blanco, más minimalista
  borde: '#ececef', // bordes muy tenues
} as const;

// Elevación apenas perceptible — estética minimalista, sin sombras marcadas.
export const ELEVACION = {
  base: '0 1px 2px rgba(60,64,67,.05), 0 1px 1px rgba(60,64,67,.04)',
  media: '0 2px 6px rgba(60,64,67,.07)',
} as const;

export function buildTheme(opts: {
  fontSize: number;
  highContrast: boolean;
}): ThemeConfig {
  const { fontSize, highContrast } = opts;

  return {
    algorithm: highContrast
      ? [antdTheme.defaultAlgorithm, antdTheme.compactAlgorithm]
      : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: PALETA.azul,
      colorInfo: PALETA.azul,
      colorSuccess: PALETA.verde,
      colorWarning: PALETA.amarillo,
      colorError: PALETA.rojo,
      colorTextBase: PALETA.texto,
      colorTextSecondary: PALETA.textoSuave,
      colorBgLayout: PALETA.fondo,
      colorBorderSecondary: PALETA.borde,
      colorBorder: PALETA.borde,
      fontFamily:
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontSize,
      // Encabezados contenidos — menos peso visual, más minimalista.
      fontSizeHeading1: 26,
      fontSizeHeading2: 21,
      fontSizeHeading3: 17,
      fontSizeHeading4: 15,
      fontSizeHeading5: 13,
      lineHeight: 1.55,
      borderRadius: 10,
      borderRadiusLG: 14,
      controlHeight: 38,
      wireframe: false,
    },
    components: {
      Layout: {
        headerBg: PALETA.superficie,
        headerHeight: 60,
        siderBg: PALETA.superficie,
        bodyBg: PALETA.fondo,
      },
      Menu: {
        itemBg: 'transparent',
        itemHeight: 42,
        itemBorderRadius: 20, // píldoras suaves
        itemSelectedBg: PALETA.azulSuave,
        itemSelectedColor: PALETA.azulOscuro,
        itemColor: PALETA.textoSuave,
        itemHoverBg: '#f4f4f6',
        fontSize,
        iconSize: fontSize + 1,
      },
      Button: {
        controlHeight: 40,
        borderRadius: 20, // botones tipo "pill"
        fontWeight: 500,
        primaryShadow: 'none',
        defaultShadow: 'none',
      },
      Card: {
        borderRadiusLG: 14,
        paddingLG: 22,
      },
      Table: {
        cellPaddingBlock: 14,
        headerBg: 'transparent',
        headerColor: PALETA.textoTenue,
        headerSplitColor: 'transparent',
        borderColor: PALETA.borde,
        rowHoverBg: '#f7f9fc',
      },
      Tabs: { titleFontSize: fontSize },
      Input: { borderRadius: 20, controlHeight: 40 },
      Segmented: { borderRadius: 16, trackBg: '#f1f3f4' },
      Tag: { borderRadiusSM: 6 },
      Descriptions: { itemPaddingBottom: 14, colonMarginRight: 0 },
    },
  };
}
