import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { Api } from '../../core/api';
import { AuthStore } from '../../core/auth';
import { EuroPipe } from '../../shared/euro.pipe';

@Component({
  selector: 'app-merchant-dashboard-page',
  imports: [DatePipe, EuroPipe, RouterLink, MatButtonToggleModule],
  template: `
    <header class="page-head">
      <div>
        <h1>Hallo {{ auth.user()?.name }}</h1>
        <p>So laufen deine Shops.</p>
      </div>
      <mat-button-toggle-group [value]="days()" (change)="days.set($event.value)" aria-label="Zeitraum">
        <mat-button-toggle [value]="7">7 Tage</mat-button-toggle>
        <mat-button-toggle [value]="30">30 Tage</mat-button-toggle>
        <mat-button-toggle [value]="90">90 Tage</mat-button-toggle>
      </mat-button-toggle-group>
    </header>

    @if (stats(); as s) {
      <section class="totals">
        <div><span class="muted">Umsatz gesamt</span><strong>{{ s.totals.revenueCents | euro }}</strong></div>
        <div><span class="muted">Bestellungen</span><strong>{{ s.totals.orders }}</strong></div>
        <div>
          <span class="muted">Offen</span>
          <strong><a routerLink="/haendler/bestellungen">{{ s.totals.openOrders }}</a></strong>
        </div>
        <div><span class="muted">Verkaufte Bücher</span><strong>{{ s.totals.booksSold }}</strong></div>
      </section>

      <section class="panel">
        <h2>Umsatz pro Tag</h2>
        <p class="muted small">Letzte {{ days() }} Tage · höchster Tag {{ maxDay() | euro }}</p>
        <div class="chart" role="img" [attr.aria-label]="'Umsatz pro Tag der letzten ' + days() + ' Tage'">
          @for (d of s.revenuePerDay; track d.date) {
            <div class="col" [title]="(d.date | date: 'EEE, d. MMM') + ': ' + (d.revenueCents | euro)">
              <div class="bar" [style.height.%]="maxDay() ? (d.revenueCents / maxDay()) * 100 : 0"></div>
            </div>
          }
        </div>
        <div class="axis muted">
          <span>{{ s.revenuePerDay[0]?.date | date: 'd. MMM' }}</span>
          <span>heute</span>
        </div>
      </section>

      <section class="panel">
        <h2>Umsatz pro Buch</h2>
        <p class="muted small">Seit Beginn, sortiert nach Umsatz</p>
        <div class="table-wrap">
          <table class="books">
            <thead>
              <tr><th>Buch</th><th class="num">Verkauft</th><th class="num">Umsatz</th><th class="barcell"></th></tr>
            </thead>
            <tbody>
              @for (b of s.revenuePerBook; track b.bookId) {
                <tr>
                  <td><strong>{{ b.title }}</strong><br /><span class="muted">{{ b.author }}</span></td>
                  <td class="num">{{ b.quantity }}</td>
                  <td class="num price">{{ b.revenueCents | euro }}</td>
                  <td class="barcell"><span class="hbar" [style.width.%]="(b.revenueCents / maxBook()) * 100"></span></td>
                </tr>
              } @empty {
                <tr><td colspan="4" class="muted">Noch keine Verkäufe.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    }
  `,
  styles: `
    .totals { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 1px; background: var(--amz-line); border: 1px solid var(--amz-line); border-radius: 10px; overflow: hidden; margin-bottom: 20px; }
    .totals div { background: #fff; padding: 16px 20px; display: flex; flex-direction: column; }
    .totals strong { font-family: 'Literata', Georgia, serif; font-size: 1.6rem; font-variant-numeric: tabular-nums; }
    .totals a { text-decoration: none; color: var(--amz-open); }
    .panel { margin-bottom: 20px; }
    .small { font-size: 0.85rem; margin-top: 0; }
    .chart { display: flex; align-items: flex-end; gap: 3px; height: 200px; padding-top: 8px; border-bottom: 1px solid var(--amz-line); }
    .col { flex: 1; height: 100%; display: flex; align-items: flex-end; }
    .bar { width: 100%; background: var(--amz-cloth); border-radius: 2px 2px 0 0; min-height: 1px; }
    .col:hover .bar { background: var(--amz-gilt); }
    .axis { display: flex; justify-content: space-between; font-size: 0.8rem; padding-top: 6px; }
    .books { width: 100%; border-collapse: collapse; }
    .books th { text-align: left; font-weight: 600; font-size: 0.85rem; color: var(--amz-muted); padding: 8px; border-bottom: 1px solid var(--amz-line); }
    .books td { padding: 10px 8px; border-bottom: 1px solid var(--amz-line); vertical-align: middle; }
    .books .muted { font-size: 0.85rem; }
    .barcell { width: 30%; }
    .hbar { display: block; height: 10px; background: var(--amz-gilt); border-radius: 0 3px 3px 0; }
  `,
})
export class MerchantDashboardPage {
  private api = inject(Api);
  protected auth = inject(AuthStore);
  days = signal(30);
  stats = toSignal(toObservable(this.days).pipe(switchMap((d) => this.api.merchantStats(d))));
  maxDay = computed(() => Math.max(0, ...(this.stats()?.revenuePerDay.map((d) => d.revenueCents) ?? [])));
  maxBook = computed(() => Math.max(1, ...(this.stats()?.revenuePerBook.map((b) => b.revenueCents) ?? [])));
}
