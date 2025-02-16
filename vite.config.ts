import { defineConfig, normalizePath } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import { createRequire } from 'node:module';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const require = createRequire(import.meta.url);
const cMapsDir = normalizePath(path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'cmaps'));
const standardFontsDir = normalizePath(
  path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'standard_fonts'),
);

// Get package version
const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
const version = packageJson.version;

// Get latest Git commit short hash
const gitCommit = execSync('git rev-parse --short HEAD').toString().trim();

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: cMapsDir, dest: '' },
        { src: standardFontsDir, dest: '' },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'supernote-typescript': path.resolve(__dirname, 'supernote-typescript/src'),
    },
  },
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  optimizeDeps: {
    include: ['supernote-typescript'],
  },

  define: {
    __APP_VERSION__: JSON.stringify(version),
    __GIT_COMMIT__: JSON.stringify(gitCommit),
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
}));
