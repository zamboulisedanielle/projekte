import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: number) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { offer: { include: { book: true, shop: { select: { id: true, name: true } } } } },
      orderBy: { id: 'asc' },
    });
    const totalCents = items.reduce((sum, i) => sum + i.quantity * i.offer.priceCents, 0);
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    return { items, totalCents, count };
  }

  async add(userId: number, offerId: number, quantity: number) {
    const offer = await this.prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer) throw new NotFoundException('Angebot nicht gefunden.');
    const existing = await this.prisma.cartItem.findUnique({ where: { userId_offerId: { userId, offerId } } });
    const newQuantity = (existing?.quantity ?? 0) + quantity;
    if (newQuantity > offer.stock) {
      throw new BadRequestException(`Nur noch ${offer.stock} Stück auf Lager.`);
    }
    await this.prisma.cartItem.upsert({
      where: { userId_offerId: { userId, offerId } },
      create: { userId, offerId, quantity },
      update: { quantity: newQuantity },
    });
    return this.get(userId);
  }

  async update(userId: number, itemId: number, quantity: number) {
    const item = await this.prisma.cartItem.findFirst({ where: { id: itemId, userId }, include: { offer: true } });
    if (!item) throw new NotFoundException('Artikel nicht im Warenkorb.');
    if (quantity > item.offer.stock) throw new BadRequestException(`Nur noch ${item.offer.stock} Stück auf Lager.`);
    await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
    return this.get(userId);
  }

  async remove(userId: number, itemId: number) {
    await this.prisma.cartItem.deleteMany({ where: { id: itemId, userId } });
    return this.get(userId);
  }
}
