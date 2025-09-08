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
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        worker: resolve(__dirname, 'src/worker/index.ts') // Include worker in build
      },
      external: ['mapbox-gl'], // Externalize only Mapbox GL to load from esm.sh
      output: {
        manualChunks: {
          // Separate React libraries
          'react-vendor': ['react', 'react-dom'],
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
    include: ['react', 'react-dom'] // React bundled, Mapbox externalized
  }
})
