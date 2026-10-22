# style-src allows inline styles because Astro inlines small stylesheets. # img-src allows data: for
the build-time Mermaid SVGs. object-src 'self' lets # /cv/ embed /cv.pdf. No page ships JavaScript,
so script-src stays 'self'. add_header Content-Security-Policy "default-src 'self'; script-src
'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'self'; frame-ancestors
'none'; base-uri 'self'; form-action 'none'" always; add_header X-Content-Type-Options nosniff
always; add_header Referrer-Policy strict-origin-when-cross-origin always; add_header
Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
