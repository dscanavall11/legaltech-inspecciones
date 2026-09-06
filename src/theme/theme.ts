import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';
import { PALETA, ELEVACION } from './palette';
import { RADIO } from './escala';

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
        "'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontSize,
      fontSizeHeading1: fontSize + 9,
      fontSizeHeading2: fontSize + 7,
      fontSizeHeading3: fontSize + 3,
      fontSizeHeading4: fontSize + 1,
      fontSizeHeading5: fontSize,
      lineHeight: 1.5,
      borderRadius: RADIO.control,
      borderRadiusLG: RADIO.bloque,
      controlHeight: 34,
      wireframe: false,
    },
    components: {
      Layout: {
        headerBg: PALETA.superficie,
        headerHeight: 56,
        siderBg: PALETA.superficie,
        bodyBg: PALETA.fondo,
      },
      Menu: {
        itemBg: 'transparent',
        itemHeight: 38,
        itemBorderRadius: RADIO.control,
        itemSelectedBg: PALETA.azulSuave,
        itemSelectedColor: PALETA.azulOscuro,
        itemColor: PALETA.textoSuave,
        itemHoverBg: '#efede7',
        fontSize,
        iconSize: fontSize + 1,
        itemHoverColor: PALETA.texto,
        itemActiveBg: PALETA.azulSuave,
      },
      Button: {
        controlHeight: 34,
        borderRadius: RADIO.control,
        borderRadiusLG: RADIO.control,
        fontWeight: 500,
        primaryShadow: 'none',
        defaultShadow: 'none',
        defaultBg: PALETA.superficie,
        defaultBorderColor: PALETA.borde,
        defaultHoverBg: '#efede7',
        defaultActiveBg: PALETA.azulSuave,
      },
      Card: {
        borderRadiusLG: RADIO.tarjeta,
        paddingLG: 16,
        // Vidrio esmerilado: el blur y el borde de luz los pone index.css
        // (.ant-card); acá solo la translucidez del fondo.
        colorBgContainer: 'rgba(255, 255, 255, 0.66)',
        colorBorderSecondary: PALETA.borde,
        boxShadow: 'none',
        boxShadowSecondary: ELEVACION.base,
      },
      Table: {
        cellPaddingBlock: 8,
        colorBgContainer: 'transparent',
        headerBg: 'transparent',
        headerColor: PALETA.textoTenue,
        headerSplitColor: 'transparent',
        borderColor: PALETA.borde,
        rowHoverBg: 'rgba(255, 255, 255, 0.55)',
      },
      Tabs: { titleFontSize: fontSize },
      Input: {
        borderRadius: RADIO.control,
        controlHeight: 34,
        colorBgContainer: PALETA.superficie,
        colorBorder: PALETA.borde,
        activeShadow: `0 0 0 3px ${PALETA.azulSuave}`,
        hoverBorderColor: PALETA.azul,
        paddingBlock: 5,
        paddingInline: 11,
      },
      Select: {
        borderRadius: RADIO.control,
        controlHeight: 34,
        colorBgContainer: PALETA.superficie,
        colorBorder: PALETA.borde,
        optionSelectedBg: PALETA.azulSuave,
        optionSelectedColor: PALETA.azulOscuro,
        optionActiveBg: '#efede7',
        optionFontSize: fontSize,
        controlOutline: PALETA.azulSuave,
      },
      DatePicker: {
        borderRadius: RADIO.control,
        controlHeight: 34,
        colorBgContainer: PALETA.superficie,
        colorBorder: PALETA.borde,
        activeShadow: `0 0 0 3px ${PALETA.azulSuave}`,
        hoverBorderColor: PALETA.azul,
        cellActiveWithRangeBg: PALETA.azulSuave,
      },
      Checkbox: { borderRadiusSM: 6 },
      Radio: { buttonSolidCheckedBg: PALETA.azul },
      Segmented: {
        borderRadius: RADIO.control,
        trackBg: '#eceae3',
        itemSelectedBg: PALETA.superficie,
        itemSelectedColor: PALETA.azul,
        itemHoverBg: 'rgba(0,0,0,0.04)',
      },
      Tag: {
        borderRadiusSM: 6,
        lineWidth: 0,
        colorBgContainer: '#efede7',
        colorBorder: PALETA.borde,
      },
      Modal: { borderRadiusLG: RADIO.tarjeta, contentBg: PALETA.superficie, boxShadow: ELEVACION.media },
      Drawer: { borderRadiusLG: RADIO.tarjeta, boxShadow: ELEVACION.media },
      Popover: { borderRadiusLG: RADIO.bloque, colorBgContainer: PALETA.superficie, boxShadow: ELEVACION.media },
      Tooltip: { borderRadius: RADIO.control, colorBgContainer: 'rgba(32,33,36,0.92)', boxShadow: ELEVACION.base },
      Dropdown: { borderRadiusLG: RADIO.bloque, colorBgContainer: PALETA.superficie, boxShadow: ELEVACION.media },
      Descriptions: { itemPaddingBottom: 10, colonMarginRight: 0 },
      Pagination: { borderRadius: RADIO.control, itemBg: PALETA.superficie, itemActiveBg: PALETA.azul },
      Breadcrumb: { separatorColor: PALETA.textoTenue, linkColor: PALETA.textoSuave },
      Alert: { borderRadiusLG: RADIO.bloque, colorBgContainer: PALETA.superficie, colorBorder: PALETA.borde },
      Message: { colorBgContainer: PALETA.superficie, boxShadow: ELEVACION.media },
      Notification: { borderRadiusLG: RADIO.bloque, colorBgContainer: PALETA.superficie, boxShadow: ELEVACION.media },
    },
  };
}
