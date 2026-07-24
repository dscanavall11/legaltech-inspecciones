import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig(() => {
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
      // Sin proxy de dev: `VITE_API_BASE_URL` apunta DIRECTO a `orchestrator`
      // (unico BFF del stack, ver .env.example). CORS y el bypass de
      // Cognito para este origen ya estan resueltos en orchestrator bajo
      // SPRING_PROFILES_ACTIVE=local (LocalSecurityConfig).
      // allowedHosts: microsite demo por subdominio (inspeccionConvivenciaYPaz.
      // Legaltech.com.co) — sin esto Vite rechaza el Host header de un
      // dominio que no sea localhost/127.0.0.1.
      allowedHosts: ['inspeccionconvivenciaypaz.legaltech.com.co', '.legaltech.com.co'],
    },
  };
});
