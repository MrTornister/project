import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    // Add this to skip TypeScript build
    ssr: false
  },
  esbuild: {
    // This will prevent generating .d.ts files
    tsconfigRaw: {
      compilerOptions: {
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    fs: {
      // Allow serving files from the project root
      allow: ['..']
    }
  }
});
