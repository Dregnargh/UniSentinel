// Build pipeline for @unisentinel/ui
//  - dist/index.js     ESM bundle (react externalized) -> consumed by design-sync converter
//  - dist/index.d.ts   declaration tree (tsc) -> component + <Name>Props extraction
//  - dist/styles.css    component stylesheet (base + every component css)  [cssEntry]
//  - dist/tokens.css    :root design tokens                                 [tokensGlob]
import * as esbuild from 'esbuild';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readdirSync, existsSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
process.chdir(root);

console.log('[build] cleaning dist/');
rmSync('dist', { recursive: true, force: true });

// 1. JS bundle ---------------------------------------------------------------
console.log('[build] bundling JS (esbuild, esm, react external)');
await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'esm',
  outfile: 'dist/index.js',
  jsx: 'automatic',
  target: ['es2020'],
  external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'],
  logLevel: 'warning',
});

// 2. CSS ---------------------------------------------------------------------
console.log('[build] bundling tokens.css');
await esbuild.build({
  entryPoints: ['src/styles/tokens.css'],
  bundle: true,
  outfile: 'dist/tokens.css',
  logLevel: 'warning',
});

console.log('[build] bundling styles.css (base + components)');
const compDir = 'src/styles/components';
const compFiles = existsSync(compDir)
  ? readdirSync(compDir).filter((f) => f.endsWith('.css')).sort()
  : [];
// Tokens are inlined FIRST so dist/styles.css (the design-sync cssEntry) is a
// self-contained stylesheet: :root tokens + base + every component. esbuild
// bundles the @imports inline, so the converter's verbatim copy into
// _ds_bundle.css carries the token definitions into every rendered design.
const cssEntry = [
  '@import "./tokens.css";',
  '@import "./base.css";',
  ...compFiles.map((f) => `@import "./components/${f}";`),
].join('\n');
await esbuild.build({
  stdin: { contents: cssEntry, resolveDir: 'src/styles', loader: 'css' },
  bundle: true,
  outfile: 'dist/styles.css',
  logLevel: 'warning',
});

// 3. Declarations ------------------------------------------------------------
console.log('[build] emitting declarations (tsc)');
// Resolve tsc through require so the script works under npm-workspace hoisting
// (typescript lives in the repo-root node_modules, not the package's own).
const require = createRequire(import.meta.url);
const tscBin = path.join(path.dirname(require.resolve('typescript/package.json')), 'bin', 'tsc');
const tsc = spawnSync('node', [tscBin, '-p', 'tsconfig.build.json'], {
  stdio: 'inherit',
});
if (tsc.status !== 0) {
  console.error('[build] tsc failed');
  process.exit(tsc.status ?? 1);
}

// 4. Summary -----------------------------------------------------------------
const want = ['dist/index.js', 'dist/index.d.ts', 'dist/styles.css', 'dist/tokens.css'];
let ok = true;
for (const f of want) {
  if (existsSync(f)) {
    console.log(`[build] ok  ${f}  (${statSync(f).size} bytes)`);
  } else {
    console.error(`[build] MISSING ${f}`);
    ok = false;
  }
}
console.log(`[build] components css: ${compFiles.length}`);
if (!ok) process.exit(1);
console.log('[build] done');
