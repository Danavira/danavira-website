# danavira.com

Personal portfolio site. Astro, static output, plain CSS, no client JavaScript.

Placeholder copy is marked `TODO(yasa):`. Find all of it with:

```sh
grep -rn "TODO(yasa)" src public
```

## Local development

Requires Node 22 (see `.nvmrc`) and pnpm, enabled through Corepack.

```sh
corepack enable
pnpm install
pnpm exec playwright install chromium   # once; renders Mermaid diagrams at build time
pnpm dev                                 # http://localhost:4321
```

| Script            | What it does                                                                 |
| ----------------- | ---------------------------------------------------------------------------- |
| `pnpm dev`        | Dev server. Draft posts are visible here and nowhere else.                   |
| `pnpm build`      | Static build into `dist/`, including OG images, sitemap and RSS.             |
| `pnpm preview`    | Serve `dist/` locally.                                                       |
| `pnpm check`      | `astro check`: TypeScript and content schema errors.                         |
| `pnpm lint`       | ESLint (including accessibility rules), then `scripts/lint-copy.mjs`.        |
| `pnpm format`     | Prettier.                                                                    |
| `pnpm check:dist` | After a build: every page has a generated OG image, no drafts, no em dashes. |

`lint-copy` fails on em dashes anywhere in the repo, phone-number shapes in content, and MDX images without alt text.

## Content layout

```
src/content/
  pages/<locale>/home.mdx      home page title, identity line, bio
  pages/<locale>/cv.mdx        CV page intro
  projects/<locale>/<slug>.mdx case studies
  writing/<locale>/<slug>.mdx  posts
```

`<locale>` is `en` or `ja`. Schemas are in `src/content.config.ts`; a build fails if frontmatter does not match.

## Adding a project

1. Create `src/content/projects/en/<slug>.mdx`. It is published at `/projects/<slug>/`.
2. Frontmatter:

   ```yaml
   ---
   title: Short title
   description: One or two sentences. Used on cards, in search results and link previews.
   order: 10 # lower sorts first
   stack: [Spark, Airflow, ClickHouse]
   architecture: # optional, rendered above the body
     src: ../../../assets/diagrams/<slug>.svg
     alt: What the diagram shows, in a sentence or two.
   links: # optional
     - label: Source
       href: https://github.com/...
   draft: false
   ---
   ```

3. The body must contain these `##` headings (any order). The build fails if one is missing:
   `Context`, `Architecture`, `Decisions and tradeoffs`, `What broke and how I fixed it`, `Results`.
   The Stack section is generated from `stack`.

The home page shows up to three non-featured projects, sorted by `order`.

### The featured project (homelab)

Exactly one project per locale may set `featured: true`. It renders at `/homelab/` with the wide layout, and `/projects/<slug>/` redirects there. The build fails if two projects are featured.

### Diagrams

- **Excalidraw:** export as SVG into `src/assets/diagrams/`, then either reference it from `architecture` in frontmatter, or place it in the body:

  ```mdx
  import arch from '../../../assets/diagrams/pipeline.svg';

  <Diagram
    src={arch}
    alt="Airflow schedules Spark jobs that load ClickHouse."
    caption="Optional caption"
  />
  ```

  `Diagram` is available in every project and post without importing it. Diagrams sit on a white card so Excalidraw's colors work in dark mode.

- **Mermaid:** a fenced ` ```mermaid ` block. It is rendered to SVG at build time (light and dark variants) by headless Chromium. No Mermaid code ships to the browser.
  Every block needs an `accDescr: ...` line; it becomes the image's alt text, and `lint-copy` fails without it.

Alt text is required everywhere: the schema rejects an empty `alt`, and `lint-copy` rejects MDX images without one.

## Adding a post

1. Create `src/content/writing/en/<slug>.mdx`:

   ```yaml
   ---
   title: Post title
   description: One sentence summary.
   pubDate: 2026-11-01
   updatedDate: 2026-11-05 # optional
   tags: [kubernetes]
   draft: true
   ---
   ```

2. While `draft: true`, the post shows in `pnpm dev` only. It is left out of the build, RSS, sitemap and nav.
3. Remove `draft: true` to publish. The Writing nav link, the home page section and `/rss.xml` appear once at least one post is published.

## Adding a Japanese translation

Japanese pages exist only where a Japanese source file exists. Nothing is machine-translated.

1. Copy the English file to the same path under `ja/`, keeping the same file name:
   `src/content/projects/en/homelab.mdx` becomes `src/content/projects/ja/homelab.mdx`.
2. Translate the frontmatter and body. For projects, use the Japanese required headings from `src/i18n/ja.ts` (`project.requiredSections`): `背景`, `アーキテクチャ`, `設計判断とトレードオフ`, `障害と対応`, `成果`.
3. Build. The page appears under `/ja/...`, the language switcher appears on both versions, and `hreflang` links are added.

Start with `src/content/pages/ja/home.mdx`: it turns on `/ja/`. Interface labels (nav, buttons) are in `src/i18n/ja.ts`; review them before publishing the first Japanese page. Where a Japanese page does not exist, Japanese nav links fall back to the English page.

## Replacing the CV

Replace `public/cv.pdf` with a file of the same name. The `/cv/` page links to it and embeds it. The intro text above it is in `src/content/pages/en/cv.mdx`.

Never put a phone number or street address in the PDF metadata or the site.

## Site details

Name, job title, links and certifications live in `src/site.config.ts`. They feed the header, footer, home page and the JSON-LD `Person` schema.

OG images are generated per page at build time (`src/pages/og/[...route].ts`). They use a subset of Noto Sans JP (`src/assets/fonts/`, SIL Open Font License) so Japanese titles render; the font is never sent to browsers. To rebuild it:

```sh
uv run --with fonttools python -I scripts/build-og-font.py /path/to/NotoSansJP[wght].ttf
```

## Deployment

### Cloudflare Pages (primary, serves danavira.com)

GitHub Actions builds and checks the site, then deploys the same `dist/` with Wrangler (`.github/workflows/ci.yml`, job `deploy`). Cloudflare's own Git build is not used, because the build needs headless Chromium for Mermaid.

One-time setup:

1. In Cloudflare, create a Pages project named `danavira-website` using **Direct Upload** (not "Connect to Git").
2. Create an API token with the **Cloudflare Pages: Edit** permission.
3. Add repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
4. In the Pages project, add the custom domains `danavira.com` and `www.danavira.com`, and add a redirect rule from `www` to the apex.

Until the secrets exist the deploy job logs a warning and skips.

Equivalent build settings, for reference or for switching to Cloudflare's Git integration later:

| Setting           | Value                                                 |
| ----------------- | ----------------------------------------------------- |
| Production branch | `main`                                                |
| Build command     | `pnpm exec playwright install chromium && pnpm build` |
| Output directory  | `dist`                                                |
| Environment       | `NODE_VERSION=22`                                     |

Response headers (CSP, caching for `/_astro/*`) come from `public/_headers`.

### Container image (homelab)

`.github/workflows/image.yml` builds the `Dockerfile` and pushes to `ghcr.io/danavira/danavira-website`:

- every push to `main`: `:sha-<short>`
- a `v*` tag: `:<version>`, for example `git tag v0.1.0 && git push origin v0.1.0` publishes `:0.1.0`

There is no `:latest` tag. The image is nginx-unprivileged serving `dist/` on port 8080 as uid 101, with a `/healthz` endpoint. It runs on a read-only root filesystem when `/tmp` and `/var/cache/nginx` are writable mounts. The Kubernetes manifests live in `Danavira/data-platform-manifests` under `apps/danavira-website`.

Run it locally:

```sh
docker build -t danavira-website .
docker run --rm -p 8080:8080 --read-only --tmpfs /tmp --tmpfs /var/cache/nginx danavira-website
```

Security headers for the image are in `nginx/security-headers.inc`; keep them in step with `public/_headers`.
