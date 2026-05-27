import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev proxy target. The Docker build doesn't use this — nginx handles
// the same proxy at runtime (see web-v2/nginx.conf). To point a local
// `npm run dev` at a remote backend (e.g. the Pi via Tailscale), just
// edit this value.
const BACKEND = 'http://localhost:8085'

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
