import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import javascriptObfuscator from 'rollup-plugin-javascript-obfuscator';

export default defineConfig(({ command }) => {
  const isProduction = command === 'build';
  
  const config = {
    plugins: [
      react(),
      // Add obfuscation only in production
      isProduction && 
      javascriptObfuscator({
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: true,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        rotateStringArray: true,
        selfDefending: true,
        stringArray: true,
        stringArrayEncoding: 'base64',
        stringArrayThreshold: 0.75,
        unicodeEscapeSequence: false
      })
    ].filter(Boolean),
    
    server: {
      headers: {
        'Content-Type': 'application/javascript'
      }
    },
    
    build: {
      sourcemap: !isProduction,
      minify: isProduction,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    }
  };
  
  return config;
});