import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate React libraries
          'react-vendor': ['react', 'react-dom'],
          // Separate Mapbox (large library)
          'mapbox-vendor': ['mapbox-gl'],
          // Our app code
          'app': ['./src/main.tsx']
        },

      }
    }
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'mapbox-gl']
  }
})
