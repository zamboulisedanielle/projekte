import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Auth, CurrentUser } from '../common/auth.decorator';
import { JwtUser } from '../common/auth.guard';
import { AddToCartDto, UpdateCartDto } from './cart.dto';
import { CartService } from './cart.service';

@Controller('cart')
@Auth(Role.CUSTOMER)
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  get(@CurrentUser() user: JwtUser) {
    return this.cart.get(user.sub);
  }

  @Post()
  add(@CurrentUser() user: JwtUser, @Body() dto: AddToCartDto) {
    return this.cart.add(user.sub, dto.offerId, dto.quantity);
  }

  @Patch(':id')
  update(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCartDto) {
    return this.cart.update(user.sub, id, dto.quantity);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.cart.remove(user.sub, id);
  }
}
