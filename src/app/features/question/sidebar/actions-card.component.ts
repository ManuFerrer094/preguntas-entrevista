import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MfButtonComponent, MfSnackbarService } from 'ng-comps';

@Component({
  selector: 'app-actions-card',
  standalone: true,
  imports: [MfButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sidebar-card actions-card">
      <mf-button
        label="Copiar enlace"
        variant="text"
        leadingIcon="link"
        (mfClick)="copyLink()"
      />
    </div>
  `,
  styles: [`
    .sidebar-card {
      border: 1px solid var(--app-border);
      border-radius: 14px;
      padding: 12px 16px;
      background: var(--app-surface);
      color: var(--app-text);
    }
    .actions-card { display: flex; flex-direction: column; gap: 8px; }
  `]
})
export class ActionsCardComponent {
  private readonly snackbar = inject(MfSnackbarService);
  private readonly platformId = inject(PLATFORM_ID);

  copyLink(): void {
    if (isPlatformBrowser(this.platformId)) {
      navigator.clipboard.writeText(window.location.href).then(
        () => this.snackbar.success('¡Enlace copiado!', 'Cerrar'),
        () => this.snackbar.error('No se pudo copiar el enlace', 'Cerrar'),
      );
    }
  }
}
