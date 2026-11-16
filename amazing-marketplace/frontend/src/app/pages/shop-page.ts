import { Component, inject, input, numberAttribute } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { Api } from '../core/api';
import { AuthStore } from '../core/auth';
import { CartStore } from '../core/cart-store';
import { BookCover } from '../shared/book-cover';
import { EuroPipe } from '../shared/euro.pipe';

@Component({
  selector: 'app-shop-page',
  imports: [RouterLink, MatButtonModule, MatIconModule, BookCover, EuroPipe],
  template: `
    @if (shop(); as shop) {
      <a routerLink="/shops" class="back">← Alle Shops</a>
      <header class="page-head">
        <div>
          <h1>{{ shop.name }}</h1>
          <p>{{ shop.description }}</p>
          <p class="muted">{{ shop.city }} · betrieben von {{ shop.owner.name }}</p>
        </div>
      </header>
      <section class="list">
        @for (offer of shop.offers; track offer.id) {
          <article class="row">
            <app-book-cover [title]="offer.book.title" size="small" />
            <div>
              <h3>{{ offer.book.title }}</h3>
              <span class="muted">{{ offer.book.author }}</span>
            </div>
            <div class="right">
              <span class="price">{{ offer.priceCents | euro }}</span>
              <span class="muted small">{{ offer.stock > 0 ? offer.stock + ' auf Lager' : 'ausverkauft' }}</span>
            </div>
            @if (auth.isCustomer()) {
              <button mat-stroked-button [disabled]="offer.stock === 0" (click)="cart.add(offer.id, offer.book.title)">
                <mat-icon>add_shopping_cart</mat-icon> In den Warenkorb
              </button>
            } @else if (!auth.user()) {
              <a mat-stroked-button routerLink="/anmelden">Zum Kaufen anmelden</a>
            }
          </article>
        } @empty {
          <p class="muted">Dieser Shop bietet gerade keine Bücher an.</p>
        }
      </section>
    }
  `,
  styles: `
    .back { display: inline-block; margin-bottom: 12px; text-decoration: none; font-size: 0.9rem; }
    .list { background: #fff; border: 1px solid var(--amz-line); border-radius: 10px; padding: 4px 20px; }
    .row {
      display: grid;
      grid-template-columns: 48px 1fr auto auto;
      align-items: center;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid var(--amz-line);
    }
    .row:last-child { border-bottom: 0; }
    .row h3 { margin: 0; font-size: 1rem; }
    .right { display: flex; flex-direction: column; align-items: flex-end; }
    .small { font-size: 0.8rem; }
    @media (max-width: 620px) {
      .row { grid-template-columns: 48px 1fr auto; }
      .row > :last-child { grid-column: 2 / -1; justify-self: start; }
    }
  `,
})
export class ShopPage {
  id = input.required({ transform: numberAttribute });
  private api = inject(Api);
  protected auth = inject(AuthStore);
  protected cart = inject(CartStore);
  shop = toSignal(toObservable(this.id).pipe(switchMap((id) => this.api.shop(id))));
}
