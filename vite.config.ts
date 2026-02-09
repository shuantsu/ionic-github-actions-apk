import { defineConfig } from 'vite';

export default defineConfig({
  root: './src',
  server: {
    host: '0.0.0.0', // Permite acesso externo
    port: 5173       // Porta padrão do Vite
  },
  build: {
    outDir: '../dist',
    minify: false,
    emptyOutDir: true,
  },
});