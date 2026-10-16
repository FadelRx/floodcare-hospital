# Deploy to Cloudflare

Create a D1 database, copy `wrangler.example.jsonc` to your deployment configuration, and replace the all-zero database UUID. Do not add a custom route until ownership and rollback are reviewed. Store `AUTH_SECRET` with `wrangler secret put AUTH_SECRET`; do not place it in JSON or environment files.

Apply migrations and bootstrap remotely, issue the first admin, run normal `npm run doctor`, `npm run check`, and `npm run build`, then preview. `npm run deploy -- --confirm` is intentionally explicit. R2 may be added as an optional binding only when uploads are enabled and retention is documented.
