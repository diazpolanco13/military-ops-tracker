import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'mapbox-gl': ['mapbox-gl'],
          'react-vendor': ['react', 'react-dom'],
          'turf': ['@turf/turf'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
})
