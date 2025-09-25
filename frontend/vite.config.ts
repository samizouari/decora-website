import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3000,
    host: '0.0.0.0', // Expose sur toutes les interfaces
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://backend-url.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
}) 