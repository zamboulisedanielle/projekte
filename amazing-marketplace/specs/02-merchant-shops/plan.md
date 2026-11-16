# Plan – Feature 02

1. Prisma: `Offer` model (shopId, bookId, priceCents, stock) with unique (shopId, bookId).
2. NestJS `MerchantController` under `/merchant`, protected with `@Auth(Role.MERCHANT)`.
3. Every query filters by `ownerId` of the logged-in merchant.
4. Endpoints: shops CRUD, `POST /merchant/shops/:id/offers`, `PATCH|DELETE /merchant/offers/:id`, `GET /books/catalogue`.
5. Angular: `MerchantShopsPage` (list + create form), `MerchantShopPage` (edit shop, add offer, editable table).
