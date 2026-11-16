import { Body, Controller, Get, Param, ParseIntPipe, Post, Res } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { Auth, CurrentUser } from '../common/auth.decorator';
import { JwtUser } from '../common/auth.guard';
import { PdfService } from '../pdf/pdf.service';
import { CheckoutDto } from './orders.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@Auth(Role.CUSTOMER)
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly pdf: PdfService,
  ) {}

  @Post('checkout')
  checkout(@CurrentUser() user: JwtUser, @Body() dto: CheckoutDto) {
    return this.orders.checkout(user.sub, dto);
  }

  @Get()
  history(@CurrentUser() user: JwtUser) {
    return this.orders.history(user.sub);
  }

  @Get(':id/invoice')
  async invoice(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const order = await this.orders.findForCustomer(user.sub, id);
    const buffer = await this.pdf.invoice(order);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Rechnung-${order.orderNumber}.pdf"`,
    });
    res.end(buffer);
  }
}
