import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      index: './src/main.tsx',
    },
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
  server: {
    port: 3456,
    open: false,
  },
  html: {
    title: '宝宝图片库',
  },
})
