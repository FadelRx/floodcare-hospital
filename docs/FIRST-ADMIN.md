# First SystemAdmin

The baseline has zero users. After migration and bootstrap, run:

```sh
npm run account:issue -- --username=admin --display-name="System administrator" --role=SystemAdmin
```

Local execution is the default. Remote issuance requires both `--remote` and `--confirm-remote`, after independently verifying the parsed `database_name`; `--database=name` may be used explicitly. The password is hidden and never put in command arguments or files.

For Staff, assign comma-separated scopes such as `--scopes=stock,transport`. Patient or dialysis access additionally needs `sensitive:patients` or `sensitive:dialysis`. An optional `--unit-id` is accepted only when that unit belongs to the configured hospital.
