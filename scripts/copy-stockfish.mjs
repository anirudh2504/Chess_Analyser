import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const sourceDir = join(root, 'node_modules', 'stockfish', 'src');
const publicDir = join(root, 'public', 'stockfish');

const assets = ['stockfish-nnue-16-single.js', 'stockfish-nnue-16-single.wasm'];

mkdirSync(publicDir, { recursive: true });

for (const asset of assets) {
  const source = join(sourceDir, asset);
  if (!existsSync(source)) {
    console.warn(`Stockfish asset not found: ${source}`);
    continue;
  }

  copyFileSync(source, join(publicDir, asset));
}
