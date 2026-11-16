import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { Api, errorMessage, openPdf } from '../../core/api';
import { AuthStore } from '../../core/auth';
import { CartStore } from '../../core/cart-store';
import { Order } from '../../core/models';
import { EuroPipe } from '../../shared/euro.pipe';

@Component({
  selector: 'app-checkout-page',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, RouterLink, EuroPipe],
  template: `
    @if (placed().length) {
      <section class="panel done">
        <mat-icon class="ok">check_circle</mat-icon>
        <h1>Danke für deine Bestellung</h1>
        <p class="muted">
          @if (placed().length > 1) {
            Deine Bücher kommen aus {{ placed().length }} Shops, deshalb gibt es {{ placed().length }} Bestellungen.
          } @else {
            Der Shop wurde benachrichtigt und bereitet den Versand vor.
          }
        </p>
        <ul>
          @for (order of placed(); track order.id) {
            <li>
              <div>
                <strong>{{ order.orderNumber }}</strong>
                <span class="muted"> · {{ order.shop.name }} · {{ order.totalCents | euro }}</span>
              </div>
              <button mat-stroked-button (click)="invoice(order)"><mat-icon>picture_as_pdf</mat-icon> Rechnung</button>
            </li>
          }
        </ul>
        <a mat-flat-button routerLink="/bestellungen">Zu meinen Bestellungen</a>
      </section>
    } @else {
      <header class="page-head"><h1>Kasse</h1></header>
      <div class="layout">
        <form class="panel" [formGroup]="form" (ngSubmit)="submit()">
          <h2>Lieferadresse</h2>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" autocomplete="name" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Straße und Hausnummer</mat-label>
            <input matInput formControlName="street" autocomplete="street-address" />
          </mat-form-field>
          <div class="two">
            <mat-form-field appearance="outline">
              <mat-label>PLZ</mat-label>
              <input matInput formControlName="zip" autocomplete="postal-code" inputmode="numeric" />
              @if (form.controls.zip.invalid && form.controls.zip.touched) {
                <mat-error>4 oder 5 Ziffern</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Ort</mat-label>
              <input matInput formControlName="city" autocomplete="address-level2" />
            </mat-form-field>
          </div>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Land</mat-label>
            <input matInput formControlName="country" autocomplete="country-name" />
          </mat-form-field>
          <p class="muted note">Eine Bezahlung ist in diesem Projekt nicht umgesetzt. Die Bestellung wird direkt angelegt.</p>
          @if (error()) {
            <p class="error" role="alert">{{ error() }}</p>
          }
          <button mat-flat-button class="full" [disabled]="form.invalid || busy() || cart.cart().count === 0">
            Jetzt bestellen · {{ cart.cart().totalCents | euro }}
          </button>
        </form>
        <aside class="panel">
          <h2>Deine Bestellung</h2>
          @for (item of cart.cart().items; track item.id) {
            <div class="line">
              <span>{{ item.quantity }} × {{ item.offer.book.title }}</span>
              <span class="price">{{ item.quantity * item.offer.priceCents | euro }}</span>
            </div>
          } @empty {
            <p class="muted">Dein Warenkorb ist leer. <a routerLink="/">Bücher suchen</a></p>
          }
        </aside>
      </div>
    }
  `,
  styles: `
    .layout { display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; }
    .two { display: grid; grid-template-columns: 140px 1fr; gap: 12px; }
    .note { font-size: 0.85rem; }
    .error { color: #b3261e; }
    .line { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-top: 1px solid var(--amz-line); }
    .done { max-width: 640px; margin: 0 auto; text-align: center; padding: 40px 32px; }
    .ok { color: var(--amz-ok); font-size: 48px; width: 48px; height: 48px; }
    .done ul { list-style: none; padding: 0; margin: 24px 0; text-align: left; }
    .done li { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid var(--amz-line); }
    @media (max-width: 860px) { .layout { grid-template-columns: 1fr; } }
  `,
})
export class CheckoutPage {
  private api = inject(Api);
  protected cart = inject(CartStore);
  private auth = inject(AuthStore);

  form = inject(FormBuilder).nonNullable.group({
    name: [this.auth.user()?.name ?? '', Validators.required],
    street: ['', Validators.required],
    zip: ['', [Validators.required, Validators.pattern(/^\d{4,5}$/)]],
    city: ['', Validators.required],
    country: ['Deutschland'],
  });
  busy = signal(false);
  error = signal('');
  placed = signal<Order[]>([]);

  constructor() {
    this.cart.refresh();
  }

  submit() {
    this.busy.set(true);
    this.error.set('');
    this.api.checkout(this.form.getRawValue()).subscribe({
      next: (orders) => {
        this.placed.set(orders);
        this.cart.refresh();
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.busy.set(false);
      },
    });
  }

  async invoice(order: Order) {
    openPdf(await this.api.invoicePdf(order.id), `Rechnung-${order.orderNumber}.pdf`);
  }
}
