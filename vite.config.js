import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import obfuscator from 'vite-plugin-obfuscator';

export default defineConfig({
  plugins: [
    react(),
    obfuscator({
      global: true, // This will obfuscate all JS files
      rotateStringArray: true, // Adds complexity to string literals
      // You can add more customization options as needed
    })
  ],
  server: {
    headers: {
      'Content-Type': 'application/javascript',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
    }
  },
  build: {
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      }
    }
  }
});
