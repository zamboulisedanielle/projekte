# Plan – Feature 03

1. `GET /books?q=` searches with Prisma `contains` over title, author, isbn (public).
2. `CartItem` model (userId, offerId, quantity), `CartController` with `@Auth(Role.CUSTOMER)`.
3. Angular: `BooksPage` with debounced search (rxjs `debounceTime` + `switchMap`), query in URL.
4. `CartStore` service with a signal so the badge updates everywhere.
5. `CartPage` grouped by shop.
