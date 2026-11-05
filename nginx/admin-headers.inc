# Headers for /admin/ only, where Sveltia CMS runs. It is the one place on the
# site that executes JavaScript: the bundle is served from 'self', talks to the
# GitHub API with the editor's token, and previews media from blob: URLs.
# cdn.jsdelivr.net is allowed for fonts only: the CMS UI loads its typefaces
# and icon font from Fontsource there.
# Every public page keeps the stricter policy in security-headers.inc.
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' https://cdn.jsdelivr.net; img-src 'self' blob: data: https://avatars.githubusercontent.com https://raw.githubusercontent.com; media-src blob:; frame-src blob:; worker-src 'self' blob:; connect-src 'self' blob: data: https://api.github.com https://raw.githubusercontent.com https://www.githubstatus.com; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;
add_header X-Content-Type-Options nosniff always;
add_header Referrer-Policy strict-origin-when-cross-origin always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header X-Robots-Tag "noindex, nofollow" always;
