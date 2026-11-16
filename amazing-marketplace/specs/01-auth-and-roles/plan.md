# Plan – Feature 01

1. Prisma: add `User` model (id, email unique, passwordHash, name, role enum) and relate `Shop.ownerId` to User. Migrate.
2. NestJS: `AuthModule` with `/auth/register`, `/auth/login`, `/auth/me`; `AuthGuard` + `@Auth(...roles)` decorator.
3. Protect existing endpoints according to role.
4. Angular: `AuthService` (token storage, current user signal), HTTP interceptor, login and register pages (Angular Material forms).
5. Angular: `roleGuard` for routes, role-based navigation in the toolbar.
6. Seed: demo accounts from roadmap.md.
