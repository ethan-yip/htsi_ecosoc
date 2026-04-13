import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const configDir = dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  root: configDir,
  base: '/',
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: true
  },
  build: {
    outDir: resolve(configDir, 'dist')
  }
})
