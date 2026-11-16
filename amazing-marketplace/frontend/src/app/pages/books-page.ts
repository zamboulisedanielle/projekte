import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, of, startWith, switchMap, tap } from 'rxjs';
import { Api, errorMessage } from '../core/api';
import { BookWithOffers } from '../core/models';
import { BookCover } from '../shared/book-cover';
import { EuroPipe } from '../shared/euro.pipe';
import { OfferList } from './offer-list';

@Component({
  selector: 'app-books-page',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatProgressBarModule, BookCover, EuroPipe, OfferList],
  template: `
    <section class="search">
      <h1>Welches Buch suchst du?</h1>
      <mat-form-field appearance="outline" class="field" subscriptSizing="dynamic">
        <mat-icon matPrefix>search</mat-icon>
        <input matInput [formControl]="query" placeholder="Titel, Autor oder ISBN" aria-label="Bücher suchen" />
      </mat-form-field>
      <p class="muted">
        @if (query.value) {
          {{ books().length }} {{ books().length === 1 ? 'Treffer' : 'Treffer' }} für „{{ query.value }}“
        } @else {
          {{ books().length }} Bücher aus allen Shops
        }
      </p>
    </section>

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }
    @if (error()) {
      <p class="panel">{{ error() }}</p>
    }

    <section class="grid">
      @for (book of books(); track book.id) {
        <article class="book" [class.open]="openId() === book.id">
          <button class="summary" (click)="toggle(book.id)" [attr.aria-expanded]="openId() === book.id">
            <app-book-cover [title]="book.title" [author]="book.author" />
            <div class="meta">
              <h3>{{ book.title }}</h3>
              <span class="muted">{{ book.author }}</span>
              <span class="from">
                ab <span class="price">{{ cheapest(book) | euro }}</span>
                <span class="muted"> · {{ book.offers.length }} {{ book.offers.length === 1 ? 'Shop' : 'Shops' }}</span>
              </span>
            </div>
          </button>
          @if (openId() === book.id) {
            <div class="details">
              @if (book.description) {
                <p>{{ book.description }}</p>
              }
              <p class="muted small">ISBN {{ book.isbn }}{{ book.publishedYear ? ' · erschienen ' + book.publishedYear : '' }}</p>
              <app-offer-list [offers]="book.offers" [title]="book.title" />
            </div>
          }
        </article>
      } @empty {
        @if (!loading()) {
          <div class="empty">
            <h2>Kein Buch gefunden</h2>
            <p>Versuche einen anderen Titel, einen Autorennamen oder eine ISBN.</p>
          </div>
        }
      }
    </section>
  `,
  styles: `
    .search { margin-bottom: 24px; max-width: 720px; }
    .search h1 { font-size: clamp(2rem, 4.5vw, 3rem); margin-bottom: 16px; }
    .field { width: 100%; }
    .search p { margin: 8px 0 0; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 28px 20px;
      align-items: start;
    }
    .book.open {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: minmax(160px, 220px) 1fr;
      gap: 24px;
      background: #fff;
      border: 1px solid var(--amz-line);
      border-radius: 10px;
      padding: 20px;
    }
    .summary {
      all: unset;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 100%;
    }
    .summary:focus-visible { outline: 2px solid var(--amz-gilt-dark); outline-offset: 4px; }
    .summary:hover app-book-cover { transform: translateY(-2px); }
    app-book-cover { display: block; transition: transform 0.15s ease; }
    .meta { display: flex; flex-direction: column; gap: 2px; }
    .meta h3 { margin: 0; font-size: 1rem; }
    .meta .muted { font-size: 0.9rem; }
    .from { margin-top: 4px; font-size: 0.9rem; }
    .details p { margin-top: 0; max-width: 60ch; }
    .small { font-size: 0.85rem; }
    .empty { grid-column: 1 / -1; }
    @media (max-width: 640px) {
      .book.open { grid-template-columns: 1fr; }
      .book.open .summary { flex-direction: row; }
      .book.open app-book-cover { width: 90px; flex: none; }
    }
  `,
})
export class BooksPage {
  private api = inject(Api);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  query = new FormControl(this.route.snapshot.queryParamMap.get('q') ?? '', { nonNullable: true });
  books = signal<BookWithOffers[]>([]);
  loading = signal(true);
  error = signal('');
  openId = signal<number | null>(null);

  constructor() {
    this.query.valueChanges
      .pipe(
        startWith(this.query.value),
        debounceTime(250),
        distinctUntilChanged(),
        tap((q) => {
          this.loading.set(true);
          this.router.navigate([], { queryParams: { q: q || null }, replaceUrl: true });
        }),
        switchMap((q) =>
          this.api.searchBooks(q).pipe(
            catchError((e) => {
              this.error.set(errorMessage(e));
              return of([] as BookWithOffers[]);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((books) => {
        this.books.set(books);
        this.loading.set(false);
        if (books.length) this.error.set('');
      });
  }

  toggle(id: number) {
    this.openId.update((current) => (current === id ? null : id));
  }

  cheapest(book: BookWithOffers): number {
    return Math.min(...book.offers.map((o) => o.priceCents));
  }
}
