# Architecture

## Backend Packages

```text
com.project_pfe_srt.project_srt
|-- common
|   |-- config
|   |-- exception
|   |-- util
|   `-- web
|-- auth
|-- admin
|   `-- users
|-- adherent
|   |-- profile
|   |-- adhesion
|   |-- convention
|   |-- historique
|   |-- indemnite
|   |-- pret
|   `-- offres
|-- treasurer
|   |-- dashboard
|   |-- compte
|   |-- facture
|   |-- boncommande
|   |-- retenue
|   |-- paiement
|   |-- ticket
|   |-- workflow
|   |-- historique
|   `-- adherentview
`-- shared
    |-- convention
    |-- fournisseur
    |-- tresorerie
    |-- file
    `-- pdf
```

Each backend feature keeps the internal layer names `controller`, `service`, `dto`, `entity`, and `repository` when those layers exist.

## Frontend Modules

```text
src
|-- app
|   |-- App.tsx
|   |-- main.tsx
|   |-- router.tsx
|   `-- pages
|-- shared
|   |-- ui
|   |-- data
|   |-- charts
|   |-- feedback
|   |-- layout
|   |-- lib
|   |-- types
|   `-- validators
`-- features
    |-- auth
    |-- admin
    |-- adherent
    `-- treasurer
```

## Naming Rules

- Page components end with `Page`.
- Form components end with `Form`.
- Feature API entrypoints are named `api.ts` or exported through `index.ts`.
- Feature-specific schemas live near the forms that own them.
- Shared validators contain only reusable primitives such as `phoneRegex` and `ibanRegex`.

## Git Conventions

- One branch per feature or structural move.
- One commit per coherent move, for example `refactor(auth): move to package-by-feature`.
- Keep generated files and unrelated formatting out of refactor commits.
- Run backend compile and frontend build/lint before merging.
