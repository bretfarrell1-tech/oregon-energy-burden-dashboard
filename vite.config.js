import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/oregon-energy-burden-dashboard/',
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
