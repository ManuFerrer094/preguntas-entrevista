import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DossierService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  readonly generating = signal(false);

  async downloadDossier(technologies: string[]): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || technologies.length === 0) return;

    this.generating.set(true);

    try {
      const response = await firstValueFrom(
        this.http.post(
          '/api/dossier',
          { technologies },
          {
            observe: 'response',
            responseType: 'blob',
          },
        ),
      );

      const blob = response.body;
      if (!blob) {
        throw new Error('La respuesta del servidor no incluye el PDF');
      }

      const filename = this.resolveFilename(
        response.headers.get('content-disposition'),
        technologies,
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      this.generating.set(false);
    }
  }

  private resolveFilename(disposition: string | null, technologies: string[]): string {
    const match = disposition?.match(/filename="?([^"]+)"?/i);
    if (match?.[1]) {
      return match[1];
    }

    if (technologies.length === 1) {
      return `${technologies[0]}-dossier.pdf`;
    }

    return `dossier-${technologies.length}-tecnologias.pdf`;
  }
}
