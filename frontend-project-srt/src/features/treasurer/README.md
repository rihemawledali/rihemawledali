# Treasurer Frontend Features

Purpose: treasurer-facing operations and workflows.

Subfeatures:

- `dashboard`
- `prets`
- `indemnites`
- `retenues`
- `tresorerie`
- `conventions-demande`
- `paiements`
- `factures`
- `historique`
- `profile`

Each subfeature should expose route pages through its own `index.ts` and keep API calls in a local `api.ts`.
Shared treasurer transport helpers stay internal to the owning subfeature.
