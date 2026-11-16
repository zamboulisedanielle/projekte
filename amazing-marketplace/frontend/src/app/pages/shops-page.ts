import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api';

@Component({
  selector: 'app-shops-page',
  imports: [RouterLink],
  template: `
    <header class="page-head">
      <div>
        <h1>Shops</h1>
        <p>Unabhängige Buchhandlungen, die auf Amazing verkaufen.</p>
      </div>
    </header>
    <section class="shops">
      @for (shop of shops(); track shop.id) {
        <a class="shop" [routerLink]="['/shops', shop.id]">
          <h2>{{ shop.name }}</h2>
          <p>{{ shop.description }}</p>
          <span class="muted">{{ shop.city }} · {{ shop._count.offers }} Bücher · von {{ shop.owner.name }}</span>
        </a>
      } @empty {
        <p class="muted">Noch keine Shops vorhanden.</p>
      }
    </section>
  `,
  styles: `
    .shops { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .shop {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 20px 20px 18px;
      background: #fff;
      border: 1px solid var(--amz-line);
      border-left: 4px solid var(--amz-cloth);
      border-radius: 4px 10px 10px 4px;
      text-decoration: none;
      color: inherit;
    }
    .shop:hover { border-left-color: var(--amz-gilt); }
    .shop p { margin: 0; }
    .shop span { font-size: 0.85rem; margin-top: auto; }
  `,
})
export class ShopsPage {
  shops = toSignal(inject(Api).shops(), { initialValue: [] });
}
