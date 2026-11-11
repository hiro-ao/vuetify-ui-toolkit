import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(new URL('./playground', import.meta.url)),
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
  },
  build: {
    outDir: '../playground-dist',
    emptyOutDir: true,
  },
});
