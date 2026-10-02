import { defineConfig } from 'vite';

export default defineConfig({
  base: '/block-ide/'
  server: {
    port: 5173,
    strictPort: true,   // 端口被占用直接报错，不换端口
    open: true
  }
});