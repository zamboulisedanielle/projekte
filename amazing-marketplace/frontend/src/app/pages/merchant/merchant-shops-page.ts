import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { Api, errorMessage } from '../../core/api';
import { MerchantShop } from '../../core/models';
import { EuroPipe } from '../../shared/euro.pipe';

@Component({
  selector: 'app-merchant-shops-page',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, RouterLink, EuroPipe],
  template: `
    <header class="page-head">
      <div>
        <h1>Meine Shops</h1>
        <p>Lege Shops an und verwalte die Bücher, die du darin anbietest.</p>
      </div>
      @if (!creating()) {
        <button mat-flat-button (click)="creating.set(true)"><mat-icon>add</mat-icon> Shop anlegen</button>
      }
    </header>

    @if (creating()) {
      <form class="panel new" [formGroup]="form" (ngSubmit)="create()">
        <h2>Neuer Shop</h2>
        <div class="fields">
          <mat-form-field appearance="outline">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Ort</mat-label>
            <input matInput formControlName="city" />
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Beschreibung</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>
        <div class="actions">
          <button mat-button type="button" (click)="creating.set(false)">Abbrechen</button>
          <button mat-flat-button [disabled]="form.invalid">Shop anlegen</button>
        </div>
      </form>
    }

    <section class="shops">
      @for (shop of shops(); track shop.id) {
        <a class="panel shop" [routerLink]="['/haendler/shops', shop.id]">
          <h2>{{ shop.name }}</h2>
          <p class="muted">{{ shop.city }}</p>
          <dl>
            <div><dt>Bücher</dt><dd>{{ shop._count.offers }}</dd></div>
            <div><dt>Bestellungen</dt><dd>{{ shop._count.orders }}</dd></div>
            <div><dt>Umsatz</dt><dd>{{ shop.revenueCents | euro }}</dd></div>
          </dl>
          <span class="manage">Bücher verwalten</span>
        </a>
      } @empty {
        <div class="empty panel">
          <h2>Du hast noch keinen Shop</h2>
          <p>Lege deinen ersten Shop an, um Bücher anzubieten.</p>
        </div>
      }
    </section>
  `,
  styles: `
    .new { margin-bottom: 24px; }
    .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; }
    .shops { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .shop { text-decoration: none; color: inherit; display: flex; flex-direction: column; border-top: 4px solid var(--amz-cloth); }
    .shop:hover { border-top-color: var(--amz-gilt); }
    .shop p { margin: 0 0 12px; }
    dl { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 0 0 16px; }
    dt { font-size: 0.8rem; color: var(--amz-muted); }
    dd { margin: 0; font-weight: 600; font-variant-numeric: tabular-nums; }
    .manage { margin-top: auto; color: var(--amz-cloth); font-weight: 600; font-size: 0.9rem; }
    @media (max-width: 600px) { .fields { grid-template-columns: 1fr; } }
  `,
})
export class MerchantShopsPage {
  private api = inject(Api);
  private snack = inject(MatSnackBar);
  shops = signal<MerchantShop[]>([]);
  creating = signal(false);
  form = inject(FormBuilder).nonNullable.group({
    name: ['', Validators.required],
    city: [''],
    description: [''],
  });

  constructor() {
    this.load();
  }

  load() {
    this.api.merchantShops().subscribe((s) => this.shops.set(s));
  }

  create() {
    this.api.createShop(this.form.getRawValue()).subscribe({
      next: () => {
        this.snack.open('Shop angelegt.', 'OK', { duration: 2500 });
        this.form.reset();
        this.creating.set(false);
        this.load();
      },
      error: (e) => this.snack.open(errorMessage(e), 'OK', { duration: 4000 }),
    });
  }
}
