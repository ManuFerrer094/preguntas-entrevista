import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'Inicio - Preguntas de Entrevista'
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
