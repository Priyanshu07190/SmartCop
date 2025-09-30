import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/bhashini': {
        target: 'https://meity-auth.ulcacontrib.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bhashini/, ''),
        secure: true
      },
      '/api/mymemory': {
        target: 'https://api.mymemory.translated.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mymemory/, ''),
        secure: true
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    // Ensure proper handling of PDF.js worker
    global: 'globalThis',
  },
  worker: {
    format: 'es'
  }
});
