# Roadmap

Each phase is implemented with its own feature spec (`requirements.md`, `plan.md`,
`validation.md` in `specs/<nn>-<feature>/`), then validated and merged.
After each phase: replan (update this roadmap and the constitution if needed).

| Phase | Feature | Spec | Status |
|------:|---------|------|--------|
| 0 | Project setup in `Woche-4` (Angular, NestJS, Prisma) | – | done |
| 1 | Users, login/register, roles, guards | `01-auth-and-roles` | done |
| 2 | Merchant: manage own shops and offers | `02-merchant-shops` | done |
| 3 | Customer: book search and shopping cart | `03-search-and-cart` | done |
| 4 | Customer: checkout, invoice PDF, order history | `04-checkout-and-orders` | done |
| 5 | Merchant: order overview, shipping label PDF | `05-merchant-orders` | done |
| 6 | Merchant: sales dashboard | `06-merchant-dashboard` | done |
| 7 | Admin: dashboards for merchants, customers and orders | `07-admin-dashboard` | done |
| 8 | Seed data, UI polish, screenshots | `08-seed-and-polish` | done |

## Replanning notes
- After phase 4: decided to split a checkout into one order per shop (simplifies phases 5 and 6).
- After phase 6: replaced the planned chart library with simple CSS bars.
- After phase 8: fonts moved from Google Fonts to npm packages so the app works offline.

## Ideas for later (not in scope)
- Real payment, e-mail notifications, book reviews, cover images, pagination for large catalogues.

## Demo accounts (created by the seed)
| Role | E-Mail | Password |
|------|--------|----------|
| Admin | admin@amazing.de | admin123 |
| Merchant | haendler1@amazing.de | test123 |
| Merchant | haendler2@amazing.de | test123 |
| Customer | kunde1@amazing.de | test123 |
| Customer | kunde2@amazing.de | test123 |
| Customer | kunde3@amazing.de | test123 |
