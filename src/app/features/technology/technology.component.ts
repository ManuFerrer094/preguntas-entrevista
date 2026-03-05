import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ContentStore } from '../../core/stores/content.store';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-technology',
  standalone: true,
  imports: [RouterLink, CommonModule, MatListModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatInputModule, MatFormFieldModule],
  template: `
    @if (technology()) {
      <nav aria-label="Ruta de navegación">
        <a routerLink="/">Inicio</a>
        <span aria-hidden="true"> / </span>
        <span>{{ technology()!.name }}</span>
      </nav>

      <header class="tech-header">
        <mat-icon class="tech-icon" [style.color]="technology()!.color">{{ technology()!.icon }}</mat-icon>
        <div>
          <h1>{{ technology()!.name }}</h1>
          <p>{{ technology()!.description }}</p>
        </div>
      </header>

      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Buscar pregunta...</mat-label>
        <input matInput [value]="searchQuery()" (input)="searchQuery.set($any($event.target).value)" placeholder="ej. ¿Qué es Change Detection?" aria-label="Buscar preguntas"/>
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      @if (store.loading()) {
        <div class="loading-container">
          <mat-spinner diameter="40" aria-label="Cargando preguntas..."></mat-spinner>
        </div>
      } @else {
        <mat-list role="list" aria-label="Lista de preguntas">
          @for (question of filteredQuestions(); track question.id) {
            <a
              mat-list-item
              [routerLink]="['/', technology()!.slug, question.slug]"
              class="question-item"
              role="listitem"
              [attr.aria-label]="question.title"
            >
              <mat-icon matListItemIcon color="primary">help_outline</mat-icon>
              <span matListItemTitle>{{ question.title }}</span>
              <mat-icon matListItemMeta>chevron_right</mat-icon>
            </a>
          } @empty {
            <p class="empty-message">No se encontraron preguntas.</p>
          }
        </mat-list>
      }
    } @else {
      <p>Tecnología no encontrada.</p>
      <a mat-button routerLink="/">Volver al inicio</a>
    }
  `,
  styles: [`
    nav {
      margin-bottom: 24px;
      font-size: 0.875rem;
    }
    nav a {
      color: var(--mat-sys-primary);
      text-decoration: none;
    }
    nav a:hover { text-decoration: underline; }
    .tech-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;
    }
    .tech-icon { font-size: 3rem; width: 3rem; height: 3rem; }
    .tech-header h1 { margin: 0 0 4px; }
    .tech-header p { margin: 0; }
    .search-field { width: 100%; margin-bottom: 16px; }
    .question-item {
      text-decoration: none;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }
    .question-item:hover { background: var(--mat-sys-surface-variant); }
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px;
    }
    .empty-message {
      text-align: center;
      padding: 48px;
    }
  `]
})
export class TechnologyComponent implements OnInit {
  private route = inject(ActivatedRoute);
  store = inject(ContentStore);
  private seo = inject(SeoService);

  searchQuery = signal('');

  technology = computed(() => {
    const slug = this.route.snapshot.paramMap.get('technology') ?? '';
    return this.store.technologies().find(t => t.slug === slug) ?? null;
  });

  filteredQuestions = computed(() => {
    const tech = this.technology();
    if (!tech) return [];
    const questions = this.store.getQuestionsByTechnology(tech.slug);
    const query = this.searchQuery().toLowerCase();
    if (!query) return questions;
    return questions.filter(q => q.title.toLowerCase().includes(query));
  });

  ngOnInit(): void {
    const tech = this.technology();
    if (tech) {
      this.store.loadQuestionsForTechnology(tech.slug);
      this.seo.setPageMeta({
        title: tech.name,
        description: `Preguntas de entrevista para ${tech.name}. ${tech.description}`,
        keywords: `${tech.name.toLowerCase()}, entrevistas, preguntas técnicas`
      });
    }
  }
}
