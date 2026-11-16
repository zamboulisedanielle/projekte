import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Res } from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import type { Response } from 'express';
import { Auth, CurrentUser } from '../common/auth.decorator';
import { JwtUser } from '../common/auth.guard';
import { PdfService } from '../pdf/pdf.service';
import { CreateOfferDto, ShopDto, UpdateOfferDto, UpdateOrderStatusDto } from './merchant.dto';
import { MerchantService } from './merchant.service';

@Controller('merchant')
@Auth(Role.MERCHANT)
export class MerchantController {
  constructor(
    private readonly merchant: MerchantService,
    private readonly pdf: PdfService,
  ) {}

  @Get('shops')
  shops(@CurrentUser() u: JwtUser) {
    return this.merchant.shops(u.sub);
  }

  @Post('shops')
  createShop(@CurrentUser() u: JwtUser, @Body() dto: ShopDto) {
    return this.merchant.createShop(u.sub, dto);
  }

  @Get('shops/:id')
  shop(@CurrentUser() u: JwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.merchant.shop(u.sub, id);
  }

  @Patch('shops/:id')
  updateShop(@CurrentUser() u: JwtUser, @Param('id', ParseIntPipe) id: number, @Body() dto: ShopDto) {
    return this.merchant.updateShop(u.sub, id, dto);
  }

  @Delete('shops/:id')
  deleteShop(@CurrentUser() u: JwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.merchant.deleteShop(u.sub, id);
  }

  @Post('shops/:id/offers')
  createOffer(@CurrentUser() u: JwtUser, @Param('id', ParseIntPipe) id: number, @Body() dto: CreateOfferDto) {
    return this.merchant.createOffer(u.sub, id, dto);
  }

  @Patch('offers/:id')
  updateOffer(@CurrentUser() u: JwtUser, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOfferDto) {
    return this.merchant.updateOffer(u.sub, id, dto);
  }

  @Delete('offers/:id')
  deleteOffer(@CurrentUser() u: JwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.merchant.deleteOffer(u.sub, id);
  }

  @Get('orders')
  orders(@CurrentUser() u: JwtUser, @Query('status') status?: string) {
    const s = status === 'OPEN' || status === 'PROCESSED' ? (status as OrderStatus) : undefined;
    return this.merchant.orders(u.sub, s);
  }

  @Patch('orders/:id')
  setStatus(@CurrentUser() u: JwtUser, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrderStatusDto) {
    return this.merchant.setStatus(u.sub, id, dto.status);
  }

  @Get('orders/:id/label')
  async label(@CurrentUser() u: JwtUser, @Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const order = await this.merchant.order(u.sub, id);
    const buffer = await this.pdf.shippingLabel(order);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Versandlabel-${order.orderNumber}.pdf"`,
    });
    res.end(buffer);
  }

  @Get('stats')
  stats(@CurrentUser() u: JwtUser, @Query('days') days?: string) {
    const n = Math.min(Math.max(Number(days) || 30, 7), 90);
    return this.merchant.stats(u.sub, n);
  }
}
