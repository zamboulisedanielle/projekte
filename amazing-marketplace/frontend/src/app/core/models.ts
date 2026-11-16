export type Role = 'CUSTOMER' | 'MERCHANT' | 'ADMIN';
export type OrderStatus = 'OPEN' | 'PROCESSED';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export interface Session {
  token: string;
  user: User;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  description: string;
  publishedYear: number | null;
}

export interface ShopRef {
  id: number;
  name: string;
  city?: string;
}

export interface Offer {
  id: number;
  shopId: number;
  bookId: number;
  priceCents: number;
  stock: number;
  book?: Book;
  shop?: ShopRef;
}

export interface BookWithOffers extends Book {
  offers: (Offer & { shop: ShopRef })[];
}

export interface ShopSummary {
  id: number;
  name: string;
  description: string;
  city: string;
  owner: { name: string };
  _count: { offers: number };
}

export interface ShopDetail {
  id: number;
  name: string;
  description: string;
  city: string;
  owner: { name: string };
  offers: (Offer & { book: Book })[];
}

export interface CartItem {
  id: number;
  quantity: number;
  offer: Offer & { book: Book; shop: ShopRef };
}

export interface Cart {
  items: CartItem[];
  totalCents: number;
  count: number;
}

export interface OrderItem {
  id: number;
  bookId: number;
  bookTitle: string;
  bookAuthor: string;
  unitPriceCents: number;
  quantity: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  shippingName: string;
  shippingStreet: string;
  shippingZip: string;
  shippingCity: string;
  shippingCountry: string;
  totalCents: number;
  createdAt: string;
  processedAt: string | null;
  items: OrderItem[];
  shop: ShopRef;
  customer: { id: number; name: string; email: string };
}

export interface MerchantShop {
  id: number;
  name: string;
  description: string;
  city: string;
  revenueCents: number;
  _count: { offers: number; orders: number };
}

export interface MerchantStats {
  totals: { revenueCents: number; orders: number; openOrders: number; booksSold: number };
  revenuePerBook: { bookId: number; title: string; author: string; quantity: number; revenueCents: number }[];
  revenuePerDay: { date: string; revenueCents: number }[];
}

export interface AdminOverview {
  merchants: number;
  customers: number;
  shops: number;
  orders: number;
  revenueCents: number;
}

export interface AdminMerchant {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  shops: { id: number; name: string; city: string; offers: number; orders: number }[];
  orders: number;
  openOrders: number;
  revenueCents: number;
}

export interface AdminCustomer {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  totalSpentCents: number;
  orders: {
    id: number;
    orderNumber: string;
    status: OrderStatus;
    totalCents: number;
    createdAt: string;
    shop: { name: string };
    items: { bookTitle: string; quantity: number }[];
  }[];
}

export interface Address {
  name: string;
  street: string;
  zip: string;
  city: string;
  country?: string;
}
