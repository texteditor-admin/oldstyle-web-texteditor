import { defineConfig } from 'vite';
import { resolve } from 'path';
import * as fs from 'fs';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'OldStyleWebTextEditor',
      fileName: (format) => `oldstyle-web-texteditor.${format}.js`,
      formats: ['umd', 'es', 'iife']
    },
    rollupOptions: {
      output: {
        exports: 'named',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'oldstyle-web-texteditor.css';
          }
          return assetInfo.name || 'asset';
        }
      }
    },
    sourcemap: true
  },
  plugins: [
    {
      name: 'generate-legacy-aliases',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist');
        const copyPairs = [
          ['oldstyle-web-texteditor.umd.js', 'resmi-yazi-editor.umd.js'],
          ['oldstyle-web-texteditor.es.js', 'resmi-yazi-editor.es.js'],
          ['oldstyle-web-texteditor.iife.js', 'resmi-yazi-editor.iife.js'],
          ['oldstyle-web-texteditor.css', 'resmi-yazi-editor.css'],
          ['oldstyle-web-texteditor.umd.js.map', 'resmi-yazi-editor.umd.js.map'],
          ['oldstyle-web-texteditor.es.js.map', 'resmi-yazi-editor.es.js.map']
        ];
        for (const [srcName, destName] of copyPairs) {
          const srcPath = resolve(distDir, srcName);
          const destPath = resolve(distDir, destName);
          if (fs.existsSync(srcPath)) {
            try {
              fs.copyFileSync(srcPath, destPath);
            } catch (err) {
              console.warn(`Could not copy ${srcName} to ${destName}:`, err);
            }
          }
        }
      }
    }
  ]
});
