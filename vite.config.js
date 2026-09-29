// vite.config.js
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';

import path from 'path';
import { resolve } from 'path';
export default defineConfig({
  base: '/miraclepos_frontend_2.0.0v/',
  global: 'globalThis',
  resolve: {
    alias: {
      vue: 'vue/dist/vue.esm-bundler.js',
       '@': path.resolve(__dirname, './src'),
    }
  },
  optimizeDeps: {
        esbuildOptions: {
            define: {
                global: 'globalThis',
            },
        },
    },
  plugins: [
    tailwindcss(),
    vue(),
  ],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        admin: resolve(__dirname, 'admin.html'),
        pos: resolve(__dirname, 'pos.html'),
        shift: resolve(__dirname, 'shift.html'),
        analytics: resolve(__dirname, 'analytics.html'),
        install: resolve(__dirname, 'install.html'),
        faq: resolve(__dirname, 'faq.html'),
        scan: resolve(__dirname, 'scan.html'),

        'forgot-password': resolve(__dirname, 'forgot-password.html'),
        'reset-password': resolve(__dirname, 'reset-password.html')
      }
    }
  }
});
