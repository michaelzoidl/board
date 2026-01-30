import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyDirFirst: true
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8042',
      '/ws': {
        target: 'ws://127.0.0.1:8042',
        ws: true
      }
    }
  }
})
