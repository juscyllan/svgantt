import { copyFileSync } from 'node:fs'

// ESM build
await Bun.build({
  entrypoints: ['src/index.ts'],
  outdir: 'dist',
  format: 'esm',
  minify: true,
  sourcemap: 'external',
  naming: '[name].js',
})

// CJS build
await Bun.build({
  entrypoints: ['src/index.ts'],
  outdir: 'dist',
  format: 'cjs',
  minify: true,
  sourcemap: 'external',
  naming: '[name].cjs',
})

// Copy static assets
copyFileSync('src/gantt.css', 'dist/gantt.css')

console.log('Built: dist/index.js, dist/index.cjs, dist/index.d.ts, dist/gantt.css')
