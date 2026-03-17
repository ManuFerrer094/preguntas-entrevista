import { ChangeDetectionStrategy, Component, inject, effect, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ContentStore } from './core/stores/content.store';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-navbar />
    <main class="main-content">
      <router-outlet />
    </main>
    <app-footer />
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: var(--app-bg);
      color: var(--app-text);
    }
    .main-content {
      flex: 1 0 auto;
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px 16px;
      overflow-x: hidden;
    }
    @media (max-width: 600px) {
      .main-content { padding: 16px 12px; }
    }
  `]
})
export class App {
  private readonly store = inject(ContentStore);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

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
