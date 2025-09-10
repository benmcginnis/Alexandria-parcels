import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist/client',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
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
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || '/data/'),
  },
  optimizeDeps: {
    include: ['react', 'react-dom'] // React bundled, Mapbox externalized
  }
})
