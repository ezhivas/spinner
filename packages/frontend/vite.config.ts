import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared-types/src'),
    },
  },

  // Настройки для режима разработки (Docker)
  server: {
    port: 5173,
    // Прокси для API в Docker режиме
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  // Настройки для production сборки
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Разделение больших библиотек
          'react-vendor': ['react', 'react-dom'],
          'editor': ['@monaco-editor/react'],
        },
      },
    },
  },

  // Базовый путь для Electron (относительный) и Docker (абсолютный)
  base: process.env.ELECTRON ? './' : '/',
})
