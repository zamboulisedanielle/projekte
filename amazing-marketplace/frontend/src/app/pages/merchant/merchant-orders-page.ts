import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { Api, errorMessage, openPdf } from '../../core/api';
import { Order } from '../../core/models';
import { EuroPipe } from '../../shared/euro.pipe';

@Component({
  selector: 'app-merchant-orders-page',
  imports: [DatePipe, MatButtonModule, MatIconModule, MatTabsModule, EuroPipe],
  template: `
    <header class="page-head">
      <div>
        <h1>Bestellungen</h1>
        <p>Drucke das Versandlabel, verpacke die Bücher und markiere die Bestellung als bearbeitet.</p>
      </div>
    </header>

    <mat-tab-group [selectedIndex]="tab()" (selectedIndexChange)="tab.set($event)" animationDuration="0ms">
      <mat-tab [label]="'Offen (' + open().length + ')'" />
      <mat-tab [label]="'Bearbeitet (' + processed().length + ')'" />
      <mat-tab [label]="'Alle (' + orders().length + ')'" />
    </mat-tab-group>

    <section class="list">
      @for (order of visible(); track order.id) {
        <article class="panel order">
          <div class="main">
            <div class="top">
              <strong class="no">{{ order.orderNumber }}</strong>
              <span class="status" [class]="order.status">{{ order.status === 'OPEN' ? 'Offen' : 'Bearbeitet' }}</span>
            </div>
            <span class="muted">{{ order.createdAt | date: 'd. MMM y, HH:mm' }} · {{ order.shop.name }}</span>
            <ul>
              @for (item of order.items; track item.id) {
                <li>{{ item.quantity }} × {{ item.bookTitle }}</li>
              }
            </ul>
          </div>
          <div class="address">
            <span class="muted label">Lieferadresse</span>
            {{ order.shippingName }}<br />{{ order.shippingStreet }}<br />{{ order.shippingZip }} {{ order.shippingCity }}
          </div>
          <div class="side">
            <span class="price">{{ order.totalCents | euro }}</span>
            <button mat-stroked-button (click)="label(order)"><mat-icon>local_shipping</mat-icon> Versandlabel</button>
            @if (order.status === 'OPEN') {
              <button mat-flat-button (click)="setStatus(order, 'PROCESSED')"><mat-icon>done</mat-icon> Als bearbeitet markieren</button>
            } @else {
              <button mat-button (click)="setStatus(order, 'OPEN')">Wieder öffnen</button>
            }
          </div>
        </article>
      } @empty {
        <div class="empty">
          <h2>{{ tab() === 0 ? 'Keine offenen Bestellungen' : 'Keine Bestellungen' }}</h2>
          <p>{{ tab() === 0 ? 'Alles erledigt. Neue Bestellungen erscheinen hier.' : 'Hier erscheinen Bestellungen deiner Shops.' }}</p>
        </div>
      }
    </section>
  `,
  styles: `
    .list { margin-top: 16px; }
    .order { display: grid; grid-template-columns: 1fr 220px 220px; gap: 20px; margin-bottom: 12px; }
    .top { display: flex; align-items: center; gap: 12px; }
    .no { font-variant-numeric: tabular-nums; font-size: 1.05rem; }
    .main .muted { font-size: 0.85rem; }
    ul { margin: 8px 0 0; padding-left: 18px; }
    .address { font-size: 0.9rem; }
    .label { display: block; font-size: 0.8rem; }
    .side { display: flex; flex-direction: column; align-items: stretch; gap: 8px; }
    .side .price { text-align: right; font-size: 1.1rem; }
    @media (max-width: 860px) { .order { grid-template-columns: 1fr; } }
  `,
})
export class MerchantOrdersPage {
  private api = inject(Api);
  private snack = inject(MatSnackBar);

  orders = signal<Order[]>([]);
  tab = signal(0);
  open = computed(() => this.orders().filter((o) => o.status === 'OPEN'));
  processed = computed(() => this.orders().filter((o) => o.status === 'PROCESSED'));
  visible = computed(() => [this.open(), this.processed(), this.orders()][this.tab()]);

  constructor() {
    this.load();
  }

  load() {
    this.api.merchantOrders().subscribe((o) => this.orders.set(o));
  }

  setStatus(order: Order, status: 'OPEN' | 'PROCESSED') {
    this.api.setOrderStatus(order.id, status).subscribe({
      next: (updated) => {
        this.orders.update((list) => list.map((o) => (o.id === updated.id ? updated : o)));
        this.snack.open(status === 'PROCESSED' ? `${order.orderNumber} ist bearbeitet.` : `${order.orderNumber} ist wieder offen.`, 'OK', {
          duration: 2500,
        });
      },
      error: (e) => this.snack.open(errorMessage(e), 'OK', { duration: 4000 }),
    });
  }

  async label(order: Order) {
    try {
      openPdf(await this.api.labelPdf(order.id), `Versandlabel-${order.orderNumber}.pdf`);
    } catch (e) {
      this.snack.open(errorMessage(e), 'OK', { duration: 4000 });
    }
  }
}
