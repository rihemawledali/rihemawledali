# SRT Backend – Auth (JWT + Roles)

Simple authentication backend for the SRT app. Provides register/login with JWT and role-based access (`ADMIN`, `ADHERENT`, `TRESORIER`).

## Tech
- Spring Boot 4.0.5, Java 21
- Spring Security + JWT (jjwt 0.12.6)
- Spring Data JPA + MySQL
- Lombok

## 1. Prerequisites
- Java 21
- MySQL running on `localhost:3306` (user `root`, no password by default)
- Maven (or use included `mvnw.cmd`)

## 2. Database
Database `srt_db` is auto-created on first run thanks to `?createDatabaseIfNotExist=true`. To create manually:
```sql
CREATE DATABASE IF NOT EXISTS srt_db;
```

## 3. Run
From `project-srt/`:
```powershell
.\mvnw.cmd spring-boot:run
```
Backend listens on `http://localhost:8080`.

## 4. Configuration
See `src/main/resources/application.properties`:
- `spring.datasource.*` – MySQL connection
- `app.jwt.secret` – HMAC key (change in production, min 32 bytes)
- `app.jwt.expiration-ms` – token TTL (default 24h)

## 5. Endpoints

### Register (public)
`POST http://localhost:8080/api/auth/register`
```json
{
  "nom": "Ali",
  "prenom": "Ahmed",
  "email": "admin@srt.com",
  "password": "123456",
  "role": "ADMIN",
  "telephone": "12345678"
}
```

### Login (public)
`POST http://localhost:8080/api/auth/login`
```json
{
  "email": "admin@srt.com",
  "password": "123456"
}
```

### Response (both)
```json
{
  "token": "eyJhbGciOiJIUzI1...",
  "role": "ADMIN",
  "email": "admin@srt.com",
  "nom": "Ali"
}
```

### Protected endpoints
All other endpoints require the header:
```
Authorization: Bearer <token>
```

## 6. Roles
Allowed values for `role`: `ADMIN`, `ADHERENT`, `TRESORIER`.

In any future controller, restrict by role using:
```java
@PreAuthorize("hasRole('ADMIN')")
```
(Method security is already enabled via `@EnableMethodSecurity`.)

## 7. CORS
Allowed origins (configured in `SecurityConfig`):
- `http://localhost:3000`
- `http://localhost:5173`

So your `frontend-project-srt` can call the backend directly.

## 8. Postman quick test
1. Send `POST /api/auth/register` with the JSON above → 200 OK + token.
2. Send `POST /api/auth/login` with email/password → 200 OK + token.
3. Copy `token`. Add header `Authorization: Bearer <token>` on any other request.

### curl examples
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nom":"Ali","prenom":"Ahmed","email":"admin@srt.com","password":"123456","role":"ADMIN","telephone":"12345678"}'

curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@srt.com","password":"123456"}'
```

## 9. Project layout
```
src/main/java/com/project_pfe_srt/project_srt
├── ProjectSrtApplication.java
├── config
│   ├── SecurityConfig.java
│   └── JwtAuthenticationFilter.java
├── controller
│   └── AuthController.java
├── dto
│   ├── LoginRequest.java
│   ├── RegisterRequest.java
│   └── AuthResponse.java
├── entity
│   ├── User.java
│   └── Role.java
├── repository
│   └── UserRepository.java
└── service
    ├── AuthService.java
    └── JwtService.java
```
