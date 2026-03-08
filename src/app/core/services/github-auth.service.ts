import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

export interface GitHubUser {
  token: string;
  username: string;
  name: string;
  avatarUrl: string;
}

@Injectable({ providedIn: 'root' })
export class GitHubAuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly user = signal<GitHubUser | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly isAuthenticated = computed(() => !!this.user());

  login(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loading.set(true);
    this.http.get<{ clientId: string }>('/api/auth/github').subscribe({
      next: ({ clientId }) => {
        const redirectUri = window.location.origin + '/contribuir';
        window.location.href =
          `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=public_repo`;
      },
      error: () => {
        this.error.set('No se pudo iniciar la autenticación con GitHub.');
        this.loading.set(false);
      },
    });
  }

  exchangeCode(code: string): void {
    this.loading.set(true);
    this.error.set('');
    this.http.post<GitHubUser>('/api/auth/github', { code }).subscribe({
      next: (user) => {
        this.user.set(user);
        this.loading.set(false);
        this.router.navigate(['/contribuir'], { replaceUrl: true });
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error al autenticar con GitHub.');
        this.loading.set(false);
      },
    });
  }

  logout(): void {
    this.user.set(null);
  }
}
