import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { readdirSync } from 'node:fs';

const srcPath = resolve(__dirname, 'src');

const srcAliases = Object.fromEntries(
  readdirSync(srcPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => [entry.name, resolve(srcPath, entry.name)])
);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: srcAliases,
  },
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [srcPath],
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
        },
      },
    },
  },
});
