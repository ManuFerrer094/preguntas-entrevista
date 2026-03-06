import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class DossierService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  readonly generating = signal(false);

  downloadDossier(technology: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.generating.set(true);
    this.http.get(`/api/dossier/${encodeURIComponent(technology)}`, { responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          this.generating.set(false);
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${technology}-dossier.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        },
        error: () => {
          this.generating.set(false);
        },
      });
  }
}
