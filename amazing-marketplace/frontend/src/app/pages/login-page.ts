import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { Api, errorMessage } from '../core/api';
import { AuthStore } from '../core/auth';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, RouterLink],
  template: `
    <section class="auth panel">
      <h1>Anmelden</h1>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" class="full">
          <mat-label>E-Mail</mat-label>
          <input matInput type="email" formControlName="email" autocomplete="email" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Passwort</mat-label>
          <input matInput type="password" formControlName="password" autocomplete="current-password" />
        </mat-form-field>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        <button mat-flat-button class="full" [disabled]="form.invalid || busy()">Anmelden</button>
      </form>
      <p class="muted">Noch kein Konto? <a routerLink="/registrieren">Jetzt registrieren</a></p>

      <details class="demo">
        <summary>Demo-Zugänge</summary>
        <ul>
          <li><button type="button" (click)="fill('kunde1@amazing.de', 'test123')">kunde1@amazing.de</button> Kunde</li>
          <li><button type="button" (click)="fill('haendler1@amazing.de', 'test123')">haendler1@amazing.de</button> Händler</li>
          <li><button type="button" (click)="fill('admin@amazing.de', 'admin123')">admin@amazing.de</button> Administrator</li>
        </ul>
      </details>
    </section>
  `,
  styles: `
    .auth { max-width: 420px; margin: 24px auto; padding: 32px; }
    h1 { margin-bottom: 20px; }
    .error { color: #b3261e; margin: 0 0 12px; }
    .demo { margin-top: 20px; font-size: 0.9rem; color: var(--amz-muted); }
    .demo ul { padding-left: 18px; }
    .demo button { all: unset; cursor: pointer; color: var(--amz-cloth); text-decoration: underline; margin-right: 6px; }
  `,
})
export class LoginPage {
  private api = inject(Api);
  private auth = inject(AuthStore);
  private router = inject(Router);

  form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  busy = signal(false);
  error = signal('');

  fill(email: string, password: string) {
    this.form.setValue({ email, password });
  }

  submit() {
    this.busy.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.api.login(email, password).subscribe({
      next: (session) => {
        this.auth.set(session);
        this.router.navigateByUrl(this.auth.homeFor(session.user.role));
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.busy.set(false);
      },
    });
  }
}
