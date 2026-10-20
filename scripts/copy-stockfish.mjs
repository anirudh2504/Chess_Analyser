import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const sourceDir = join(root, 'node_modules', 'stockfish', 'bin');
const publicDir = join(root, 'public', 'stockfish');

// Stockfish 18 "lite" single-threaded build: small (~7MB), NNUE built in, and needs no
// cross-origin-isolation headers, so several copies can run side by side in Web Workers.
const assets = ['stockfish-18-lite-single.js', 'stockfish-18-lite-single.wasm'];

mkdirSync(publicDir, { recursive: true });

for (const asset of assets) {
  const source = join(sourceDir, asset);
  if (!existsSync(source)) {
    console.warn(`Stockfish asset not found: ${source}`);
    continue;
  }

  copyFileSync(source, join(publicDir, asset));
}
