import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api/loyverse': {
          target: 'https://api.loyverse.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/loyverse/, ''),
          timeout: 10000,
          secure: false,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              if (env.VITE_LOYVERSE_ACCESS_TOKEN) {
                proxyReq.setHeader('Authorization', `Bearer ${env.VITE_LOYVERSE_ACCESS_TOKEN}`);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Accept', 'application/json');
              }
            });
            proxy.on('error', (err, req, res) => {
              console.error('Proxy error:', err.message);
            });
          }
        }
      }
    }
  };
});