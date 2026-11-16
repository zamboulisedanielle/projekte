import { Controller, Get } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Auth } from '../common/auth.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin')
@Auth(Role.ADMIN)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('overview')
  async overview() {
    const [merchants, customers, shops, orders, revenue] = await Promise.all([
      this.prisma.user.count({ where: { role: 'MERCHANT' } }),
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.shop.count(),
      this.prisma.order.count(),
      this.prisma.order.aggregate({ _sum: { totalCents: true } }),
    ]);
    return { merchants, customers, shops, orders, revenueCents: revenue._sum.totalCents ?? 0 };
  }

  @Get('merchants')
  async merchants() {
    const merchants = await this.prisma.user.findMany({
      where: { role: 'MERCHANT' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        shops: {
          select: {
            id: true,
            name: true,
            city: true,
            _count: { select: { offers: true, orders: true } },
            orders: { select: { totalCents: true, status: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    return merchants.map((m) => {
      const orders = m.shops.flatMap((s) => s.orders);
      return {
        id: m.id,
        name: m.name,
        email: m.email,
        createdAt: m.createdAt,
        shops: m.shops.map((s) => ({ id: s.id, name: s.name, city: s.city, offers: s._count.offers, orders: s._count.orders })),
        orders: orders.length,
        openOrders: orders.filter((o) => o.status === 'OPEN').length,
        revenueCents: orders.reduce((sum, o) => sum + o.totalCents, 0),
      };
    });
  }

  @Get('customers')
  async customers() {
    const customers = await this.prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalCents: true,
            createdAt: true,
            shop: { select: { name: true } },
            items: { select: { bookTitle: true, quantity: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });
    return customers.map((c) => ({
      ...c,
      totalSpentCents: c.orders.reduce((sum, o) => sum + o.totalCents, 0),
    }));
  }
}
