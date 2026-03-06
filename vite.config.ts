import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/noise/' : '/',
  root: '.',
  server: {
    open: true
  }
});
