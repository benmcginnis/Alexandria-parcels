import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ...cloudflare({
      // Cloudflare plugin configuration
    })
  ],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000, // Increase from 500KB to 1MB
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        worker: resolve(__dirname, 'src/worker/index.ts') // Include worker in build
      },
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
