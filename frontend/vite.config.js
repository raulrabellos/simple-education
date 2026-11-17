import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O Vite repassa as chamadas /api para o Express (porta 3001), tanto em
// desenvolvimento (npm run dev, porta 5173) quanto em "vite preview" (porta 4173).
// changeOrigin: false mantém o endereço original do site no cabeçalho Host; assim
// a proteção do backend contra requisições de outras origens reconhece que a
// chamada veio do próprio site, e o cookie de sessão funciona sem ajustes.
const apiProxy = {
  '/api': { target: 'http://localhost:3001', changeOrigin: false },
};

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: apiProxy },
  preview: { port: 4173, proxy: apiProxy },
});
