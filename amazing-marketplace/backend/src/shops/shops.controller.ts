import { Controller, Get, NotFoundException, Param, ParseIntPipe } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('shops')
export class ShopsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.shop.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        city: true,
        owner: { select: { name: true } },
        _count: { select: { offers: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  @Get(':id')
  async one(@Param('id', ParseIntPipe) id: number) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        city: true,
        owner: { select: { name: true } },
        offers: { include: { book: true }, orderBy: { book: { title: 'asc' } } },
      },
    });
    if (!shop) throw new NotFoundException('Shop nicht gefunden.');
    return shop;
  }
}
