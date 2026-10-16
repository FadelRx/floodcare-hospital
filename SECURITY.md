# Security policy

Supported release: 1.x. Do not file public issues containing credentials, personal data, patient data, or exploitable details. Contact the maintainers privately through the repository security-advisory channel used by your distribution. Operators remain responsible for access reviews, Cloudflare controls, incident response, backups, and PDPA compliance.

Production requires an unpredictable `AUTH_SECRET` of at least 32 characters stored as a Worker secret, never in source control. Rotate it after suspected exposure; rotation invalidates all sessions. Apply updates, review audit logs, and test restoration regularly.

# Browser policy

The production CSP permits `unsafe-inline` for scripts and styles because the current Next.js output includes inline bootstrap and style content. It still excludes `unsafe-eval` in production. Moving to a per-request nonce CSP would tighten this further, but requires dynamic header and nonce propagation through the Next.js render path.
