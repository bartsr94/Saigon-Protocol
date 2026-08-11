import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { debugTextEditPlugin } from './vite-plugins/debugTextEditPlugin.ts'
import { debugMapEditPlugin } from './vite-plugins/debugMapEditPlugin.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), debugTextEditPlugin(), debugMapEditPlugin()],
  test: {
    environment: 'node',
  },
})
