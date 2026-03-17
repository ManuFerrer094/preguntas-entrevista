import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MfSnackbarService, MfButtonComponent, MfCardComponent } from 'ng-comps';

@Component({
  selector: 'app-actions-card',
  standalone: true,
  imports: [MfButtonComponent, MfCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mf-card variant="outlined" padding="sm">
      <mf-button
        label="Copiar enlace"
        variant="text"
        leadingIcon="link"
        (mfClick)="copyLink()"
        (click)="copyLink()"
      ></mf-button>
    </mf-card>
  `,
  styles: [`
    mf-card { display: block; }
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
