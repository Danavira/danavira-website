// Copies the Sveltia CMS bundle into dist/admin/ after the build, so /admin/
// loads it from this site instead of a CDN. The version is pinned in
// package.json; Renovate or a manual `pnpm up @sveltia/cms` bumps it.
// Copied into dist/ rather than kept in public/ so the 2.6 MB minified bundle
// never meets lint-copy or prettier. Source maps are left behind.
import { cp, readdir } from 'node:fs/promises';
import { join } from 'node:path';

// The package exports only its JS entry, not dist/, so it is read from the
// node_modules link pnpm creates for a direct dependency.
const from = new URL('../node_modules/@sveltia/cms/dist/', import.meta.url).pathname;
const to = new URL('../dist/admin/', import.meta.url).pathname;

await cp(join(from, 'sveltia-cms.js'), join(to, 'sveltia-cms.js'));
await cp(join(from, 'chunks'), join(to, 'chunks'), {
  recursive: true,
  filter: (src) => !src.endsWith('.map'),
});
const chunks = await readdir(join(to, 'chunks'), { recursive: true });
console.log(`copy-cms: sveltia-cms.js and ${chunks.length} chunk files in dist/admin/`);
