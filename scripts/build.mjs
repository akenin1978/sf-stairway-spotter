import { build } from 'vite';
const args = process.argv.slice(2);
const index = args.indexOf('--outDir');
const outDir = index >= 0 ? args[index + 1] : 'dist';
if (!outDir) throw new Error('--outDir needs a directory');
await build({ build: { manifest: true, outDir } });
await import('./prerender.mjs');
