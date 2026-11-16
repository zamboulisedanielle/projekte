import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import {
  Address,
  AdminCustomer,
  AdminMerchant,
  AdminOverview,
  Book,
  BookWithOffers,
  Cart,
  MerchantShop,
  MerchantStats,
  Offer,
  Order,
  OrderStatus,
  Session,
  ShopDetail,
  ShopSummary,
} from './models';

export const API_URL = 'http://localhost:3000/api';

/** Turns any backend error into a readable sentence. */
export function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Der Server ist nicht erreichbar. Läuft das Backend auf Port 3000?';
    const msg = err.error?.message;
    if (Array.isArray(msg)) return msg.join(' ');
    if (typeof msg === 'string') return msg;
  }
  return 'Etwas ist schiefgelaufen. Bitte versuche es erneut.';
}

@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);

  // Auth
  login(email: string, password: string): Observable<Session> {
    return this.http.post<Session>(`${API_URL}/auth/login`, { email, password });
  }
  register(data: { email: string; password: string; name: string; role: 'CUSTOMER' | 'MERCHANT' }): Observable<Session> {
    return this.http.post<Session>(`${API_URL}/auth/register`, data);
  }

  // Public
  searchBooks(q: string): Observable<BookWithOffers[]> {
    return this.http.get<BookWithOffers[]>(`${API_URL}/books`, { params: new HttpParams().set('q', q) });
  }
  book(id: number): Observable<BookWithOffers> {
    return this.http.get<BookWithOffers>(`${API_URL}/books/${id}`);
  }
  catalogue(): Observable<Book[]> {
    return this.http.get<Book[]>(`${API_URL}/books/catalogue`);
  }
  shops(): Observable<ShopSummary[]> {
    return this.http.get<ShopSummary[]>(`${API_URL}/shops`);
  }
  shop(id: number): Observable<ShopDetail> {
    return this.http.get<ShopDetail>(`${API_URL}/shops/${id}`);
  }

  // Customer
  cart(): Observable<Cart> {
    return this.http.get<Cart>(`${API_URL}/cart`);
  }
  addToCart(offerId: number, quantity = 1): Observable<Cart> {
    return this.http.post<Cart>(`${API_URL}/cart`, { offerId, quantity });
  }
  updateCartItem(id: number, quantity: number): Observable<Cart> {
    return this.http.patch<Cart>(`${API_URL}/cart/${id}`, { quantity });
  }
  removeCartItem(id: number): Observable<Cart> {
    return this.http.delete<Cart>(`${API_URL}/cart/${id}`);
  }
  checkout(address: Address): Observable<Order[]> {
    return this.http.post<Order[]>(`${API_URL}/orders/checkout`, address);
  }
  myOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${API_URL}/orders`);
  }
  invoicePdf(orderId: number): Promise<Blob> {
    return firstValueFrom(this.http.get(`${API_URL}/orders/${orderId}/invoice`, { responseType: 'blob' }));
  }

  // Merchant
  merchantShops(): Observable<MerchantShop[]> {
    return this.http.get<MerchantShop[]>(`${API_URL}/merchant/shops`);
  }
  merchantShop(id: number): Observable<ShopDetail> {
    return this.http.get<ShopDetail>(`${API_URL}/merchant/shops/${id}`);
  }
  createShop(data: { name: string; description: string; city: string }): Observable<MerchantShop> {
    return this.http.post<MerchantShop>(`${API_URL}/merchant/shops`, data);
  }
  updateShop(id: number, data: { name: string; description: string; city: string }): Observable<MerchantShop> {
    return this.http.patch<MerchantShop>(`${API_URL}/merchant/shops/${id}`, data);
  }
  deleteShop(id: number): Observable<unknown> {
    return this.http.delete(`${API_URL}/merchant/shops/${id}`);
  }
  createOffer(
    shopId: number,
    data: { bookId?: number; newBook?: Partial<Book>; priceCents: number; stock: number },
  ): Observable<Offer> {
    return this.http.post<Offer>(`${API_URL}/merchant/shops/${shopId}/offers`, data);
  }
  updateOffer(id: number, data: { priceCents?: number; stock?: number }): Observable<Offer> {
    return this.http.patch<Offer>(`${API_URL}/merchant/offers/${id}`, data);
  }
  deleteOffer(id: number): Observable<unknown> {
    return this.http.delete(`${API_URL}/merchant/offers/${id}`);
  }
  merchantOrders(status?: OrderStatus): Observable<Order[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<Order[]>(`${API_URL}/merchant/orders`, { params });
  }
  setOrderStatus(id: number, status: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(`${API_URL}/merchant/orders/${id}`, { status });
  }
  labelPdf(orderId: number): Promise<Blob> {
    return firstValueFrom(this.http.get(`${API_URL}/merchant/orders/${orderId}/label`, { responseType: 'blob' }));
  }
  merchantStats(days = 30): Observable<MerchantStats> {
    return this.http.get<MerchantStats>(`${API_URL}/merchant/stats`, { params: new HttpParams().set('days', days) });
  }

  // Admin
  adminOverview(): Observable<AdminOverview> {
    return this.http.get<AdminOverview>(`${API_URL}/admin/overview`);
  }
  adminMerchants(): Observable<AdminMerchant[]> {
    return this.http.get<AdminMerchant[]>(`${API_URL}/admin/merchants`);
  }
  adminCustomers(): Observable<AdminCustomer[]> {
    return this.http.get<AdminCustomer[]>(`${API_URL}/admin/customers`);
  }
}

/** Opens a PDF blob in a new tab (falls back to a download if pop-ups are blocked). */
export function openPdf(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
