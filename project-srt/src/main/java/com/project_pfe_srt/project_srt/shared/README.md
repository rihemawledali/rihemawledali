# Shared Backend Features

Purpose: domain resources used by more than one role.

Subfeatures:

- `convention`: convention entity, admin controller, repository, DTOs.
- `fournisseur`: supplier CRUD and supplier DTOs.
- `tresorerie`: bank accounts, treasury history, ledger service.
- `file`: upload/download storage and attachment metadata.
- `pdf`: PDF rendering for purchase orders and invoices.

Shared packages should not own role-specific workflow rules.
