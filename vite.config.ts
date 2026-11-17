/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Dev: gọi /api/v1 cùng origin, Vite chuyển tới Spring Boot → không cần CORS.
    proxy: { '/api': process.env.VITE_API_TARGET || 'http://localhost:8081' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
