# Data Model

## Entity Relationship Overview

```mermaid
erDiagram
  USER ||--o| ADHERENT_PROFILE : owns
  USER ||--o{ ADHESION : requests
  USER ||--o{ PRET_SOCIAL : requests
  USER ||--o{ INDEMNITE : requests
  USER ||--o{ HISTORIQUE_FINANCIERE : has
  USER ||--o{ TICKET_RESTAURANT : receives
  USER ||--o{ RETENUE_MENSUELLE : has

  FOURNISSEUR ||--o{ CONVENTION : signs
  FOURNISSEUR ||--o{ FACTURE : issues
  FOURNISSEUR ||--o{ BON_COMMANDE : receives

  CONVENTION ||--o{ CONVENTION_DEMANDE : requested_by
  CONVENTION_DEMANDE }o--|| USER : adherent

  BON_COMMANDE ||--o{ TICKET_RESTAURANT : generates
  FACTURE ||--o{ PAIEMENT : paid_by
  INDEMNITE ||--o{ PAIEMENT : paid_by
  COMPTE_BANCAIRE ||--o{ HISTORIQUE_TRESORERIE : records
  RETENUE_MENSUELLE ||--o{ RETENUE_LIGNE : contains
```

## Glossary

- Adherent: employee/member using the self-service portal.
- Adhesion: yearly membership request and status.
- Convention: agreement with a supplier that gives adherents a benefit.
- Convention demande: adherent request to use a convention.
- Retenue mensuelle: monthly deduction master generated for one adherent.
- Retenue ligne: one deduction line for adhesion, loan, convention, or ticket.
- Indemnite: social allowance requested by an adherent.
- Pret social: social loan requested by an adherent.
- Bon de commande: purchase order for tickets or supplier services.
- Ticket restaurant: restaurant/cafeteria ticket assigned to an adherent.
- Paiement: outgoing payment for invoice, indemnity, or other treasury flow.
- Historique tresorerie: treasury ledger movement.
