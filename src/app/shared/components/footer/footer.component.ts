import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-left">
          <p class="footer-credit">
            Proyecto y
            <a class="footer-link" href="https://ng-comps-sb.vercel.app/" target="_blank" rel="noopener"
              >librería de componentes</a
            >
            creados por:
            <a class="footer-link" href="https://manuelferrer.vercel.app/" target="_blank" rel="noopener"
              >Manuel Ferrer</a
            >
          </p>
        </div>

        <nav class="footer-nav" aria-label="Páginas de confianza">
          <a routerLink="/sobre-nosotros" class="footer-link">Sobre nosotros</a>
          <a routerLink="/privacidad" class="footer-link">Privacidad</a>
          <a routerLink="/cookies" class="footer-link">Cookies</a>
          <a routerLink="/contacto" class="footer-link">Contacto</a>
        </nav>
      </div>
    </footer>
  `,
  styles: [
    `
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
      .footer-credit {
        margin: 0;
        font-weight: 300;
        color: var(--app-text);
      }
      .footer-nav {
        display: flex;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
      }
      .footer-link {
        color: var(--app-primary);
        text-decoration: none;
        font-weight: 600;
      }
      .footer-link:hover {
        text-decoration: underline;
      }
      @media (max-width: 720px) {
        .footer-inner {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }
      }
    `,
  ],
})
export class FooterComponent {}
