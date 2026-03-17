import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MfIconComponent, MfTooltipComponent } from 'ng-comps';
import { ContentStore } from '../../../core/stores/content.store';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, MfIconComponent, MfTooltipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="navbar" role="navigation" aria-label="Navegación principal">
      <a routerLink="/" class="brand" aria-label="Ir al inicio">
        <span class="brand-name">Preguntas Entrevista</span>
      </a>
      <div class="nav-actions">
        <mf-tooltip text="Generar preguntas con IA">
          <a
            routerLink="/ai-questions"
            class="ai-link"
            aria-label="Generar preguntas con IA"
          >
            <mf-icon name="auto_awesome" size="sm" color="inherit" />
            <span class="ai-link-text">Preguntas IA</span>
          </a>
        </mf-tooltip>
        <mf-tooltip text="Cuestionarios tipo test">
          <a
            routerLink="/cuestionarios"
            class="ai-link"
            aria-label="Cuestionarios tipo test"
          >
            <mf-icon name="quiz" size="sm" color="inherit" />
            <span class="ai-link-text">Cuestionarios</span>
          </a>
        </mf-tooltip>
        <mf-tooltip [text]="store.darkMode() ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'">
          <button
            class="icon-btn"
            (click)="store.toggleDarkMode()"
            aria-label="Cambiar tema"
          >
            <mf-icon [name]="store.darkMode() ? 'light_mode' : 'dark_mode'" color="inherit" />
          </button>
        </mf-tooltip>
        <mf-tooltip text="Ver en GitHub">
          <a
            class="icon-btn"
            href="https://github.com/ManuFerrer094/preguntas-entrevista"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ver en GitHub"
          >
            <mf-icon name="code" color="inherit" />
          </a>
        </mf-tooltip>
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
    .brand-icon mf-icon { font-size: 20px; width: 20px; height: 20px; }
    .nav-actions { display: flex; align-items: center; gap: 4px; }
    .ai-link {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 8px;
      text-decoration: none;
      color: var(--app-primary);
      font-size: 0.85rem;
      font-weight: 600;
      transition: background 0.15s;
      margin-right: 4px;
    }
    .ai-link:hover {
      background: color-mix(in srgb, var(--app-primary) 8%, transparent);
    }
    .ai-link mf-icon { font-size: 18px; width: 18px; height: 18px; }
    .icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: transparent;
      color: var(--app-text);
      cursor: pointer;
      text-decoration: none;
      transition: background 0.15s;
    }
    .icon-btn:hover {
      background: color-mix(in srgb, var(--app-text) 8%, transparent);
    }
    @media (max-width: 600px) {
      .brand-name { display: none; }
      .navbar { padding: 0 12px; }
      .ai-link-text { display: none; }
      .ai-link { padding: 6px; margin-right: 0; }
    }
  `]
})
export class NavbarComponent {
  readonly store = inject(ContentStore);
}
