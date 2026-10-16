# Installation

1. Install Node.js 22.18+ and run `npm ci`.
2. Run `npm run setup` interactively, or pass `--non-interactive --id=... --hcode=... --name-th=... --short-name-th=... --name-en=... --province=... --district=... --lat=... --lon=... --modules=bcp,stock`.
3. Review `config/hospital.config.ts`; setup never requests or writes secrets.
4. Run `npm run db:migrate:local`, then `npm run db:bootstrap:local`. This inserts the configured hospital and module flags only.
5. Issue the first administrator and run `npm run dev`.

Nearby discovery is opt-in only: add `--discover-nearby --registry-url=https://... --registry-source=thaiwater|ddpm|telerid`. The public endpoint must return an array of `{id,lat,lon}`. Setup stores at most ten ranked suggestions as `unconfirmed`, resets river direction to unconfirmed, and never selects or confirms upstream stations.

For local Worker parity, put a development `AUTH_SECRET` in untracked `.dev.vars`. Never commit it.
