import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { Api } from '../../core/api';
import { EuroPipe } from '../../shared/euro.pipe';

@Component({
  selector: 'app-admin-page',
  imports: [DatePipe, MatTabsModule, MatExpansionModule, EuroPipe],
  template: `
    <header class="page-head">
      <div>
        <h1>Marktplatz-Übersicht</h1>
        <p>Alle Händler, Kunden und Bestellungen auf Amazing.</p>
      </div>
    </header>

    @if (overview(); as o) {
      <section class="totals">
        <div><span class="muted">Händler</span><strong>{{ o.merchants }}</strong></div>
        <div><span class="muted">Shops</span><strong>{{ o.shops }}</strong></div>
        <div><span class="muted">Kunden</span><strong>{{ o.customers }}</strong></div>
        <div><span class="muted">Bestellungen</span><strong>{{ o.orders }}</strong></div>
        <div><span class="muted">Umsatz gesamt</span><strong>{{ o.revenueCents | euro }}</strong></div>
      </section>
    }

    <mat-tab-group animationDuration="0ms" [selectedIndex]="tab()" (selectedIndexChange)="tab.set($event)">
      <mat-tab label="Händler">
        <div class="panel tabbody table-wrap">
          <table class="data">
            <thead>
              <tr><th>Händler</th><th>Shops</th><th class="num">Bestellungen</th><th class="num">Offen</th><th class="num">Umsatz</th><th>Seit</th></tr>
            </thead>
            <tbody>
              @for (m of merchants(); track m.id) {
                <tr>
                  <td><strong>{{ m.name }}</strong><br /><span class="muted">{{ m.email }}</span></td>
                  <td>
                    @for (s of m.shops; track s.id) {
                      <div>{{ s.name }} <span class="muted">· {{ s.city }} · {{ s.offers }} Bücher</span></div>
                    } @empty {
                      <span class="muted">kein Shop</span>
                    }
                  </td>
                  <td class="num">{{ m.orders }}</td>
                  <td class="num">{{ m.openOrders }}</td>
                  <td class="num price">{{ m.revenueCents | euro }}</td>
                  <td>{{ m.createdAt | date: 'dd.MM.yyyy' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </mat-tab>

      <mat-tab label="Kunden und Bestellungen">
        <div class="tabbody">
          <mat-accordion multi>
            @for (c of customers(); track c.id) {
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>{{ c.name }}</mat-panel-title>
                  <mat-panel-description>
                    {{ c.email }} · {{ c.orders.length }} Bestellungen · {{ c.totalSpentCents | euro }}
                  </mat-panel-description>
                </mat-expansion-panel-header>
                <div class="table-wrap">
                  <table class="data">
                    <thead>
                      <tr><th>Bestellnummer</th><th>Datum</th><th>Shop</th><th>Bücher</th><th>Status</th><th class="num">Summe</th></tr>
                    </thead>
                    <tbody>
                      @for (o of c.orders; track o.id) {
                        <tr>
                          <td class="mono">{{ o.orderNumber }}</td>
                          <td>{{ o.createdAt | date: 'dd.MM.yyyy' }}</td>
                          <td>{{ o.shop.name }}</td>
                          <td>
                            @for (i of o.items; track $index) {
                              <div>{{ i.quantity }} × {{ i.bookTitle }}</div>
                            }
                          </td>
                          <td><span class="status" [class]="o.status">{{ o.status === 'OPEN' ? 'Offen' : 'Bearbeitet' }}</span></td>
                          <td class="num price">{{ o.totalCents | euro }}</td>
                        </tr>
                      } @empty {
                        <tr><td colspan="6" class="muted">Noch keine Bestellungen.</td></tr>
                      }
                    </tbody>
                  </table>
                </div>
              </mat-expansion-panel>
            }
          </mat-accordion>
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: `
    .totals { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1px; background: var(--amz-line); border: 1px solid var(--amz-line); border-radius: 10px; overflow: hidden; margin-bottom: 24px; }
    .totals div { background: #fff; padding: 16px 20px; display: flex; flex-direction: column; }
    .totals strong { font-family: 'Literata', Georgia, serif; font-size: 1.5rem; font-variant-numeric: tabular-nums; }
    .tabbody { margin-top: 16px; }
    .data { width: 100%; border-collapse: collapse; }
    .data th { text-align: left; font-size: 0.85rem; color: var(--amz-muted); font-weight: 600; padding: 8px; border-bottom: 1px solid var(--amz-line); }
    .data td { padding: 10px 8px; border-bottom: 1px solid var(--amz-line); vertical-align: top; font-size: 0.95rem; }
    .data .muted { font-size: 0.85rem; }
    .mono { font-variant-numeric: tabular-nums; white-space: nowrap; }
  `,
})
export class AdminPage {
  private api = inject(Api);
  tab = signal(0);
  overview = toSignal(this.api.adminOverview());
  merchants = toSignal(this.api.adminMerchants(), { initialValue: [] });
  customers = toSignal(this.api.adminCustomers(), { initialValue: [] });
}
