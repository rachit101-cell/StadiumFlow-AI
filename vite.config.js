import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('three')) {
              return 'vendor-three';
            }
            if (id.includes('@google/generative-ai')) {
              return 'vendor-gemini';
            }
            return 'vendor';
          }
        },
      },
    },
  },

  // Vitest configuration
  test: {
    globals:     true,
    environment: 'jsdom',
    setupFiles:  './src/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude:  ['node_modules/', 'dist/', 'src/test/'],
    },
  },

  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options':        'DENY',
      'Referrer-Policy':        'strict-origin-when-cross-origin',
    },
  },
});
