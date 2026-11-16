import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../core/auth';
import { CartStore } from '../core/cart-store';
import { Offer, ShopRef } from '../core/models';
import { EuroPipe } from '../shared/euro.pipe';

/** Offers of one book from different shops, with "add to cart" for customers. */
@Component({
  selector: 'app-offer-list',
  imports: [MatButtonModule, MatIconModule, RouterLink, EuroPipe],
  template: `
    <ul class="offers">
      @for (offer of offers(); track offer.id) {
        <li>
          <div class="shop">
            <a [routerLink]="['/shops', offer.shop.id]">{{ offer.shop.name }}</a>
            <span class="muted">{{ offer.shop.city }} · {{ offer.stock > 0 ? offer.stock + ' auf Lager' : 'ausverkauft' }}</span>
          </div>
          <span class="price">{{ offer.priceCents | euro }}</span>
          @if (auth.isCustomer()) {
            <button mat-stroked-button [disabled]="offer.stock === 0" (click)="cart.add(offer.id, title())">
              <mat-icon>add_shopping_cart</mat-icon> In den Warenkorb
            </button>
          } @else if (!auth.user()) {
            <a mat-stroked-button routerLink="/anmelden">Zum Kaufen anmelden</a>
          }
        </li>
      }
    </ul>
  `,
  styles: `
    .offers { list-style: none; margin: 0; padding: 0; }
    li {
      display: grid;
      grid-template-columns: 1fr auto auto;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-top: 1px solid var(--amz-line);
    }
    .shop { display: flex; flex-direction: column; font-size: 0.9rem; }
    .shop a { font-weight: 600; text-decoration: none; }
    .shop span { font-size: 0.8rem; }
    @media (max-width: 520px) {
      li { grid-template-columns: 1fr auto; }
      li > :last-child { grid-column: 1 / -1; }
    }
  `,
})
export class OfferList {
  offers = input.required<(Offer & { shop: ShopRef })[]>();
  title = input.required<string>();
  protected auth = inject(AuthStore);
  protected cart = inject(CartStore);
}
