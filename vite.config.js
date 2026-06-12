import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative base so the same build works on surge.sh (root) and GitHub Pages (subpath).
  base: './',
  plugins: [react()],
})
