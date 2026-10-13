import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('react/') || 
              id.includes('react-dom/') || 
              id.includes('react-router-dom/') ||
              id.includes('react-router/')
            ) {
              return 'vendor';
            }
            if (id.includes('lucide-react') || id.includes('framer-motion')) {
              return 'ui';
            }
            return 'deps'; // Put the rest of node_modules into a separate 'deps' chunk
          }
        }
      }
    }
  }
})
