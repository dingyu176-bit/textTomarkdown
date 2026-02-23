import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: '0.0.0.0',  // 监听所有网络接口，显示 Network 地址
    port: 5173,       // 默认端口
    open: false,      // 不自动打开浏览器
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
