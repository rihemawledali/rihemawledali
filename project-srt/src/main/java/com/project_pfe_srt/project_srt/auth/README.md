# Auth Feature

Purpose: authentication, JWT creation, user identity, and role model.

Main endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`

Main data:

- `User`
- `Role`
- `LoginRequest`
- `RegisterRequest`
- `AuthResponse`

External features consume users through `UserRepository` and user DTOs.
