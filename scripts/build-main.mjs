import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// Use tsc to compile the main process
exec('tsc -p tsconfig.main.json', { cwd: root }, (error, stdout, stderr) => {
  if (error) {
    console.error('TypeScript compilation failed:', stderr);
    process.exit(1);
  }
  console.log('TypeScript compilation successful');
});
