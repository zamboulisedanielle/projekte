import { Controller, Get, NotFoundException, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const offerInclude = {
  offers: {
    include: { shop: { select: { id: true, name: true, city: true } } },
    orderBy: { priceCents: 'asc' as const },
  },
};

@Controller('books')
export class BooksController {
  constructor(private readonly prisma: PrismaService) {}

  /** Public search over title, author and ISBN. Only books that some shop offers. */
  @Get()
  search(@Query('q') q?: string) {
    const term = q?.trim();
    return this.prisma.book.findMany({
      where: {
        offers: { some: {} },
        ...(term
          ? { OR: [{ title: { contains: term } }, { author: { contains: term } }, { isbn: { contains: term } }] }
          : {}),
      },
      include: offerInclude,
      orderBy: { title: 'asc' },
    });
  }

  /** All books in the catalogue (used by merchants to pick an existing book). */
  @Get('catalogue')
  catalogue() {
    return this.prisma.book.findMany({ orderBy: { title: 'asc' } });
  }

  @Get(':id')
  async one(@Param('id', ParseIntPipe) id: number) {
    const book = await this.prisma.book.findUnique({ where: { id }, include: offerInclude });
    if (!book) throw new NotFoundException('Buch nicht gefunden.');
    return book;
  }
}
