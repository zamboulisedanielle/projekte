import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Api, openPdf } from '../../core/api';
import { Order } from '../../core/models';
import { EuroPipe } from '../../shared/euro.pipe';

@Component({
  selector: 'app-orders-page',
  imports: [DatePipe, MatButtonModule, MatIconModule, RouterLink, EuroPipe],
  template: `
    <header class="page-head">
      <div>
        <h1>Meine Bestellungen</h1>
        <p>Alle Bestellungen mit Rechnung zum Herunterladen.</p>
      </div>
    </header>
    @if (orders(); as orders) {
      @for (order of orders; track order.id) {
        <article class="panel order">
          <header>
            <div>
              <h2>{{ order.orderNumber }}</h2>
              <span class="muted">{{ order.createdAt | date: 'd. MMMM y, HH:mm' }} · {{ order.shop.name }}</span>
            </div>
            <span class="status" [class]="order.status">{{ order.status === 'OPEN' ? 'In Bearbeitung' : 'Versendet' }}</span>
          </header>
          <ul>
            @for (item of order.items; track item.id) {
              <li>
                <span>{{ item.quantity }} × {{ item.bookTitle }} <span class="muted">· {{ item.bookAuthor }}</span></span>
                <span class="price">{{ item.quantity * item.unitPriceCents | euro }}</span>
              </li>
            }
          </ul>
          <footer>
            <span class="muted">An {{ order.shippingName }}, {{ order.shippingStreet }}, {{ order.shippingZip }} {{ order.shippingCity }}</span>
            <span class="total">Gesamt <span class="price">{{ order.totalCents | euro }}</span></span>
            <button mat-stroked-button (click)="invoice(order)"><mat-icon>picture_as_pdf</mat-icon> Rechnung</button>
          </footer>
        </article>
      } @empty {
        <div class="empty panel">
          <h2>Noch keine Bestellungen</h2>
          <p>Wenn du etwas bestellst, findest du es hier.</p>
          <a mat-flat-button routerLink="/">Bücher entdecken</a>
        </div>
      }
    }
  `,
  styles: `
    .order { margin-bottom: 16px; }
    .order header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
    .order h2 { font-size: 1.1rem; margin: 0; font-variant-numeric: tabular-nums; }
    .order ul { list-style: none; padding: 0; margin: 14px 0; }
    .order li { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; border-top: 1px solid var(--amz-line); }
    .order footer { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .order footer .muted { flex: 1; font-size: 0.85rem; min-width: 200px; }
  `,
})
export class OrdersPage {
  private api = inject(Api);
  orders = toSignal(this.api.myOrders());

  async invoice(order: Order) {
    openPdf(await this.api.invoicePdf(order.id), `Rechnung-${order.orderNumber}.pdf`);
  }
}
