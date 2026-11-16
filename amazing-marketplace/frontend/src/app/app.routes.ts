import { Routes } from '@angular/router';
import { roleGuard } from './core/auth';

export const routes: Routes = [
  { path: '', title: 'Bücher finden · Amazing', loadComponent: () => import('./pages/books-page').then((m) => m.BooksPage) },
  { path: 'shops', title: 'Shops · Amazing', loadComponent: () => import('./pages/shops-page').then((m) => m.ShopsPage) },
  { path: 'shops/:id', title: 'Shop · Amazing', loadComponent: () => import('./pages/shop-page').then((m) => m.ShopPage) },
  { path: 'anmelden', title: 'Anmelden · Amazing', loadComponent: () => import('./pages/login-page').then((m) => m.LoginPage) },
  { path: 'registrieren', title: 'Registrieren · Amazing', loadComponent: () => import('./pages/register-page').then((m) => m.RegisterPage) },

  // Customer
  {
    path: 'warenkorb',
    title: 'Warenkorb · Amazing',
    canActivate: [roleGuard('CUSTOMER')],
    loadComponent: () => import('./pages/customer/cart-page').then((m) => m.CartPage),
  },
  {
    path: 'kasse',
    title: 'Kasse · Amazing',
    canActivate: [roleGuard('CUSTOMER')],
    loadComponent: () => import('./pages/customer/checkout-page').then((m) => m.CheckoutPage),
  },
  {
    path: 'bestellungen',
    title: 'Meine Bestellungen · Amazing',
    canActivate: [roleGuard('CUSTOMER')],
    loadComponent: () => import('./pages/customer/orders-page').then((m) => m.OrdersPage),
  },

  // Merchant
  {
    path: 'haendler',
    canActivate: [roleGuard('MERCHANT')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard · Amazing',
        loadComponent: () => import('./pages/merchant/merchant-dashboard-page').then((m) => m.MerchantDashboardPage),
      },
      {
        path: 'shops',
        title: 'Meine Shops · Amazing',
        loadComponent: () => import('./pages/merchant/merchant-shops-page').then((m) => m.MerchantShopsPage),
      },
      {
        path: 'shops/:id',
        title: 'Shop verwalten · Amazing',
        loadComponent: () => import('./pages/merchant/merchant-shop-page').then((m) => m.MerchantShopPage),
      },
      {
        path: 'bestellungen',
        title: 'Bestellungen · Amazing',
        loadComponent: () => import('./pages/merchant/merchant-orders-page').then((m) => m.MerchantOrdersPage),
      },
    ],
  },

  // Admin
  {
    path: 'admin',
    title: 'Administration · Amazing',
    canActivate: [roleGuard('ADMIN')],
    loadComponent: () => import('./pages/admin/admin-page').then((m) => m.AdminPage),
  },

  { path: '**', redirectTo: '' },
];
