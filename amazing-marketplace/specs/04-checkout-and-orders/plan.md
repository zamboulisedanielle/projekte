# Plan – Feature 04

1. `Order` and `OrderItem` models; items copy title, author and unit price.
2. `POST /orders/checkout` in a Prisma transaction (check stock, create orders per shop, decrement stock, clear cart).
3. `PdfService.invoice()` with pdfkit; `GET /orders/:id/invoice` only for the owner.
4. Angular: `CheckoutPage` (address form, success view with invoice buttons), `OrdersPage`.
