import { Component, computed, effect, inject, input, numberAttribute, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { Api, errorMessage } from '../../core/api';
import { Book, Offer, ShopDetail } from '../../core/models';
import { BookCover } from '../../shared/book-cover';

const toCents = (euro: number | string) => Math.round(Number(String(euro).replace(',', '.')) * 100);

@Component({
  selector: 'app-merchant-shop-page',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    RouterLink,
    BookCover,
  ],
  template: `
    <a routerLink="/haendler/shops" class="back">← Meine Shops</a>
    @if (shop(); as shop) {
      <header class="page-head">
        <div>
          <h1>{{ shop.name }}</h1>
          <p>{{ shop.description || 'Noch keine Beschreibung.' }} <span class="muted">· {{ shop.city }}</span></p>
        </div>
        <div class="head-actions">
          <button mat-stroked-button (click)="editing.set(!editing())"><mat-icon>edit</mat-icon> Shop bearbeiten</button>
          <button mat-button (click)="deleteShop()"><mat-icon>delete_outline</mat-icon> Löschen</button>
        </div>
      </header>

      @if (editing()) {
        <form class="panel block" [formGroup]="shopForm" (ngSubmit)="saveShop()">
          <div class="grid2">
            <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput formControlName="name" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Ort</mat-label><input matInput formControlName="city" /></mat-form-field>
          </div>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Beschreibung</mat-label><textarea matInput formControlName="description" rows="2"></textarea>
          </mat-form-field>
          <div class="actions">
            <button mat-button type="button" (click)="editing.set(false)">Abbrechen</button>
            <button mat-flat-button [disabled]="shopForm.invalid">Änderungen speichern</button>
          </div>
        </form>
      }

      <section class="panel block">
        <h2>Buch anbieten</h2>
        <mat-button-toggle-group [(ngModel)]="mode" class="mode" aria-label="Buch auswählen oder neu anlegen">
          <mat-button-toggle value="existing">Aus dem Katalog</mat-button-toggle>
          <mat-button-toggle value="new">Neues Buch anlegen</mat-button-toggle>
        </mat-button-toggle-group>
        <form [formGroup]="offerForm" (ngSubmit)="addOffer()">
          @if (mode === 'existing') {
            <mat-form-field appearance="outline" class="full">
              <mat-label>Buch</mat-label>
              <mat-select formControlName="bookId">
                @for (book of availableBooks(); track book.id) {
                  <mat-option [value]="book.id">{{ book.title }} · {{ book.author }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          } @else {
            <div class="grid2">
              <mat-form-field appearance="outline"><mat-label>Titel</mat-label><input matInput formControlName="title" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Autor</mat-label><input matInput formControlName="author" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>ISBN</mat-label><input matInput formControlName="isbn" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Erscheinungsjahr</mat-label><input matInput type="number" formControlName="publishedYear" /></mat-form-field>
            </div>
            <mat-form-field appearance="outline" class="full">
              <mat-label>Beschreibung</mat-label><textarea matInput formControlName="description" rows="2"></textarea>
            </mat-form-field>
          }
          <div class="grid3">
            <mat-form-field appearance="outline">
              <mat-label>Preis</mat-label>
              <input matInput formControlName="price" inputmode="decimal" placeholder="12,99" />
              <span matTextSuffix>€</span>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Lagerbestand</mat-label>
              <input matInput type="number" min="0" formControlName="stock" />
            </mat-form-field>
            <button mat-flat-button class="add" [disabled]="!offerValid()"><mat-icon>add</mat-icon> Anbieten</button>
          </div>
        </form>
      </section>

      <section class="panel">
        <h2>Angebotene Bücher ({{ shop.offers.length }})</h2>
        <div class="table-wrap">
          <table class="offers">
            <thead>
              <tr><th></th><th>Buch</th><th class="num">Preis (€)</th><th class="num">Lager</th><th></th></tr>
            </thead>
            <tbody>
              @for (offer of shop.offers; track offer.id) {
                <tr>
                  <td class="cover"><app-book-cover [title]="offer.book.title" size="small" /></td>
                  <td><strong>{{ offer.book.title }}</strong><br /><span class="muted">{{ offer.book.author }} · ISBN {{ offer.book.isbn }}</span></td>
                  <td class="num">
                    <input class="cell" [value]="(offer.priceCents / 100).toFixed(2).replace('.', ',')" (change)="updatePrice(offer, $any($event.target).value)" aria-label="Preis" />
                  </td>
                  <td class="num">
                    <input class="cell small" type="number" min="0" [value]="offer.stock" (change)="updateStock(offer, $any($event.target).value)" aria-label="Lagerbestand" />
                  </td>
                  <td>
                    <button mat-icon-button (click)="removeOffer(offer)" aria-label="Angebot entfernen"><mat-icon>delete_outline</mat-icon></button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="muted">Noch keine Bücher. Biete oben dein erstes Buch an.</td></tr>
              }
            </tbody>
          </table>
        </div>
        <p class="muted hint">Preis oder Lagerbestand direkt in der Tabelle ändern. Gespeichert wird beim Verlassen des Feldes.</p>
      </section>
    }
  `,
  styles: `
    .back { display: inline-block; margin-bottom: 12px; text-decoration: none; font-size: 0.9rem; }
    .head-actions { display: flex; gap: 8px; }
    .block { margin-bottom: 20px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .grid3 { display: grid; grid-template-columns: 1fr 1fr auto; gap: 12px; align-items: start; }
    .add { height: 56px; }
    .mode { margin-bottom: 16px; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; }
    .offers { width: 100%; border-collapse: collapse; }
    .offers th { text-align: left; font-size: 0.85rem; color: var(--amz-muted); font-weight: 600; padding: 8px; border-bottom: 1px solid var(--amz-line); }
    .offers td { padding: 8px; border-bottom: 1px solid var(--amz-line); vertical-align: middle; }
    .offers .muted { font-size: 0.85rem; }
    .cover { width: 40px; }
    .cell { width: 80px; padding: 6px 8px; border: 1px solid var(--amz-line); border-radius: 6px; font: inherit; text-align: right; }
    .cell.small { width: 64px; }
    .cell:focus { border-color: var(--amz-cloth); outline: none; }
    .hint { font-size: 0.85rem; margin-bottom: 0; }
    @media (max-width: 700px) { .grid2, .grid3 { grid-template-columns: 1fr; } }
  `,
})
export class MerchantShopPage {
  id = input.required({ transform: numberAttribute });
  private api = inject(Api);
  private snack = inject(MatSnackBar);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  shop = signal<ShopDetail | null>(null);
  catalogue = signal<Book[]>([]);
  editing = signal(false);
  mode: 'existing' | 'new' = 'existing';

  availableBooks = computed(() => {
    const offered = new Set(this.shop()?.offers.map((o) => o.bookId));
    return this.catalogue().filter((b) => !offered.has(b.id));
  });

  shopForm = this.fb.nonNullable.group({ name: ['', Validators.required], city: [''], description: [''] });
  offerForm = this.fb.group({
    bookId: [null as number | null],
    title: [''],
    author: [''],
    isbn: [''],
    publishedYear: [null as number | null],
    description: [''],
    price: ['', [Validators.required, Validators.pattern(/^\d+([.,]\d{1,2})?$/)]],
    stock: [10, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    effect(() => this.load(this.id()));
    this.api.catalogue().subscribe((c) => this.catalogue.set(c));
  }

  load(id: number) {
    this.api.merchantShop(id).subscribe({
      next: (s) => {
        this.shop.set(s);
        this.shopForm.setValue({ name: s.name, city: s.city, description: s.description });
      },
      error: () => this.router.navigateByUrl('/haendler/shops'),
    });
  }

  offerValid(): boolean {
    const v = this.offerForm.value;
    if (this.offerForm.controls.price.invalid || this.offerForm.controls.stock.invalid) return false;
    return this.mode === 'existing' ? !!v.bookId : !!(v.title && v.author && v.isbn);
  }

  saveShop() {
    this.api.updateShop(this.id(), this.shopForm.getRawValue()).subscribe({
      next: () => {
        this.editing.set(false);
        this.snack.open('Shop gespeichert.', 'OK', { duration: 2500 });
        this.load(this.id());
      },
      error: (e) => this.snack.open(errorMessage(e), 'OK', { duration: 4000 }),
    });
  }

  deleteShop() {
    if (!confirm('Diesen Shop mit allen Angeboten löschen?')) return;
    this.api.deleteShop(this.id()).subscribe({
      next: () => {
        this.snack.open('Shop gelöscht.', 'OK', { duration: 2500 });
        this.router.navigateByUrl('/haendler/shops');
      },
      error: (e) => this.snack.open(errorMessage(e), 'OK', { duration: 5000 }),
    });
  }

  addOffer() {
    if (!this.offerValid()) return;
    const v = this.offerForm.getRawValue();
    const payload =
      this.mode === 'existing'
        ? { bookId: v.bookId!, priceCents: toCents(v.price!), stock: Number(v.stock) }
        : {
            newBook: {
              title: v.title!,
              author: v.author!,
              isbn: v.isbn!,
              description: v.description ?? '',
              ...(v.publishedYear ? { publishedYear: Number(v.publishedYear) } : {}),
            },
            priceCents: toCents(v.price!),
            stock: Number(v.stock),
          };
    this.api.createOffer(this.id(), payload).subscribe({
      next: (offer) => {
        this.snack.open(`„${offer.book?.title}“ wird jetzt angeboten.`, 'OK', { duration: 2500 });
        this.offerForm.reset({ stock: 10, price: '' });
        this.load(this.id());
        this.api.catalogue().subscribe((c) => this.catalogue.set(c));
      },
      error: (e) => this.snack.open(errorMessage(e), 'OK', { duration: 4000 }),
    });
  }

  updatePrice(offer: Offer, value: string) {
    const cents = toCents(value);
    if (!cents || cents < 1) {
      this.snack.open('Bitte gib einen gültigen Preis ein, z. B. 12,99.', 'OK', { duration: 3000 });
      return;
    }
    this.api.updateOffer(offer.id, { priceCents: cents }).subscribe({
      next: () => this.snack.open('Preis gespeichert.', undefined, { duration: 1500 }),
      error: (e) => this.snack.open(errorMessage(e), 'OK', { duration: 4000 }),
    });
  }

  updateStock(offer: Offer, value: string) {
    const stock = Math.max(0, Math.floor(Number(value)));
    this.api.updateOffer(offer.id, { stock }).subscribe({
      next: () => this.snack.open('Lagerbestand gespeichert.', undefined, { duration: 1500 }),
      error: (e) => this.snack.open(errorMessage(e), 'OK', { duration: 4000 }),
    });
  }

  removeOffer(offer: Offer & { book?: Book }) {
    if (!confirm(`„${offer.book?.title}“ aus dem Shop entfernen?`)) return;
    this.api.deleteOffer(offer.id).subscribe(() => this.load(this.id()));
  }
}
