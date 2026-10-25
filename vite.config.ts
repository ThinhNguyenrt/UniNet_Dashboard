import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const configured = env.VITE_API_BASE_URL?.trim()
  const backend = configured && /^https?:\/\//.test(configured)
    ? new URL(configured).origin
    : 'https://uninet-be.onrender.com'
  return {
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: backend,
        changeOrigin: true,
        secure: false,
      },
      '/hubs': {
        target: backend,
        changeOrigin: true,
        ws: true,
      },
    },
  },
  }
})
