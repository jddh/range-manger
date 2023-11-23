import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // base: '/demo-dist/',
  // root: './dev',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'demo/index.html',
      },
      // output: {
      //   assetFileNames: 'assets/[name][extname]',
      //   entryFileNames: '[name].js',
      // }
    },
    outDir: 'dist-demo'
  }
})
