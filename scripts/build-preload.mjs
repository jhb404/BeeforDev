import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

await build({
  entryPoints: [path.join(root, 'src/main/preload.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  external: ['electron'],
  outfile: path.join(root, 'dist/main/preload.js'),
  format: 'cjs',
  minify: false,
  sourcemap: true,
  logLevel: 'info',
  loader: {
    '.ts': 'ts',
  },
  tsconfig: path.join(root, 'tsconfig.main.json'),
});

// Copy the entry file
fs.copyFileSync(
  path.join(root, 'src/main/index-entry.js'),
  path.join(root, 'dist/main/index-entry.js')
);
