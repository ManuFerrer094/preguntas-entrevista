import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContentStore } from '../../../core/stores/content.store';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, MatToolbarModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <nav class="navbar" role="navigation" aria-label="Navegación principal">
      <a routerLink="/" class="brand" aria-label="Ir al inicio">
        <span class="brand-name">Preguntas Entrevista</span>
      </a>
      <div class="nav-actions">
        <button
          mat-icon-button
          (click)="store.toggleDarkMode()"
          [matTooltip]="store.darkMode() ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
          aria-label="Cambiar tema"
        >
          <mat-icon>{{ store.darkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
        </button>
        <a
          mat-icon-button
          href="https://github.com/ManuFerrer094/preguntas-entrevista"
          target="_blank"
          rel="noopener noreferrer"
          matTooltip="Ver en GitHub"
          aria-label="Ver en GitHub"
        >
          <mat-icon>code</mat-icon>
        </a>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      height: 64px;
      background: var(--app-surface);
      border-bottom: 1px solid var(--app-border);
      backdrop-filter: blur(12px);
      color: var(--app-text);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: inherit;
      font-weight: 700;
      font-size: 1.15rem;
    }
    .brand-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #1565c0, #1976d2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .brand-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .nav-actions { display: flex; align-items: center; gap: 4px; }
    @media (max-width: 600px) {
      .brand-name { display: none; }
      .navbar { padding: 0 12px; }
    }
  `]
})
export class NavbarComponent {
  store = inject(ContentStore);
}
