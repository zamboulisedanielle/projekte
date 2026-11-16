import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { Api, errorMessage } from '../core/api';
import { AuthStore } from '../core/auth';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatButtonToggleModule, RouterLink],
  template: `
    <section class="auth panel">
      <h1>Konto erstellen</h1>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-button-toggle-group formControlName="role" class="roles" aria-label="Kontotyp">
          <mat-button-toggle value="CUSTOMER">Ich möchte Bücher kaufen</mat-button-toggle>
          <mat-button-toggle value="MERCHANT">Ich möchte Bücher verkaufen</mat-button-toggle>
        </mat-button-toggle-group>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" autocomplete="name" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>E-Mail</mat-label>
          <input matInput type="email" formControlName="email" autocomplete="email" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Passwort</mat-label>
          <input matInput type="password" formControlName="password" autocomplete="new-password" />
          <mat-hint>Mindestens 6 Zeichen</mat-hint>
        </mat-form-field>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        <button mat-flat-button class="full" [disabled]="form.invalid || busy()">Konto erstellen</button>
      </form>
      <p class="muted">Schon registriert? <a routerLink="/anmelden">Anmelden</a></p>
    </section>
  `,
  styles: `
    .auth { max-width: 460px; margin: 24px auto; padding: 32px; }
    h1 { margin-bottom: 20px; }
    .roles { width: 100%; margin-bottom: 20px; }
    .roles mat-button-toggle { flex: 1; }
    .error { color: #b3261e; margin: 0 0 12px; }
    mat-form-field { margin-bottom: 4px; }
  `,
})
export class RegisterPage {
  private api = inject(Api);
  private auth = inject(AuthStore);
  private router = inject(Router);

  form = inject(FormBuilder).nonNullable.group({
    role: ['CUSTOMER' as 'CUSTOMER' | 'MERCHANT', Validators.required],
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });
  busy = signal(false);
  error = signal('');

  submit() {
    this.busy.set(true);
    this.error.set('');
    this.api.register(this.form.getRawValue()).subscribe({
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
