# Updating

Read `CHANGELOG.md`, export D1, test the new version against a restored non-production copy, run migrations, `npm run check`, build, and doctor. Deploy during an approved window and verify login, module flags, audit, and rollback. Never downgrade a database without a documented compatible migration.
