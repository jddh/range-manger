import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
     base: '',
  plugins: [react(), {
    name: 'custom-hmr',
    handleHotUpdate({ file, server }) {
      server.ws.send({
        type: 'custom',
        event: 'hmr-update',
        data: {}
      })
      return []
    },
  }],
})

// export default defineConfig({
//   base: '',
//   plugins: [react()],
// })
