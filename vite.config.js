import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        passes: 2,
      },
      mangle: { safari10: true },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-framer';
          }
          if (id.includes('node_modules/@google/generative-ai')) {
            return 'vendor-gemini';
          }
          if (id.includes('node_modules/three') ||
              id.includes('node_modules/@react-three') ||
              id.includes('node_modules/@react-spring')) {
            return 'vendor-three';
          }
          if (id.includes('node_modules/dompurify')) {
            return 'vendor-security';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false,
    reportCompressedSize: true,
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
    exclude: ['@react-three/fiber', '@react-three/drei', 'three'],
  },

  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options':        'DENY',
      'Referrer-Policy':        'strict-origin-when-cross-origin',
    },
  },

  // Vitest configuration
  test: {
    globals:     true,
    environment: 'jsdom',
    setupFiles:  ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/utils/**',
        'src/hooks/**',
        'src/services/**',
        'src/components/ui/**',
      ],
      exclude: [
        'src/test/**',
        'src/**/*.test.*',
        'src/**/__tests__/**',
      ],
      thresholds: {
        lines:      40,
        functions:  40,
        branches:   35,
        statements: 40,
      },

    },
  },
});
