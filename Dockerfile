# syntax=docker/dockerfile:1

# Build stage: Node, pnpm and headless Chromium. Chromium is only here because
# rehype-mermaid renders diagrams to SVG during `astro build`; none of it
# reaches the final image.
FROM node:22-bookworm-slim AS build
ENV CI=true
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
RUN pnpm exec playwright install --with-deps chromium

COPY . .
RUN pnpm build

# Serve stage: nginx-unprivileged listens on 8080 and runs as uid 101 with no
# patching, which is what the pod's runAsNonRoot and the disallow-run-as-root
# Kyverno policy require. With /tmp and /var/cache/nginx mounted as emptyDirs
# it runs on a read-only root filesystem.
FROM nginxinc/nginx-unprivileged:1.29-alpine

COPY nginx/site.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.inc /etc/nginx/conf.d/security-headers.inc
COPY --from=build /app/dist /usr/share/nginx/html

# The base image already ends on USER 101; repeated so scanners and readers see it.
USER 101:101
EXPOSE 8080
