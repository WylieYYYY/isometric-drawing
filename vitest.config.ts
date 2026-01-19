import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-zoom-pan-pinch']
  },
  test: {
    browser: {
      provider: playwright(),
      headless: true,
      enabled: true,
      instances: [{ browser: 'firefox' }],
      viewport: {width: 1366, height: 768}
    }
  }
})
