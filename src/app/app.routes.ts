import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
    title: 'Inicio - Preguntas de Entrevista',
  },
  {
    path: 'privacidad',
    loadComponent: () =>
      import('./features/site-page/site-page.component').then((m) => m.SitePageComponent),
    data: { page: 'privacy' },
  },
  {
    path: 'cookies',
    loadComponent: () =>
      import('./features/site-page/site-page.component').then((m) => m.SitePageComponent),
    data: { page: 'cookies' },
  },
  {
    path: 'sobre-nosotros',
    loadComponent: () =>
      import('./features/site-page/site-page.component').then((m) => m.SitePageComponent),
    data: { page: 'about' },
  },
  {
    path: 'contacto',
    loadComponent: () =>
      import('./features/site-page/site-page.component').then((m) => m.SitePageComponent),
    data: { page: 'contact' },
  },
  {
    path: 'ai-questions',
    loadComponent: () =>
      import('./features/ai-questions/ai-questions.component').then((m) => m.AiQuestionsComponent),
    title: 'Generar Preguntas IA - Preguntas de Entrevista',
  },
  {
    path: 'cuestionarios',
    loadComponent: () =>
      import('./features/cuestionarios/cuestionarios.component').then(
        (m) => m.CuestionariosComponent,
      ),
    title: 'Cuestionarios - Preguntas de Entrevista',
  },
  {
    path: 'contribuir',
    loadComponent: () =>
      import('./features/contribute/contribute.component').then((m) => m.ContributeComponent),
    title: 'Contribuir - Preguntas de Entrevista',
  },
  {
    path: 'guia/:technology',
    loadComponent: () =>
      import('./features/technology/technology-guide.component').then(
        (m) => m.TechnologyGuideComponent,
      ),
  },
  {
    path: ':technology/tema/:tag',
    loadComponent: () =>
      import('./features/technology/technology-topic.component').then(
        (m) => m.TechnologyTopicComponent,
      ),
  },
  {
    path: ':technology/nivel/:level',
    loadComponent: () =>
      import('./features/technology/technology-level.component').then(
        (m) => m.TechnologyLevelComponent,
      ),
  },
  {
    path: ':technology/preguntas',
    loadComponent: () =>
      import('./features/technology/technology-questions.component').then(
        (m) => m.TechnologyQuestionsComponent,
      ),
  },
  {
    path: ':technology/recursos',
    loadComponent: () =>
      import('./features/technology/technology-resources.component').then(
        (m) => m.TechnologyResourcesComponent,
      ),
  },
  {
    path: ':technology',
    loadComponent: () =>
      import('./features/technology/technology.component').then((m) => m.TechnologyComponent),
  },
  {
    path: ':technology/:slug',
    loadComponent: () =>
      import('./features/question/question.component').then((m) => m.QuestionComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
