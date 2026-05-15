# Admin Users Feature

Purpose: admin CRUD and activation workflow for platform users.

Main endpoints:

- `GET /api/admin/users`
- `POST /api/admin/users`
- `PUT /api/admin/users/{id}`
- `PUT /api/admin/users/{id}/activate`
- `PUT /api/admin/users/{id}/deactivate`
- `DELETE /api/admin/users/{id}`

Main data: `AdminUserRequest`, `UserDto`, `User`, `Role`.
