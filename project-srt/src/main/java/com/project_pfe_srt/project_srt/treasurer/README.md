# Treasurer Features

Purpose: treasury operations and request validation.

Subfeatures:

- `dashboard`: treasury statistics.
- `compte`: bank account CRUD.
- `facture`: supplier invoices.
- `boncommande`: purchase orders.
- `retenue`: monthly deduction generation, status, and CSV export.
- `paiement`: outgoing payments and payment status.
- `ticket`: restaurant/cafeteria tickets.
- `workflow`: validation and refusal actions.
- `historique`: treasury history query.
- `adherentview`: treasurer view of adherents.

Controllers keep the existing `/api/treasurer/*` endpoint contracts.
