import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from './site.config';

export type SchemaNode = Record<string, unknown>;

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]): SchemaNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildWebsiteSchema(): SchemaNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: 'es',
    url: SITE_URL,
  };
}

export function buildCollectionPageSchema(options: {
  name: string;
  description: string;
  url: string;
}): SchemaNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: options.name,
    description: options.description,
    url: options.url,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function buildWebPageSchema(options: {
  name: string;
  description: string;
  url: string;
}): SchemaNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: options.name,
    description: options.description,
    url: options.url,
    inLanguage: 'es',
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function buildArticleSchema(options: {
  headline: string;
  description: string;
  url: string;
  keywords: string[];
  authorName?: string;
  authorUrl?: string;
  dateModified?: string;
}): SchemaNode {
  const author =
    options.authorName
      ? {
          '@type': 'Person',
          name: options.authorName,
          url: options.authorUrl,
        }
      : {
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL,
        };

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: options.headline,
    description: options.description,
    mainEntityOfPage: options.url,
    inLanguage: 'es',
    url: options.url,
    author,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    keywords: options.keywords.join(', '),
    dateModified: options.dateModified,
  };
}
