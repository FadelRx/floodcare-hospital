# Backup and restore

Use Cloudflare's supported D1 export/backup mechanism for the exact database and record its timestamp, schema version, and checksum in a restricted operations log. Encrypt exports, restrict access, and apply the approved retention period. Restore into an isolated database first, run migrations and doctor checks, validate row counts and login revocation, then schedule the binding change. Never use patient data in public tests.
