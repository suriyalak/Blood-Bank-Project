import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true // 👈 เพิ่มบรรทัดนี้เพื่อปลดล็อกให้เปิดผ่าน Localtunnel ได้ทุกโดเมน
  }
})