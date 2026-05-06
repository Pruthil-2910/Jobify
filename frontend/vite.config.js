import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy backend calls to FastAPI on :8000 — frontend can hit /api/* or call API_BASE directly.
      '/auth':     { target: 'http://localhost:8000', changeOrigin: true },
      '/users':    { target: 'http://localhost:8000', changeOrigin: true },
      '/jobs':     { target: 'http://localhost:8000', changeOrigin: true },
      '/chat':     { target: 'http://localhost:8000', changeOrigin: true },
      '/jd':       { target: 'http://localhost:8000', changeOrigin: true },
      '/projects': { target: 'http://localhost:8000', changeOrigin: true },
      '/health':   { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
});
