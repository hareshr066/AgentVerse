import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite config for ManuSphere Decision Engine frontend.
 *
 * Dev proxies:
 *   /api/production/*    → http://localhost:8001  (production-agent)
 *   /api/recommendation/* → http://localhost:8000  (recommendation-agent)
 *
 * This lets the frontend make requests to /api/production/api/v1/production-plan
 * and /api/recommendation/api/v1/recommend without CORS issues in development.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api/event': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/event/, ''),
      },
      '/api/demand': {
        target: 'http://localhost:8005',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/demand/, ''),
      },
      '/api/inventory': {
        target: 'http://localhost:8003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/inventory/, ''),
      },
      '/api/supply': {
        target: 'http://localhost:8004',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/supply/, ''),
      },
      '/api/production': {
        target: 'http://localhost:8005',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/production/, ''),
      },
      '/api/recommendation': {
        target: 'http://localhost:8006',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/recommendation/, ''),
      },
      '/api/orchestrator': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/orchestrator/, ''),
      },
    },
  },
});
