import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
const isPages = !!process.env.GITHUB_PAGES

export default defineConfig({
  plugins: [react()],
  base: isPages && repo ? `/${repo}/` : '/',
})
