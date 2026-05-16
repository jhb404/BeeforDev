import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

await build({
  entryPoints: [path.join(root, 'src/main/preload.ts')],
  bundle: true,
  platform: 'browser',
  target: 'chrome120',
  external: ['electron'],
  outfile: path.join(root, 'dist/main/preload.js'),
  format: 'cjs',
  minify: false,
  sourcemap: true,
  logLevel: 'info',
});
