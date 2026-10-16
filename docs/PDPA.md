# PDPA operations

The deploying hospital is the data controller and is responsible for lawful basis, notices, consent where applicable, minimization, retention, access/correction workflows, processors, and breach response. Avoid CID or any national identifier when a local disaster-coordination reference suffices.

Patient and dialysis inputs use closed schemas. Both require a legal basis and evidence/assessment reference; Staff also needs the module scope and its explicit `sensitive:*` scope. Sensitive list and create operations batch their audit event with the D1 operation and fail closed if the batch fails. Audit details never copy clinical fields.

D1 uses Cloudflare-managed encryption at rest. This alpha does not implement or claim application-layer field encryption. Operators must protect Cloudflare access, restrict backups/exports, document retention, test restore, and review provider key-management and recovery controls.
