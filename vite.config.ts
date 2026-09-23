import { defineConfig } from 'vite';

export default defineConfig({
  base: '/loop/',
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
