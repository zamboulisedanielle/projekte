import { HttpInterceptorFn } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role, Session, User } from './models';

const STORAGE_KEY = 'amazing.session';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private session = signal<Session | null>(this.restore());

  readonly user = computed<User | null>(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly role = computed<Role | null>(() => this.user()?.role ?? null);
  readonly isCustomer = computed(() => this.role() === 'CUSTOMER');
  readonly isMerchant = computed(() => this.role() === 'MERCHANT');
  readonly isAdmin = computed(() => this.role() === 'ADMIN');

  set(session: Session) {
    this.session.set(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  clear() {
    this.session.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  /** Start page for each role after login. */
  homeFor(role: Role | null): string {
    if (role === 'MERCHANT') return '/haendler/dashboard';
    if (role === 'ADMIN') return '/admin';
    return '/';
  }

  private restore(): Session | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthStore).token();
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};

/** Route guard: only the given roles may open the page. */
export function roleGuard(...roles: Role[]): CanActivateFn {
  return () => {
    const auth = inject(AuthStore);
    const router = inject(Router);
    const role = auth.role();
    if (!role) return router.createUrlTree(['/anmelden']);
    if (roles.includes(role)) return true;
    return router.createUrlTree([auth.homeFor(role)]);
  };
}
