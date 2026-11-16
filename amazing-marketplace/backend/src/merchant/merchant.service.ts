import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { orderInclude } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfferDto, ShopDto, UpdateOfferDto } from './merchant.dto';

@Injectable()
export class MerchantService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Shops ----------

  async shops(ownerId: number) {
    const shops = await this.prisma.shop.findMany({
      where: { ownerId },
      include: { _count: { select: { offers: true, orders: true } } },
      orderBy: { name: 'asc' },
    });
    const revenue = await this.prisma.order.groupBy({
      by: ['shopId'],
      where: { shop: { ownerId } },
      _sum: { totalCents: true },
    });
    return shops.map((s) => ({
      ...s,
      revenueCents: revenue.find((r) => r.shopId === s.id)?._sum.totalCents ?? 0,
    }));
  }

  async shop(ownerId: number, shopId: number) {
    const shop = await this.prisma.shop.findFirst({
      where: { id: shopId, ownerId },
      include: { offers: { include: { book: true }, orderBy: { book: { title: 'asc' } } } },
    });
    if (!shop) throw new NotFoundException('Shop nicht gefunden.');
    return shop;
  }

  createShop(ownerId: number, dto: ShopDto) {
    return this.prisma.shop.create({
      data: { ownerId, name: dto.name.trim(), description: dto.description?.trim() ?? '', city: dto.city?.trim() ?? '' },
    });
  }

  async updateShop(ownerId: number, shopId: number, dto: ShopDto) {
    await this.shop(ownerId, shopId);
    return this.prisma.shop.update({
      where: { id: shopId },
      data: { name: dto.name.trim(), description: dto.description?.trim() ?? '', city: dto.city?.trim() ?? '' },
    });
  }

  async deleteShop(ownerId: number, shopId: number) {
    await this.shop(ownerId, shopId);
    const orders = await this.prisma.order.count({ where: { shopId } });
    if (orders > 0) {
      throw new ConflictException('Shops mit Bestellungen können nicht gelöscht werden.');
    }
    await this.prisma.shop.delete({ where: { id: shopId } });
    return { deleted: true };
  }

  // ---------- Offers ----------

  async createOffer(ownerId: number, shopId: number, dto: CreateOfferDto) {
    await this.shop(ownerId, shopId);
    let bookId = dto.bookId;

    if (!bookId && dto.newBook) {
      const isbn = dto.newBook.isbn.replace(/[\s-]/g, '');
      const existing = await this.prisma.book.findUnique({ where: { isbn } });
      bookId = existing
        ? existing.id
        : (
            await this.prisma.book.create({
              data: {
                title: dto.newBook.title.trim(),
                author: dto.newBook.author.trim(),
                isbn,
                description: dto.newBook.description?.trim() ?? '',
                publishedYear: dto.newBook.publishedYear,
              },
            })
          ).id;
    }
    if (!bookId) throw new BadRequestException('Bitte wähle ein Buch aus oder lege ein neues an.');

    const duplicate = await this.prisma.offer.findUnique({ where: { shopId_bookId: { shopId, bookId } } });
    if (duplicate) throw new ConflictException('Dieses Buch wird in diesem Shop bereits angeboten.');

    return this.prisma.offer.create({
      data: { shopId, bookId, priceCents: dto.priceCents, stock: dto.stock },
      include: { book: true },
    });
  }

  private async ownOffer(ownerId: number, offerId: number) {
    const offer = await this.prisma.offer.findFirst({ where: { id: offerId, shop: { ownerId } } });
    if (!offer) throw new NotFoundException('Angebot nicht gefunden.');
    return offer;
  }

  async updateOffer(ownerId: number, offerId: number, dto: UpdateOfferDto) {
    await this.ownOffer(ownerId, offerId);
    return this.prisma.offer.update({ where: { id: offerId }, data: dto, include: { book: true } });
  }

  async deleteOffer(ownerId: number, offerId: number) {
    await this.ownOffer(ownerId, offerId);
    await this.prisma.offer.delete({ where: { id: offerId } });
    return { deleted: true };
  }

  // ---------- Orders ----------

  orders(ownerId: number, status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: { shop: { ownerId }, ...(status ? { status } : {}) },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async order(ownerId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, shop: { ownerId } }, include: orderInclude });
    if (!order) throw new NotFoundException('Bestellung nicht gefunden.');
    return order;
  }

  async setStatus(ownerId: number, orderId: number, status: OrderStatus) {
    await this.order(ownerId, orderId);
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status, processedAt: status === 'PROCESSED' ? new Date() : null },
      include: orderInclude,
    });
  }

  // ---------- Statistics ----------

  async stats(ownerId: number, days = 30) {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const orders = await this.prisma.order.findMany({
      where: { shop: { ownerId } },
      include: { items: true },
    });

    const perBook = new Map<number, { bookId: number; title: string; author: string; quantity: number; revenueCents: number }>();
    const perDay = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      perDay.set(dayKey(d), 0);
    }

    let revenueCents = 0;
    let booksSold = 0;
    for (const order of orders) {
      revenueCents += order.totalCents;
      const key = dayKey(order.createdAt);
      if (perDay.has(key)) perDay.set(key, (perDay.get(key) ?? 0) + order.totalCents);
      for (const item of order.items) {
        booksSold += item.quantity;
        const entry = perBook.get(item.bookId) ?? {
          bookId: item.bookId,
          title: item.bookTitle,
          author: item.bookAuthor,
          quantity: 0,
          revenueCents: 0,
        };
        entry.quantity += item.quantity;
        entry.revenueCents += item.quantity * item.unitPriceCents;
        perBook.set(item.bookId, entry);
      }
    }

    return {
      totals: {
        revenueCents,
        orders: orders.length,
        openOrders: orders.filter((o) => o.status === 'OPEN').length,
        booksSold,
      },
      revenuePerBook: [...perBook.values()].sort((a, b) => b.revenueCents - a.revenueCents),
      revenuePerDay: [...perDay.entries()].map(([date, cents]) => ({ date, revenueCents: cents })),
    };
  }
}

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
