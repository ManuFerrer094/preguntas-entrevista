import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-left">
          <p class="footer-credit">Proyecto y <a class="footer-link" href="https://ng-comps-sb.vercel.app/" target="_blank" rel="noopener">librería de componentes</a> creados por: <a class="footer-link" href="https://manuelferrer.vercel.app/" target="_blank" rel="noopener">Manuel Ferrer</a></p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .site-footer {
      background: var(--app-surface);
      border-top: 1px solid var(--app-border);
      color: var(--app-text-muted);
      padding: 20px 0;
      margin-top: 48px;
    }
    .footer-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .footer-left { display: flex; flex-direction: column; gap: 2px; }
    .footer-credit { margin: 0; font-weight: 300; color: var(--app-text); }
    .footer-note { margin: 0; font-size: 0.92rem; color: var(--app-text-muted); }
    .footer-link { color: var(--app-primary); text-decoration: none; font-weight: 600; }
    .footer-link:hover { text-decoration: underline; }

    @media (max-width: 720px) {
      .footer-inner { flex-direction: column; align-items: flex-start; gap: 8px; }
      .footer-right { display: flex; gap: 12px; }
    }
  `]
})
export class FooterComponent {}
