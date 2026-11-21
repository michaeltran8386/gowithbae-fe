/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Dev: gọi /api/v1 cùng origin, Vite chuyển tới Spring Boot → không cần CORS.
    proxy: { '/api': process.env.VITE_API_TARGET || 'http://localhost:8080' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Test luồng gõ nhiều ô chạy song song trên máy chậm dễ vượt 5 giây mặc định.
    testTimeout: 20_000,
  },
})
