# FloodCare Hospital 0.1.0-alpha

FloodCare Hospital is an early, single-hospital disaster-readiness workspace for Cloudflare Workers and D1. The alpha provides local authentication, runtime module switches, scoped staff access, audit-backed sensitive access, and ten small operational registers. It is not an EMR/HIS, clinical decision system, regional network, or finished production release.

Each included module has Thai labels, its own statuses and closed server-side schema, and a list/create screen: incident command, continuity plans, department readiness, ward capacity, stock, transport, patient coordination, dialysis continuity, recovery, and missions. Patient and dialysis collect only reference/minimum coordination fields, require a PDPA legal basis plus evidence reference, explicit sensitive Staff scopes, and audited reads/writes.

Installed configuration is the hard module ceiling. D1 `module_settings` controls the runtime subset, with missing rows falling back to configured defaults. SystemAdmin administers all users; UnitAdmin can administer Staff only; Staff access is limited to assigned scopes.

```sh
npm ci
npm run setup
npm run db:migrate:local
npm run db:bootstrap:local
npm run account:issue -- --username=admin --role=SystemAdmin
npm run dev
```

The checked-in configuration is a non-deployable template. Setup requests identity, location, and module selection but no secrets. Nearby lookup occurs only with explicit discovery flags; results remain unconfirmed and never confirm upstream direction.

D1 provides platform-managed encryption at rest; this application does not claim application-layer field encryption. Avoid national ID/CID. This alpha has create/list workflows only: no edit/delete, attachments, EMR/HIS synchronization, clinical validation, offline conflict resolution, or automated upstream confirmation. See [PDPA operations](docs/PDPA.md) and [installation](docs/INSTALL.md).
