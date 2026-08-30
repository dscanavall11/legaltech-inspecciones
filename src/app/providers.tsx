import { useEffect, useMemo, type ReactNode } from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import esES from 'antd/locale/es_ES';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { buildTheme } from '@/theme/theme';
import { variablesDeEscala } from '@/theme/escala';
import { FONT_SCALE_VALUES, useSettingsStore } from '@/store/settingsStore';

dayjs.locale('es');

// Una sola instancia de QueryClient para toda la app.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  const fontScale = useSettingsStore((s) => s.fontScale);
  const highContrast = useSettingsStore((s) => s.highContrast);

  const theme = useMemo(
    () =>
      buildTheme({
        fontSize: FONT_SCALE_VALUES[fontScale],
        highContrast,
      }),
    [fontScale, highContrast],
  );

  // La escala de texto viaja como variables CSS y no como números en cada
  // componente: así el ajuste A / A+ / A++ alcanza también a las etiquetas y a
  // los pies de norma, que antes iban en px escritos a mano.
  const base = FONT_SCALE_VALUES[fontScale];
  useEffect(() => {
    const raiz = document.documentElement;
    Object.entries(variablesDeEscala(base)).forEach(([n, v]) => raiz.style.setProperty(n, v));
  }, [base]);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={esES} theme={theme}>
        {/* AntdApp habilita los hooks de message/notification/modal con tema. */}
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
