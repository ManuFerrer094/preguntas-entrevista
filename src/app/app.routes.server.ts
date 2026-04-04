import { RenderMode, ServerRoute } from '@angular/ssr';
import {
  getGuideTechnologies,
  getLevelRouteParams,
  getQuestionRouteParams,
  getTechnologiesWithContent,
  getTopicRouteParams,
} from './core/seo/content-inventory.server';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'privacidad',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'cookies',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'sobre-nosotros',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'contacto',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'contribuir',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'guia/:technology',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return getGuideTechnologies().map((technology) => ({ technology }));
    },
  },
  {
    path: ':technology/tema/:tag',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return getTopicRouteParams();
    },
  },
  {
    path: ':technology/nivel/:level',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return getLevelRouteParams();
    },
  },
  {
    path: ':technology/preguntas',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return getTechnologiesWithContent().map((technology) => ({ technology }));
    },
  },
  {
    path: ':technology/recursos',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return getTechnologiesWithContent().map((technology) => ({ technology }));
    },
  },
  {
    path: ':technology',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return getTechnologiesWithContent().map((technology) => ({ technology }));
    },
  },
  {
    path: ':technology/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return getQuestionRouteParams();
    },
  },
  {
    path: 'ai-questions',
    renderMode: RenderMode.Prerender,
  },
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
