import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '../seo/site.config';
import { SchemaNode } from '../seo/structured-data';

interface PageMetaOptions {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  robots?: string;
  ogImage?: string;
  type?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
  publishedTime?: string;
  modifiedTime?: string;
  schema?: SchemaNode | SchemaNode[];
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  setPageMeta(options: PageMetaOptions): void {
    const fullTitle = `${options.title} | ${SITE_NAME}`;
    const canonical = options.canonical ?? this.resolveCanonicalUrl();
    const robots = options.robots ?? 'index,follow';
    const ogImage = options.ogImage ?? DEFAULT_OG_IMAGE;
    const type = options.type ?? 'website';
    const twitterCard = options.twitterCard ?? 'summary_large_image';

    this.title.setTitle(fullTitle);
    this.meta.updateTag({ name: 'description', content: options.description });
    this.meta.updateTag({ name: 'robots', content: robots });

    if (options.keywords) {
      this.meta.updateTag({ name: 'keywords', content: options.keywords });
    } else {
      this.meta.removeTag("name='keywords'");
    }

    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: options.description });
    this.meta.updateTag({ property: 'og:type', content: type });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    this.meta.updateTag({ property: 'og:image', content: ogImage });
    this.meta.updateTag({ name: 'twitter:card', content: twitterCard });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: options.description });
    this.meta.updateTag({ name: 'twitter:image', content: ogImage });

    this.syncArticleTag('article:published_time', options.publishedTime);
    this.syncArticleTag('article:modified_time', options.modifiedTime);
    this.updateCanonicalUrl(canonical);
    this.updateSchema(options.schema);
  }

  absoluteUrl(path: string): string {
    if (/^https?:\/\//.test(path)) return path;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${SITE_URL}${normalizedPath}`;
  }

  private resolveCanonicalUrl(): string {
    return this.absoluteUrl(this.router.url || '/');
  }

  private syncArticleTag(property: string, value?: string): void {
    if (value) {
      this.meta.updateTag({ property, content: value });
      return;
    }

    this.meta.removeTag(`property='${property}'`);
  }

  private updateCanonicalUrl(url: string): void {
    let link = this.document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }

    link.setAttribute('href', url);
  }

  private updateSchema(schema?: SchemaNode | SchemaNode[]): void {
    this.document.querySelectorAll('script[data-seo-schema]').forEach((node) => node.remove());
    if (!schema) return;

    const nodes = Array.isArray(schema) ? schema : [schema];
    for (const node of nodes) {
      const script = this.document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-schema', 'true');
      script.text = JSON.stringify(node);
      this.document.head.appendChild(script);
    }
  }
}
