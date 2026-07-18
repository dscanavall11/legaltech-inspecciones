import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';
import {
  PALETA,
  glassShadowLiquid,
  glassShadowLiquidHover,
} from './glass';

/**
 * Sistema de diseño — estética Apple Liquid Glass + degradado azul sutil.
 *
 * Fondos fríos con degradado azul muy tenue, superficies blanco/cristal
 * translúcidas con borde interior brillante, sombras tintadas azuladas y
 * acento azul Apple (#007AFF). La voz tipográfica del despacho (serif
 * editorial Newsreader) se conserva para títulos y radicados.
 *
 * Paleta institucional (Liquid Glass + azul Apple):
 *  superficie #ffffff · fondo #f5f8fc · acento azul #007aff
 */
export { PALETA } from './glass';
export { ELEVACION } from './palette';

// Re-export glass system for consumers
export {
  type GlassElevation,
  glassShadowLiquid,
  glassShadowLiquidHover,
} from './glass';

/**
 * Ant Design theme with Liquid Glass integration.
 * The glass system provides elevation variants that components can opt into.
 */
export function buildTheme(opts: {
  fontSize: number;
  highContrast: boolean;
  reduceTransparency?: boolean;
}): ThemeConfig {
  const { fontSize, highContrast, reduceTransparency = false } = opts;

  // Base glass background for Ant Design components
  const glassBg = reduceTransparency
    ? PALETA.superficie
    : 'rgba(255, 255, 255, 0.72)';

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
        "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif",
      fontSize,
      // Encabezados contenidos — gravedad editorial sin gritar.
      fontSizeHeading1: 26,
      fontSizeHeading2: 21,
      fontSizeHeading3: 17,
      fontSizeHeading4: 15,
      fontSizeHeading5: 13,
      lineHeight: 1.55,
      borderRadius: 10,
      borderRadiusLG: 20,
      controlHeight: 38,
      wireframe: false,

      // Glass-specific tokens (available via CSS-in-JS or custom components)
      colorBgContainer: glassBg,
      colorBgElevated: glassBg,
    },
    components: {
      Layout: {
        headerBg: glassBg,
        headerHeight: 60,
        siderBg: glassBg,
        bodyBg: PALETA.fondo,
      },
      Menu: {
        itemBg: 'transparent',
        itemHeight: 42,
        itemBorderRadius: 20,
        itemSelectedBg: PALETA.azulSuave,
        itemSelectedColor: PALETA.azulOscuro,
        itemColor: PALETA.textoSuave,
        itemHoverBg: reduceTransparency ? '#eef4fa' : 'rgba(0, 122, 255, 0.08)',
        fontSize,
        iconSize: fontSize + 1,
        itemHoverColor: PALETA.texto,
        itemActiveBg: PALETA.azulSuave,
      },
      Button: {
        controlHeight: 40,
        borderRadius: 20,
        borderRadiusLG: 24,
        fontWeight: 500,
        primaryShadow: '0 4px 14px -4px rgba(0, 122, 255, 0.45)',
        defaultShadow: 'none',
        // Glass button overrides
        defaultBg: reduceTransparency ? PALETA.superficie : 'rgba(255, 255, 255, 0.72)',
        defaultBorderColor: PALETA.borde,
        defaultHoverBg: reduceTransparency ? '#eef4fa' : 'rgba(255, 255, 255, 0.85)',
        defaultActiveBg: reduceTransparency ? '#e3f0ff' : 'rgba(0, 122, 255, 0.12)',
      },
      Card: {
        borderRadiusLG: 20,
        paddingLG: 22,
        // Glass card base
        colorBgContainer: glassBg,
        colorBorderSecondary: PALETA.borde,
        boxShadow: reduceTransparency
          ? 'none'
          : glassShadowLiquid(PALETA.azul, 'base'),
        boxShadowSecondary: reduceTransparency
          ? 'none'
          : glassShadowLiquidHover(PALETA.azul, 'base'),
      },
      Table: {
        cellPaddingBlock: 14,
        headerBg: 'transparent',
        headerColor: PALETA.textoTenue,
        headerSplitColor: 'transparent',
        borderColor: PALETA.borde,
        rowHoverBg: reduceTransparency ? '#eef4fa' : 'rgba(0, 122, 255, 0.06)',
      },
      Tabs: { titleFontSize: fontSize },
      Input: {
        borderRadius: 20,
        controlHeight: 40,
        colorBgContainer: reduceTransparency
          ? PALETA.superficie
          : 'rgba(255, 255, 255, 0.85)',
        colorBorder: PALETA.borde,
        boxShadow: reduceTransparency ? 'none' : 'inset 0 1px 2px rgba(0, 30, 80, 0.04)',
        paddingBlock: 8,
        paddingInline: 16,
      },
      Select: {
        borderRadius: 20,
        controlHeight: 40,
        colorBgContainer: reduceTransparency
          ? PALETA.superficie
          : 'rgba(255, 255, 255, 0.85)',
        colorBorder: PALETA.borde,
        optionSelectedBg: PALETA.azulSuave,
        optionSelectedColor: PALETA.azulOscuro,
      },
      Segmented: {
        borderRadius: 16,
        trackBg: reduceTransparency ? '#e3eaf2' : 'rgba(0, 122, 255, 0.08)',
        itemSelectedBg: reduceTransparency ? PALETA.superficie : 'rgba(255, 255, 255, 0.9)',
        itemSelectedColor: PALETA.azul,
        itemHoverBg: reduceTransparency ? '#eef4fa' : 'rgba(255, 255, 255, 0.72)',
      },
      Tag: {
        borderRadiusSM: 999,
        lineWidth: 0,
        colorBgContainer: reduceTransparency
          ? PALETA.superficie
          : 'rgba(255, 255, 255, 0.72)',
        colorBorder: PALETA.borde,
      },
Modal: {
        borderRadiusLG: 20,
        contentBg: glassBg,
        boxShadow: reduceTransparency
          ? '0 12px 32px rgba(0, 30, 80, 0.15)'
          : glassShadowLiquid(PALETA.azul, 'high'),
      },
      Drawer: {
        borderRadiusLG: 20,
        boxShadow: reduceTransparency
          ? '0 12px 32px rgba(0, 30, 80, 0.15)'
          : glassShadowLiquid(PALETA.azul, 'high'),
      },
      Popover: {
        borderRadiusLG: 16,
        colorBgContainer: glassBg,
        boxShadow: reduceTransparency
          ? '0 4px 12px rgba(0, 30, 80, 0.10)'
          : glassShadowLiquid(PALETA.azul, 'medium'),
      },
      Tooltip: {
        borderRadius: 12,
        colorBgContainer: reduceTransparency
          ? 'rgba(30, 30, 35, 0.95)'
          : 'rgba(30, 30, 35, 0.85)',
        boxShadow: reduceTransparency
          ? '0 4px 12px rgba(0, 30, 80, 0.15)'
          : glassShadowLiquid(PALETA.azul, 'high'),
      },
      Dropdown: {
        borderRadiusLG: 16,
        colorBgContainer: glassBg,
        boxShadow: reduceTransparency
          ? '0 4px 12px rgba(0, 30, 80, 0.10)'
          : glassShadowLiquid(PALETA.azul, 'medium'),
      },
      Descriptions: { itemPaddingBottom: 14, colonMarginRight: 0 },
      Pagination: {
        borderRadius: 12,
        itemBg: reduceTransparency ? PALETA.superficie : 'rgba(255, 255, 255, 0.72)',
        itemActiveBg: PALETA.azul,
      },
      Breadcrumb: {
        separatorColor: PALETA.textoTenue,
        linkColor: PALETA.textoSuave,
      },
      Alert: {
        borderRadiusLG: 16,
        colorBgContainer: reduceTransparency
          ? PALETA.superficie
          : 'rgba(255, 255, 255, 0.72)',
        colorBorder: PALETA.borde,
      },
      Message: {
        colorBgContainer: reduceTransparency
          ? PALETA.superficie
          : 'rgba(255, 255, 255, 0.85)',
        boxShadow: reduceTransparency
          ? '0 8px 24px rgba(0, 30, 80, 0.15)'
          : glassShadowLiquid(PALETA.azul, 'high'),
      },
      Notification: {
        borderRadiusLG: 16,
        colorBgContainer: reduceTransparency
          ? PALETA.superficie
          : 'rgba(255, 255, 255, 0.85)',
        boxShadow: reduceTransparency
          ? '0 8px 24px rgba(0, 30, 80, 0.15)'
          : glassShadowLiquid(PALETA.azul, 'high'),
      },
    },
  };
}