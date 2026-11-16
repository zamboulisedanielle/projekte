import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { CartStore } from '../../core/cart-store';
import { CartItem } from '../../core/models';
import { BookCover } from '../../shared/book-cover';
import { EuroPipe } from '../../shared/euro.pipe';

@Component({
  selector: 'app-cart-page',
  imports: [MatButtonModule, MatIconModule, RouterLink, BookCover, EuroPipe],
  template: `
    <header class="page-head">
      <div>
        <h1>Warenkorb</h1>
        @if (groups().length > 1) {
          <p>Deine Bücher kommen aus {{ groups().length }} Shops. Jeder Shop verschickt seine Bücher separat.</p>
        }
      </div>
    </header>

    @if (store.cart().items.length === 0) {
      <div class="empty panel">
        <h2>Dein Warenkorb ist leer</h2>
        <p>Finde dein nächstes Buch in der Suche.</p>
        <a mat-flat-button routerLink="/">Bücher entdecken</a>
      </div>
    } @else {
      <div class="layout">
        <section>
          @for (group of groups(); track group.shop) {
            <div class="panel group">
              <h2>{{ group.shop }}</h2>
              @for (item of group.items; track item.id) {
                <div class="item">
                  <app-book-cover [title]="item.offer.book.title" size="small" />
                  <div>
                    <h3>{{ item.offer.book.title }}</h3>
                    <span class="muted">{{ item.offer.book.author }} · {{ item.offer.priceCents | euro }}</span>
                  </div>
                  <div class="qty" aria-label="Menge">
                    <button mat-icon-button (click)="change(item, -1)" [disabled]="item.quantity <= 1" aria-label="Weniger">
                      <mat-icon>remove</mat-icon>
                    </button>
                    <span>{{ item.quantity }}</span>
                    <button mat-icon-button (click)="change(item, 1)" [disabled]="item.quantity >= item.offer.stock" aria-label="Mehr">
                      <mat-icon>add</mat-icon>
                    </button>
                  </div>
                  <span class="price line">{{ item.quantity * item.offer.priceCents | euro }}</span>
                  <button mat-icon-button (click)="store.remove(item.id)" aria-label="Entfernen">
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </div>
              }
            </div>
          }
        </section>
        <aside class="panel summary">
          <div class="row"><span>{{ store.cart().count }} Artikel</span><span>{{ store.cart().totalCents | euro }}</span></div>
          <div class="row"><span>Versand</span><span>kostenlos</span></div>
          <div class="row total"><span>Gesamt</span><span class="price">{{ store.cart().totalCents | euro }}</span></div>
          <a mat-flat-button routerLink="/kasse" class="full">Zur Kasse</a>
        </aside>
      </div>
    }
  `,
  styles: `
    .layout { display: grid; grid-template-columns: 1fr 300px; gap: 24px; align-items: start; }
    .group { margin-bottom: 16px; padding-bottom: 8px; }
    .group h2 { font-size: 1.1rem; }
    .item {
      display: grid;
      grid-template-columns: 44px 1fr auto 90px auto;
      gap: 14px;
      align-items: center;
      padding: 10px 0;
      border-top: 1px solid var(--amz-line);
    }
    .item h3 { margin: 0; font-size: 1rem; }
    .item .muted { font-size: 0.85rem; }
    .qty { display: flex; align-items: center; }
    .qty span { min-width: 24px; text-align: center; font-variant-numeric: tabular-nums; }
    .line { text-align: right; }
    .summary { position: sticky; top: 88px; display: flex; flex-direction: column; gap: 10px; }
    .row { display: flex; justify-content: space-between; }
    .total { border-top: 1px solid var(--amz-line); padding-top: 10px; font-size: 1.1rem; margin-bottom: 6px; }
    @media (max-width: 860px) {
      .layout { grid-template-columns: 1fr; }
      .item { grid-template-columns: 44px 1fr auto; }
      .qty { grid-column: 2; }
    }
  `,
})
export class CartPage {
  protected store = inject(CartStore);

  groups = computed(() => {
    const map = new Map<string, CartItem[]>();
    for (const item of this.store.cart().items) {
      const name = item.offer.shop.name;
      map.set(name, [...(map.get(name) ?? []), item]);
    }
    return [...map.entries()].map(([shop, items]) => ({ shop, items }));
  });

  constructor() {
    this.store.refresh();
  }

  change(item: CartItem, delta: number) {
    this.store.update(item.id, item.quantity + delta);
  }
}
