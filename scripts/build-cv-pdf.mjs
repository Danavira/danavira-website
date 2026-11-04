// Prints the built /cv/ page to dist/cv.pdf, so the downloadable CV is always
// the same content as the page. Runs after `astro build` as part of
// `pnpm build`, with the headless Chromium that rehype-mermaid already needs.
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const dist = new URL('../dist/', import.meta.url).pathname;
const out = join(dist, 'cv.pdf');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

// A static server over dist/ rather than file:// URLs, because the built pages
// reference their CSS by absolute path (/_astro/...).
const server = createServer(async (req, res) => {
  let path = normalize(join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (!path.startsWith(dist)) return res.writeHead(403).end();
  try {
    if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
    res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' });
    createReadStream(path).pipe(res);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const res = await page.goto(`http://127.0.0.1:${port}/cv/`, { waitUntil: 'networkidle' });
  if (!res?.ok()) throw new Error(`/cv/ returned ${res?.status()}; was it built?`);
  await page.pdf({
    path: out,
    preferCSSPageSize: true,
    printBackground: true,
    tagged: true,
    outline: true,
  });
  console.log(`build-cv-pdf: wrote ${out} (${((await stat(out)).size / 1024).toFixed(0)} KiB)`);
} finally {
  await browser.close();
  server.close();
}
