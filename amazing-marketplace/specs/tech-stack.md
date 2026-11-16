# Tech Stack

Builds on the application from weeks 1–2 (Angular + NestJS + Prisma).
Updated after implementation (replanning): differences from the first draft are marked *(changed)*.

## Frontend (`frontend/`)
- **Angular 20** with standalone components, signals and the new control flow (`@if`, `@for`)
- **Angular Router** with lazy-loaded pages and a `roleGuard(...)` per role
- **Angular Material 20** for all UI components (toolbar, forms, tabs, expansion panels, snackbars, badges)
- HTTP interceptor attaches the JWT to every API request; session kept in `localStorage`
- Charts drawn with plain HTML/CSS bars instead of a chart library *(changed: fewer dependencies, enough for two simple charts)*
- Fonts installed via npm (`@fontsource/literata`, `@fontsource/source-sans-3`, `material-icons`) so the app also works offline *(changed)*

## Backend (`backend/`)
- **NestJS 11**, REST API under `/api`
- **Authentication**: JWT (`@nestjs/jwt`), passwords hashed with **bcryptjs** *(changed: pure JavaScript, no native build on Windows)*
- **Authorization**: `Role` enum (CUSTOMER, MERCHANT, ADMIN); one `@Auth(...roles)` decorator combines the JWT check and the role check *(changed: no Passport needed)*
- **Validation**: `class-validator` DTOs with German error messages, global `ValidationPipe`
- **PDF generation**: **pdfkit** on the server (invoice, shipping label), streamed as `application/pdf`

## Database
- **Prisma 6** with **SQLite** (`backend/prisma/dev.db`)
- Seed data in `backend/prisma/seed.ts` (runs automatically after `prisma migrate dev`)

## Key architectural decisions
- Prices are stored as integers in cents to avoid rounding errors.
- A book (title, author, ISBN) exists once; a shop sells it through an **Offer** (shop + book + price + stock).
- At checkout the cart is **split into one order per shop**, so each merchant only handles their own orders and each shipping label belongs to exactly one shop.
- Order items copy title and unit price at purchase time, so later price changes do not alter old orders or invoices.
- Order numbers are human-readable: `AMZ-YYYYMMDD-XXXX`.
- Prices include 7 % VAT (reduced German rate for books); the invoice shows net amount, VAT and total. Shipping is free.
- Merchants can only access their own shops, offers and orders (checked in every query, not only in the UI).

## Conventions
- English code and identifiers, German user interface.
- One feature per Git branch; small commits.
- The backend rejects unauthorized access with 401/403 even if the UI hides the feature.
