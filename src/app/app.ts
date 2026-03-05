import { Component, inject, effect, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ContentStore } from './core/stores/content.store';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar />
    <main class="main-content">
      <router-outlet />
    </main>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
    .main-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px 16px;
    }
    @media (max-width: 600px) {
      .main-content { padding: 16px 12px; }
    }
  `]
})
export class App {
  store = inject(ContentStore);
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        if (this.store.darkMode()) {
          this.document.documentElement.classList.add('dark-theme');
        } else {
          this.document.documentElement.classList.remove('dark-theme');
        }
      }
    });
  }
}
