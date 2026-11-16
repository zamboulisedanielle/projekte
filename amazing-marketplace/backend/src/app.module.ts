import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './admin/admin.controller';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { BooksController } from './books/books.controller';
import { CartController } from './cart/cart.controller';
import { CartService } from './cart/cart.service';
import { MerchantController } from './merchant/merchant.controller';
import { MerchantService } from './merchant/merchant.service';
import { OrdersController } from './orders/orders.controller';
import { OrdersService } from './orders/orders.service';
import { PdfService } from './pdf/pdf.service';
import { PrismaService } from './prisma/prisma.service';
import { ShopsController } from './shops/shops.controller';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'amazing-dev-secret-change-me',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [
    AuthController,
    BooksController,
    ShopsController,
    CartController,
    OrdersController,
    MerchantController,
    AdminController,
  ],
  providers: [PrismaService, AuthService, CartService, OrdersService, MerchantService, PdfService],
})
export class AppModule {}
