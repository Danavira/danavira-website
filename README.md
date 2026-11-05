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

  `Diagram` is available in every project and post without importing it. Diagrams sit on a white card with a hairline border.

- **Mermaid:** a fenced ` ```mermaid ` block. It is rendered to SVG at build time by headless Chromium. No Mermaid code ships to the browser.
  Every block needs an `accDescr: ...` line; it becomes the image's alt text, and `lint-copy` fails without it.

Alt text is required everywhere: the schema rejects an empty `alt`, and `lint-copy` rejects MDX images without one.

## Writing a post (CMS, no code)

Posts, certifications, the resume and the home page copy are editable in the browser at **https://danavira.com/admin/** (Sveltia CMS). Every save is a commit to `main`, which the Image workflow turns into a new image.

One-time sign-in setup:

1. On GitHub, create a [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new): repository access **Only select repositories**, `Danavira/danavira-website`; permission **Contents: Read and write** (Metadata read-only is added automatically). Pick an expiry you are happy to renew.
2. Open `/admin/`, choose **Sign In Using Access Token** and paste it. The token stays in that browser's local storage; it is never sent anywhere but `api.github.com`.

Writing:

1. **Blog posts**, then **New Blog post**. Fill in title, description (at most 200 characters), tags, and the body. Images dropped into the body or the cover field are stored in `src/assets/writing/` and optimized at build time.
2. New posts start with **Draft** ticked. Saving a draft commits it but keeps it off the site, RSS and sitemap.
3. To publish, untick **Draft** and save.

The build rejects em dashes and images without alt text. If a save does not show up, check the Image workflow run in GitHub Actions for the error.

## Adding a post (by hand)

1. Create `src/content/writing/en/<slug>.md` (or `.mdx` to use components):

   ```yaml
   ---
   title: Post title
   description: One sentence summary.
   pubDate: 2026-11-01
   updatedDate: 2026-11-05 # optional
   tags: [Kubernetes]
   cover: { src: ../../../assets/writing/<file>.png, alt: What the image shows } # optional
   draft: true
   ---
   ```

2. While `draft: true`, the post shows in `pnpm dev` only. It is left out of the build, RSS, sitemap and nav.
3. Remove `draft: true` to publish. The Blog nav link, the home page section and `/rss.xml` appear once at least one post is published. `/writing/` groups posts by year and every tag gets `/writing/tags/<tag>/`.

## Adding a Japanese translation

Japanese pages exist only where a Japanese source file exists. Nothing is machine-translated.

1. Copy the English file to the same path under `ja/`, keeping the same file name:
   `src/content/projects/en/homelab.mdx` becomes `src/content/projects/ja/homelab.mdx`.
2. Translate the frontmatter and body. For projects, use the Japanese required headings from `src/i18n/ja.ts` (`project.requiredSections`): `背景`, `アーキテクチャ`, `設計判断とトレードオフ`, `障害と対応`, `成果`.
3. Build. The page appears under `/ja/...`, the language switcher appears on both versions, and `hreflang` links are added.

Start with `src/content/pages/ja/home.mdx`: it turns on `/ja/`. Interface labels (nav, buttons) are in `src/i18n/ja.ts`; review them before publishing the first Japanese page. Where a Japanese page does not exist, Japanese nav links fall back to the English page.

## The resume and certifications

`/cv/` is built from data, and `pnpm build` prints that page to `/cv.pdf` with headless Chromium (`scripts/build-cv-pdf.mjs`), so the page and the PDF always match. There is no PDF to replace by hand.

| What                                     | Where                                                |
| ---------------------------------------- | ---------------------------------------------------- |
| Summary paragraph                        | `src/content/pages/en/cv.mdx`                        |
| Roles and selected projects              | `src/data/experience.yaml`                           |
| Skills, education                        | `src/data/skills.yaml`, `src/data/education.yaml`    |
| Certifications (also `/certifications/`) | `src/data/certifications.yaml`                       |
| Certificate previews and PDFs            | `src/assets/certs/<id>.png`, `public/certs/<id>.pdf` |

All of these are editable in the CMS too. List order in each file is display order.

Never publish a document that shows an ID number, date of birth, phone number or street address. The TOEIC score report has an ID number and date of birth, so it is listed by score only. `docs/` (git-ignored) holds the originals.

## Site details

Name, job title, email, links and work authorization live in `src/site.config.ts`. They feed the header, footer, contact page, CV and the JSON-LD `Person` schema.

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
