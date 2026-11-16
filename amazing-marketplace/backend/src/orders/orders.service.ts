import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createOrderNumber } from '../common/order-number';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './orders.dto';

export const orderInclude = {
  items: true,
  shop: { select: { id: true, name: true, city: true } },
  customer: { select: { id: true, name: true, email: true } },
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Turns the cart into one order per shop, reduces stock and empties the cart. */
  async checkout(customerId: number, address: CheckoutDto) {
    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.cartItem.findMany({
        where: { userId: customerId },
        include: { offer: { include: { book: true } } },
      });
      if (cart.length === 0) throw new BadRequestException('Dein Warenkorb ist leer.');

      for (const item of cart) {
        if (item.quantity > item.offer.stock) {
          throw new BadRequestException(
            `„${item.offer.book.title}“ ist nur noch ${item.offer.stock}-mal verfügbar. Bitte passe die Menge an.`,
          );
        }
      }

      const byShop = new Map<number, typeof cart>();
      for (const item of cart) {
        byShop.set(item.offer.shopId, [...(byShop.get(item.offer.shopId) ?? []), item]);
      }

      const orderIds: number[] = [];
      for (const [shopId, items] of byShop) {
        const order = await tx.order.create({
          data: {
            orderNumber: createOrderNumber(),
            customerId,
            shopId,
            shippingName: address.name.trim(),
            shippingStreet: address.street.trim(),
            shippingZip: address.zip.trim(),
            shippingCity: address.city.trim(),
            shippingCountry: address.country?.trim() || 'Deutschland',
            totalCents: items.reduce((s, i) => s + i.quantity * i.offer.priceCents, 0),
            items: {
              create: items.map((i) => ({
                bookId: i.offer.bookId,
                bookTitle: i.offer.book.title,
                bookAuthor: i.offer.book.author,
                unitPriceCents: i.offer.priceCents,
                quantity: i.quantity,
              })),
            },
          },
        });
        orderIds.push(order.id);
        for (const i of items) {
          await tx.offer.update({ where: { id: i.offerId }, data: { stock: { decrement: i.quantity } } });
        }
      }

      await tx.cartItem.deleteMany({ where: { userId: customerId } });
      return tx.order.findMany({ where: { id: { in: orderIds } }, include: orderInclude });
    });
  }

  history(customerId: number) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findForCustomer(customerId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, customerId }, include: orderInclude });
    if (!order) throw new NotFoundException('Bestellung nicht gefunden.');
    return order;
  }
}
