import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'Inicio - Preguntas de Entrevista'
  },
  {
    path: 'ai-questions',
    loadComponent: () => import('./features/ai-questions/ai-questions.component').then(m => m.AiQuestionsComponent),
    title: 'Generar Preguntas IA - Preguntas de Entrevista'
  },
  {
    path: 'contribuir',
    loadComponent: () => import('./features/contribute/contribute.component').then(m => m.ContributeComponent),
    title: 'Contribuir - Preguntas de Entrevista'
  },
  {
    path: ':technology',
    loadComponent: () => import('./features/technology/technology.component').then(m => m.TechnologyComponent),
  },
  {
    path: ':technology/:slug',
    loadComponent: () => import('./features/question/question.component').then(m => m.QuestionComponent),
  },
  {
    path: '**',
    redirectTo: ''
  }
];
