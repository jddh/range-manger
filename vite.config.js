import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// export default defineConfig({
//      base: '',
//   plugins: [react(), {
//     name: 'custom-hmr',
//     handleHotUpdate({ file, server }) {
//       server.ws.send({
//         type: 'custom',
//         event: 'hmr-update',
//         data: {}
//       })
//       return []
//     },
//   }],
// })

export default defineConfig({
  base: '',
  // root: './dev',
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/components/RangeManger.jsx'),
      formats: ['es']
    },
    rollupOptions: {
      external: ['react', 'react/jsx-runtime', 'classnames', 'clsx', 'short-unique-id'],
    }
  }
})
