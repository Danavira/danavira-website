// Copy rules that ESLint cannot see: content lives in MDX, YAML-ish
// frontmatter, CSS comments and plain text files.
//
// - No em dashes anywhere (U+2014, and U+2015 which renders the same).
// - No phone numbers in content or site config.
// - No image in MDX without alt text. Mermaid blocks need an accDescr line,
//   which rehype-mermaid turns into the rendered image's alt text.
import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const scanDirs = ['src', 'public', 'scripts', 'nginx', '.github'];
const scanFiles = ['README.md', 'astro.config.mjs', 'Dockerfile', 'lychee.toml'];
const textExt = new Set([
  '.astro',
  '.ts',
  '.mjs',
  '.js',
  '.mdx',
  '.md',
  '.css',
  '.svg',
  '.json',
  '.txt',
  '.yml',
  '.yaml',
  '.conf',
  '.inc',
  '.toml',
  '',
]);
const skip = new Set(['src/assets/fonts/OFL-NotoSansJP.txt']);

const DASHES = /[\u2014\u2015]/;
// International (+81 ...) or Japanese domestic (03-1234-5678, 090-1234-5678)
// shapes. Narrow on purpose so dates and version numbers do not trip it.
const PHONE =
  /(\+\d{1,3}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{3,4})|(\b0\d{1,4}-\d{1,4}-\d{4}\b)|tel:/;
const MD_IMG_NO_ALT = /!\[\s*\]\(/;
const MERMAID_BLOCK = /^```mermaid\n([\s\S]*?)^```/gm;
const TAG_NO_ALT = /<(img|Image|Picture|Diagram)\b(?![^>]*\balt=\s*["'{][^"'}\s])[^>]*>/;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

const problems = [];
const files = [...scanFiles.map((f) => join(root, f))];
for (const dir of scanDirs) {
  try {
    for await (const f of walk(join(root, dir))) files.push(f);
  } catch {
    // directory not present
  }
}

for (const file of files) {
  const rel = relative(root, file);
  if (skip.has(rel) || !textExt.has(extname(file))) continue;
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch {
    continue;
  }
  const isContent = rel.startsWith('src/content/') || rel === 'src/site.config.ts';
  if (rel.endsWith('.mdx')) {
    for (const m of text.matchAll(MERMAID_BLOCK)) {
      if (!/^\s*accDescr\s*[:{]/m.test(m[1] ?? '')) {
        const line = text.slice(0, m.index).split('\n').length;
        problems.push(`${rel}:${line}  mermaid block without accDescr (its alt text)`);
      }
    }
  }
  text.split('\n').forEach((line, i) => {
    const at = `${rel}:${i + 1}`;
    if (DASHES.test(line))
      problems.push(`${at}  em dash: use a colon, comma, parentheses or two sentences`);
    if (isContent && PHONE.test(line)) problems.push(`${at}  looks like a phone number`);
    if (rel.endsWith('.mdx')) {
      if (MD_IMG_NO_ALT.test(line)) problems.push(`${at}  markdown image without alt text`);
      if (TAG_NO_ALT.test(line)) problems.push(`${at}  image tag without alt text`);
    }
  });
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} copy problem(s)`);
  process.exit(1);
}
console.log(`lint-copy: ${files.length} files clean`);
