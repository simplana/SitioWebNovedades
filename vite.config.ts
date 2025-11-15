import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'security-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // PCI DSS Requirement 6.5.10: Implement security headers
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('X-Frame-Options', 'DENY');
          res.setHeader('X-XSS-Protection', '1; mode=block');
          res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
          res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
          res.setHeader(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
          );
          res.setHeader(
            'Content-Security-Policy',
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "font-src 'self' https://fonts.gstatic.com; " +
            "img-src 'self' data: https: blob:; " +
            "connect-src 'self' https://*.supabase.co https://*.paguelofacil.com; " +
            "frame-ancestors 'none'; " +
            "base-uri 'self'; " +
            "form-action 'self'"
          );
          next();
        });
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: false, // Set to true in production with valid certificates
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    }
  },
  build: {
    sourcemap: false, // PCI DSS: Don't expose source maps in production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true
      }
    }
  }
});
