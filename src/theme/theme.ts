import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';
import { PALETA, ELEVACION } from './palette';

export { PALETA, ELEVACION } from './palette';

/**
 * Sistema de diseño — superficies planas estilo Google/Material (como
 * resguardo-saas): blanco sólido, borde de 1px, una sola sombra discreta.
 * Nada de backdrop-filter ni sombras en capas en el contenido principal — el
 * cristal se reserva para el Dock, el buscador y el fondo del Launchpad
 * (ver theme/glass.ts), que son la única "chrome" flotante de la app.
 */
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
      fontSizeHeading1: 24,
      fontSizeHeading2: 20,
      fontSizeHeading3: 16,
      fontSizeHeading4: 14,
      fontSizeHeading5: 13,
      lineHeight: 1.5,
      borderRadius: 10,
      borderRadiusLG: 12,
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
        itemBorderRadius: 10,
        itemSelectedBg: PALETA.azulSuave,
        itemSelectedColor: PALETA.azulOscuro,
        itemColor: PALETA.textoSuave,
        itemHoverBg: '#f1f3f4',
        fontSize,
        iconSize: fontSize + 1,
        itemHoverColor: PALETA.texto,
        itemActiveBg: PALETA.azulSuave,
      },
      Button: {
        controlHeight: 40,
        borderRadius: 999,
        borderRadiusLG: 999,
        fontWeight: 500,
        primaryShadow: 'none',
        defaultShadow: 'none',
        defaultBg: PALETA.superficie,
        defaultBorderColor: PALETA.borde,
        defaultHoverBg: '#f1f3f4',
        defaultActiveBg: PALETA.azulSuave,
      },
      Card: {
        borderRadiusLG: 12,
        paddingLG: 22,
        colorBgContainer: PALETA.superficie,
        colorBorderSecondary: PALETA.borde,
        boxShadow: 'none',
        boxShadowSecondary: ELEVACION.base,
      },
      Table: {
        cellPaddingBlock: 14,
        headerBg: 'transparent',
        headerColor: PALETA.textoTenue,
        headerSplitColor: 'transparent',
        borderColor: PALETA.borde,
        rowHoverBg: '#f1f3f4',
      },
      Tabs: { titleFontSize: fontSize },
      Input: {
        borderRadius: 10,
        controlHeight: 40,
        colorBgContainer: PALETA.superficie,
        colorBorder: PALETA.borde,
        paddingBlock: 8,
        paddingInline: 14,
      },
      Select: {
        borderRadius: 10,
        controlHeight: 40,
        colorBgContainer: PALETA.superficie,
        colorBorder: PALETA.borde,
        optionSelectedBg: PALETA.azulSuave,
        optionSelectedColor: PALETA.azulOscuro,
      },
      Segmented: {
        borderRadius: 10,
        trackBg: '#f1f3f4',
        itemSelectedBg: PALETA.superficie,
        itemSelectedColor: PALETA.azul,
        itemHoverBg: 'rgba(0,0,0,0.04)',
      },
      Tag: {
        borderRadiusSM: 999,
        lineWidth: 0,
        colorBgContainer: '#f1f3f4',
        colorBorder: PALETA.borde,
      },
      Modal: { borderRadiusLG: 16, contentBg: PALETA.superficie, boxShadow: ELEVACION.media },
      Drawer: { borderRadiusLG: 16, boxShadow: ELEVACION.media },
      Popover: { borderRadiusLG: 12, colorBgContainer: PALETA.superficie, boxShadow: ELEVACION.media },
      Tooltip: { borderRadius: 8, colorBgContainer: 'rgba(32,33,36,0.92)', boxShadow: ELEVACION.base },
      Dropdown: { borderRadiusLG: 12, colorBgContainer: PALETA.superficie, boxShadow: ELEVACION.media },
      Descriptions: { itemPaddingBottom: 14, colonMarginRight: 0 },
      Pagination: { borderRadius: 8, itemBg: PALETA.superficie, itemActiveBg: PALETA.azul },
      Breadcrumb: { separatorColor: PALETA.textoTenue, linkColor: PALETA.textoSuave },
      Alert: { borderRadiusLG: 12, colorBgContainer: PALETA.superficie, colorBorder: PALETA.borde },
      Message: { colorBgContainer: PALETA.superficie, boxShadow: ELEVACION.media },
      Notification: { borderRadiusLG: 12, colorBgContainer: PALETA.superficie, boxShadow: ELEVACION.media },
    },
  };
}
