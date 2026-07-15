import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1200, // antd es grande pero está aislado y se cachea
      rollupOptions: {
        output: {
          // Vendors en chunks separados: cambian poco, se cachean mejor.
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-antd': ['antd', '@ant-design/icons'],
            'vendor-data': ['@tanstack/react-query', 'zustand', 'dayjs'],
          },
        },
      },
    },
    server: {
      port: Number(process.env.PORT ?? 5173),
      // Proxy hacia los microservicios en desarrollo (cuando el mock esté
      // apagado). Por defecto apunta al API de producción, igual que hacía
      // el proxy.conf.json del app Angular. Se puede sobreescribir con
      // VITE_DEV_PROXY_TARGET (ej: http://localhost:8080).
      proxy: {
        '/api': {
          target: env.VITE_DEV_PROXY_TARGET ?? 'https://legaltech.com.co',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
