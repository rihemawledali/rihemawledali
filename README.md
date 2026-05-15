# PFE SRT Management

Full-stack management platform for SRT social benefits, treasury operations, supplier conventions, payments, and adherent self-service.

## Architecture

```text
React + Vite frontend
        |
        | HTTPS/JSON + JWT
        v
Spring Boot API
        |
        | JPA
        v
MySQL database
```

## Roles

- `ADMIN`: users, suppliers, conventions, invoices, payments, purchase orders, tickets, overview dashboard.
- `TRESORIER`: adhesions, loans, indemnities, convention requests, monthly deductions, treasury accounts, payments, invoices, tickets.
- `ADHERENT`: profile, adhesion, convention requests, loans, indemnities, offers, financial history.

## Backend

```powershell
cd project-srt
.\mvnw.cmd -DskipTests compile
.\mvnw.cmd spring-boot:run
```

If the wrapper script fails on Windows, use the Maven installation cached under the local Maven wrapper directory, or install Maven and run:

```powershell
mvn -DskipTests compile
mvn spring-boot:run
```

Configuration is in `project-srt/src/main/resources/application.properties`. The API runs on `http://localhost:8080`.

## Frontend

```powershell
cd frontend-project-srt
npm install
npm run build
npm run lint
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Structure

- Backend uses package-by-feature under `com.project_pfe_srt.project_srt`.
- Frontend uses `src/app`, `src/shared`, and `src/features`.
- Cross-cutting frontend UI, layout, feedback, data, validators, and API client code live in `src/shared`.
- Feature exports should go through `index.ts` barrels where the feature is consumed from outside.

## Verification

Current verification commands:

```powershell
cd project-srt
.\mvnw.cmd -DskipTests compile

cd ..\frontend-project-srt
npm run build
npm run lint
```
