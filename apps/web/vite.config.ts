import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS
    ? `/${(process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'goldnight-vpn')}/`
    : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@goldnight/config': fileURLToPath(new URL('../../packages/config/src/index.ts', import.meta.url)),
      '@goldnight/types': fileURLToPath(new URL('../../packages/types/src/index.ts', import.meta.url)),
      '@goldnight/ui': fileURLToPath(new URL('../../packages/ui/src/index.tsx', import.meta.url))
    }
  }
});
