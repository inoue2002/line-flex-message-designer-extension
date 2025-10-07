import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, join } from 'path';
import { rm, cp, mkdir, readFile, writeFile } from 'fs/promises';

const rootDir = __dirname;
const popupRoot = resolve(rootDir, 'src/popup');
const distRoot = resolve(rootDir, 'dist');

const cleanPlugin = {
  name: 'clean-dist-root',
  apply: 'build',
  async buildStart() {
    await rm(distRoot, { recursive: true, force: true });
  }
};

const copyStaticPlugin = {
  name: 'copy-static-assets',
  apply: 'build',
  async writeBundle() {
    await mkdir(distRoot, { recursive: true });

    const manifestRaw = await readFile(resolve(rootDir, 'manifest.json'), 'utf-8');
    const manifest = JSON.parse(manifestRaw);
    const adjust = (value) => (typeof value === 'string' ? value.replace(/^src\//, '') : value);

    manifest.action.default_popup = adjust(manifest.action.default_popup);
    manifest.background.service_worker = adjust(manifest.background.service_worker);
    manifest.content_scripts = manifest.content_scripts.map((entry) => ({
      ...entry,
      js: entry.js.map(adjust)
    }));

    await writeFile(resolve(distRoot, 'manifest.json'), JSON.stringify(manifest, null, 2));
    await cp(resolve(rootDir, 'assets'), resolve(distRoot, 'assets'), { recursive: true });
    await cp(resolve(rootDir, 'src/background'), resolve(distRoot, 'background'), { recursive: true });
    await cp(resolve(rootDir, 'src/content'), resolve(distRoot, 'content'), { recursive: true });
  }
};

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    root: popupRoot,
    plugins: [cleanPlugin, react(), copyStaticPlugin],
    build: {
      outDir: resolve(distRoot, 'popup'),
      emptyOutDir: true,
      sourcemap: !isProduction,
      rollupOptions: {
        input: resolve(rootDir, 'src/popup/index.html')
      }
    },
    css: {
      postcss: join(rootDir, 'postcss.config.cjs')
    },
    server: {
      port: 5173,
      open: false
    }
  };
});
