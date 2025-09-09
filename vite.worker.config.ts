import { defineConfig } from 'vite'
import { resolve } from 'path'

// Worker-specific Vite configuration
export default defineConfig({
  build: {
    outDir: 'dist/worker',
    sourcemap: true,
    rollupOptions: {
      input: {
        worker: resolve(__dirname, 'src/worker/index.ts')
      },
      output: {
        entryFileNames: 'index.js',
        format: 'es'
      }
    }
  },
  define: {
    global: 'globalThis',
  }
})
