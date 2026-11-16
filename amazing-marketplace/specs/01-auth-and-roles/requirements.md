# Feature 01 – Authentication and Roles

## Goal
Users can register and log in. Every user has exactly one role, and each role
can only see and use its own features.

## Requirements
- Register as CUSTOMER or MERCHANT (ADMIN only via seed).
- Login with email + password returns a JWT containing user id and role.
- Frontend stores the token, shows the logged-in user and a logout button.
- Navigation only shows the links allowed for the current role.
- Angular route guards block forbidden pages; NestJS `RolesGuard` returns 403 for forbidden endpoints.
- Passwords are hashed with bcryptjs, never returned by the API.

## Out of scope
Password reset, email verification.
