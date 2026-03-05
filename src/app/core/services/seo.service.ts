import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private router = inject(Router);
  private document = inject(DOCUMENT);

  setPageMeta(options: {
    title: string;
    description: string;
    keywords?: string;
    canonical?: string;
  }): void {
    const fullTitle = `${options.title} | Preguntas Entrevista`;
    this.title.setTitle(fullTitle);
    this.meta.updateTag({ name: 'description', content: options.description });
    if (options.keywords) {
      this.meta.updateTag({ name: 'keywords', content: options.keywords });
    }
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: options.description });

    const canonical = options.canonical ?? `https://preguntas-entrevista.vercel.app${this.router.url}`;
    this.updateCanonicalUrl(canonical);
  }

  private updateCanonicalUrl(url: string): void {
    let link: HTMLLinkElement = this.document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
