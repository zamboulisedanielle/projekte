# Mission – "Amazing" Marketplace

## Vision
"Amazing" is an online marketplace for books. Independent merchants run their own
book shops on the platform; customers search, buy and track books from all shops
in one place; administrators keep an overview of the whole marketplace.

## Audiences
- **Customers**: search books, fill a cart, place orders with a delivery address,
  download invoices (PDF), view their order history.
- **Merchants**: manage their own shops and the books offered in them, process
  orders (open vs. processed), print shipping labels (PDF), see sales statistics.
- **Administrators**: see dashboards of all merchants, all customers and their orders.

## Scope
In scope:
- Role-based access: each role only sees and can use its own features
  (customers cannot use merchant/admin features; merchants cannot use admin features).
- Book search, cart, checkout with delivery address, invoice PDF, order history.
- Shop and offer management, order processing, shipping label PDF, sales dashboard.
- Admin dashboards for merchants, customers and orders.
- Realistic seed data so every feature can be demonstrated.

Out of scope:
- Real payment processing (checkout ends with "order placed", no payment step).
- Real shipping integration, emails, reviews/ratings, multi-language UI.

## Success criteria
- Every requirement above can be demonstrated with the seed data and the demo accounts.
- Role restrictions are enforced in the backend (guards), not only hidden in the UI.
- The UI is intuitive and looks professional (consistent Angular Material design).
- The project builds and starts with the documented commands.
