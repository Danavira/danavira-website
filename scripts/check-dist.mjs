// Checks on the built site that a link checker does not cover. Run after
// `pnpm build`.
//
// - Every page's og:image points at a PNG that was actually generated, which
//   catches a page missing from src/lib/pages.ts.
// - No draft post made it into dist/.
// - No em dash in rendered HTML (copy can also come from i18n strings).
import { access, readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const site = 'https://danavira.com';

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

const problems = [];
let pages = 0;
for await (const file of walk(dist)) {
  if (!file.endsWith('.html')) continue;
  const rel = relative(dist, file);
  const html = await readFile(file, 'utf8');
  // Astro.redirect pages are a bare meta refresh with no layout.
  if (/<meta http-equiv="refresh"/.test(html)) continue;
  pages++;

  const og = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  if (!og) problems.push(`${rel}: no og:image`);
  else if (!og.startsWith(site)) problems.push(`${rel}: og:image not on ${site}: ${og}`);
  else {
    try {
      await access(join(dist, og.slice(site.length)));
    } catch {
      problems.push(`${rel}: og:image ${og} was not generated (add the page to src/lib/pages.ts)`);
    }
  }

  if (/[\u2014\u2015]/.test(html)) problems.push(`${rel}: contains an em dash`);
  if (/<strong class="draft"/.test(html)) problems.push(`${rel}: draft post in build output`);
}

if (pages === 0) problems.push('no HTML pages found; run pnpm build first');
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`check-dist: ${pages} pages ok`);
