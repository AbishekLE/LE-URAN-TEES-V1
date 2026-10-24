import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` makes every asset URL relative, so the build works from any
// GitHub Pages address (https://<user>.github.io/<repo>/) without having to
// hard-code the repository name.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
