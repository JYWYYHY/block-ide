import { defineConfig } from 'vite';

export default defineConfig({
  base: '/block-ide/',
  server: {
    port: 5173,
    strictPort: true,
    open: true
  }
});