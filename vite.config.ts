import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
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
    port: 5173,
    // Proxy hacia el backend Spring en desarrollo (cuando el mock esté apagado).
    // Ajustar el target a la URL real del backend.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
