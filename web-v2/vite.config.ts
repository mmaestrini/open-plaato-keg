import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// During `vite` dev, proxy API + WS calls to the running Elixir backend.
// In Docker, nginx handles the same proxy at runtime (see web-v2/nginx.conf).
const BACKEND = process.env.VITE_BACKEND_URL || 'http://localhost:8085'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api':  { target: BACKEND, changeOrigin: true },
      '/ws':   { target: BACKEND, changeOrigin: true, ws: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
