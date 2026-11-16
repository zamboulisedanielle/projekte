import { inject, Injectable, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Api, errorMessage } from './api';
import { AuthStore } from './auth';
import { Cart } from './models';

/** Keeps the cart in a signal so the toolbar badge updates everywhere. */
@Injectable({ providedIn: 'root' })
export class CartStore {
  private api = inject(Api);
  private auth = inject(AuthStore);
  private snack = inject(MatSnackBar);

  readonly cart = signal<Cart>({ items: [], totalCents: 0, count: 0 });

  refresh() {
    if (!this.auth.isCustomer()) {
      this.cart.set({ items: [], totalCents: 0, count: 0 });
      return;
    }
    this.api.cart().subscribe({ next: (c) => this.cart.set(c) });
  }

  add(offerId: number, title: string) {
    this.api.addToCart(offerId).subscribe({
      next: (c) => {
        this.cart.set(c);
        this.snack.open(`„${title}“ liegt im Warenkorb.`, 'OK', { duration: 2500 });
      },
      error: (e) => this.snack.open(errorMessage(e), 'OK', { duration: 4000 }),
    });
  }

  update(itemId: number, quantity: number) {
    this.api.updateCartItem(itemId, quantity).subscribe({
      next: (c) => this.cart.set(c),
      error: (e) => this.snack.open(errorMessage(e), 'OK', { duration: 4000 }),
    });
  }

  remove(itemId: number) {
    this.api.removeCartItem(itemId).subscribe({ next: (c) => this.cart.set(c) });
  }
}
