import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// O navegador só conhece a porta 5173; /api é repassado ao NestJS.
// (Backend em 3333 porque 3000 e 3001 estão ocupadas por outros projetos nesta máquina.)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:3333',
    },
  },
});
