import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ContentStore } from './core/stores/content.store';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent],
  template: `
    <div [class.dark-theme]="store.darkMode()">
      <app-navbar />
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
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
  `]
})
export class App {
  store = inject(ContentStore);
}
