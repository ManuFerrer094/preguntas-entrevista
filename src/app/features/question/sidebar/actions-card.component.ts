import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-actions-card',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sidebar-card actions-card">
      <button mat-button (click)="copyLink()" class="action-btn">
        <mat-icon>link</mat-icon>
        Copiar enlace
      </button>
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
    .action-btn { justify-content: flex-start; }
  `]
})
export class ActionsCardComponent {
  private readonly snackBar = inject(MatSnackBar);
  private readonly platformId = inject(PLATFORM_ID);

  copyLink(): void {
    if (isPlatformBrowser(this.platformId)) {
      navigator.clipboard.writeText(window.location.href).then(
        () => this.snackBar.open('¡Enlace copiado!', 'Cerrar', { duration: 2000 }),
        () => this.snackBar.open('No se pudo copiar el enlace', 'Cerrar', { duration: 2000 }),
      );
    }
  }
}
