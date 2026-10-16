# Modules

Installed capabilities are `sat`, `bcp`, `departmentReadiness`, `wardCapacity`, `stock`, `transport`, `patients`, `dialysis`, `recovery`, and `mission`. Dialysis requires patients; mission requires stock.

Every module has distinct Thai labels, statuses, and a closed validated field schema. The API checks the configured ceiling, D1 runtime setting, and centralized access matrix. A missing settings row falls back to the configured default. Records are scoped to the configured hospital. Patient and dialysis are minimal coordination registers, not an EMR/HIS.
