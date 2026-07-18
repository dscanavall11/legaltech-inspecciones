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
      // Sin proxy de dev: `VITE_API_BASE_URL` apunta DIRECTO a
      // `policia-legaltech-service` (una sola URL base para TODO --
      // dominio CRUD Y rutas de IA, ver .env.example). El navegador NUNCA
      // habla directo con `orchestrator` (decision confirmada con el
      // usuario): las rutas de IA las reenvia `policia-legaltech-service`
      // server-to-server hacia `orchestrator`/`legal` (ver
      // policia-legaltech-service/src/common/ai/ai.controller.ts -- hoy
      // mock local, con TODO explicito de reemplazar por el reenvio real).
      // Cada servicio de
      // celula valida el JWT por su cuenta (CognitoJwtGuard, ver
      // policia-legaltech-service/src/common/auth). CORS ya habilitado en
      // policia-legaltech-service/src/main.ts (app.enableCors()).
    },
  };
});
