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
    <mat-toolbar color="primary" role="navigation" aria-label="Navegación principal">
      <a routerLink="/" class="brand" aria-label="Ir al inicio">
        <mat-icon>quiz</mat-icon>
        <span class="brand-name">Preguntas Entrevista</span>
      </a>
      <span class="spacer"></span>
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
        [matTooltip]="'Ver en GitHub'"
        aria-label="Ver en GitHub"
      >
        <mat-icon>code</mat-icon>
      </a>
    </mat-toolbar>
  `,
  styles: [`
    mat-toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      color: inherit;
      font-weight: 600;
    }
    .brand-name {
      font-size: 1.1rem;
    }
    .spacer {
      flex: 1;
    }
    @media (max-width: 600px) {
      .brand-name { display: none; }
    }
  `]
})
export class NavbarComponent {
  store = inject(ContentStore);
}
