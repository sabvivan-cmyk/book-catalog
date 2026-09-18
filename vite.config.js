import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    proxy: {
      '/sms-pilot-emulator': {
        target: 'https://smspilot.ru',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/api.php',
      },
    },
  },
})
