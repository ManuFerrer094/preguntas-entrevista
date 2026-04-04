import { Router } from 'express';
import {
  getGuideTechnologies,
  getLevelRouteParams,
  getQuestionRouteParams,
  getTechnologyInventory,
  getTopicRouteParams,
} from '../app/core/seo/content-inventory.server';
import { SITE_URL } from '../app/core/seo/site.config';

interface SitemapEntry {
  loc: string;
  lastmod?: string;
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function absolute(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function renderUrlSet(entries: SitemapEntry[]): string {
  const urls = entries
    .map(
      (entry) => `<url><loc>${xmlEscape(entry.loc)}</loc>${
        entry.lastmod ? `<lastmod>${xmlEscape(entry.lastmod)}</lastmod>` : ''
      }</url>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

function renderSitemapIndex(paths: string[]): string {
  const body = paths
    .map((path) => `<sitemap><loc>${xmlEscape(absolute(path))}</loc></sitemap>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}

export function createSeoRouter(): Router {
  const router = Router();

  router.get('/robots.txt', (_req, res) => {
    const robots = [
      'User-agent: *',
      'Allow: /',
      'Disallow: /ai-questions',
      'Disallow: /contribuir',
      'Disallow: /cuestionarios',
      'Disallow: /*/recursos',
      `Sitemap: ${absolute('/sitemap.xml')}`,
    ].join('\n');

    res.type('text/plain').send(robots);
  });

  router.get('/sitemap.xml', (_req, res) => {
    res
      .type('application/xml')
      .send(
        renderSitemapIndex([
          '/sitemaps/core.xml',
          '/sitemaps/technologies.xml',
          '/sitemaps/questions.xml',
          '/sitemaps/guides.xml',
          '/sitemaps/topics.xml',
          '/sitemaps/levels.xml',
        ]),
      );
  });

  router.get('/sitemaps/core.xml', (_req, res) => {
    res.type('application/xml').send(
      renderUrlSet([
        { loc: absolute('/') },
        { loc: absolute('/privacidad') },
        { loc: absolute('/cookies') },
        { loc: absolute('/sobre-nosotros') },
        { loc: absolute('/contacto') },
      ]),
    );
  });

  router.get('/sitemaps/technologies.xml', (_req, res) => {
    const records = getTechnologyInventory().filter((record) => record.questionCount > 0);
    const entries = records.flatMap((record) => [
      { loc: absolute(`/${record.technology}`) },
      { loc: absolute(`/${record.technology}/preguntas`) },
    ]);

    res.type('application/xml').send(renderUrlSet(entries));
  });

  router.get('/sitemaps/questions.xml', (_req, res) => {
    const inventory = new Map(
      getTechnologyInventory().map((record) => [record.technology, record.questions] as const),
    );
    const entries = getQuestionRouteParams().map(({ technology, slug }) => {
      const question = inventory.get(technology)?.find((entry) => entry.slug === slug);
      return {
        loc: absolute(`/${technology}/${slug}`),
        lastmod: question?.lastmod,
      };
    });

    res.type('application/xml').send(renderUrlSet(entries));
  });

  router.get('/sitemaps/guides.xml', (_req, res) => {
    const entries = getGuideTechnologies().map((technology) => ({
      loc: absolute(`/guia/${technology}`),
    }));
    res.type('application/xml').send(renderUrlSet(entries));
  });

  router.get('/sitemaps/topics.xml', (_req, res) => {
    const entries = getTopicRouteParams().map(({ technology, tag }) => ({
      loc: absolute(`/${technology}/tema/${tag}`),
    }));
    res.type('application/xml').send(renderUrlSet(entries));
  });

  router.get('/sitemaps/levels.xml', (_req, res) => {
    const entries = getLevelRouteParams().map(({ technology, level }) => ({
      loc: absolute(`/${technology}/nivel/${level}`),
    }));
    res.type('application/xml').send(renderUrlSet(entries));
  });

  return router;
}
