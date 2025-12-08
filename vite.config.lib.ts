import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': { NODE_ENV: 'production' }
  },
  publicDir: 'embed',
  build: {
    outDir: 'dist/embed',
    lib: {
      entry: resolve(__dirname, 'src/lib.tsx'),
      name: 'isometric-drawing'
    },
    rollupOptions: {
      external: ['react'],
      output: {
        globals: {
          react: 'React'
        }
      }
    }
  }
})
