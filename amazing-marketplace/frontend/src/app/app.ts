import { Component, effect, inject } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from './core/auth';
import { CartStore } from './core/cart-store';

const ROLE_LABEL = { CUSTOMER: 'Kunde', MERCHANT: 'Händler', ADMIN: 'Administrator' } as const;

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule, MatBadgeModule, MatMenuModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected auth = inject(AuthStore);
  protected cart = inject(CartStore);
  private router = inject(Router);
  protected roleLabel = ROLE_LABEL;

  constructor() {
    // Reload the cart whenever the logged-in user changes.
    effect(() => {
      this.auth.user();
      this.cart.refresh();
    });
  }

  logout() {
    this.auth.clear();
    this.router.navigateByUrl('/anmelden');
  }
}
