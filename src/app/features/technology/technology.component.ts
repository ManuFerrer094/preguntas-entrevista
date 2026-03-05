import { Component, inject, computed, effect, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ContentStore } from '../../core/stores/content.store';
import { SeoService } from '../../core/services/seo.service';
import { ProgressService } from '../../core/services/progress.service';

@Component({
  selector: 'app-technology',
  standalone: true,
  imports: [RouterLink, CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    @if (technology()) {
      <nav class="breadcrumb" aria-label="Ruta de navegación">
        <a routerLink="/">Inicio</a>
        <span aria-hidden="true"> &rsaquo; </span>
        <span>{{ technology()!.name }}</span>
      </nav>

      <div class="tech-layout">
        <!-- Sidebar -->
        <aside class="sidebar">
          <div class="progress-card">
            <div class="progress-header">
              <span>Tu Progreso</span>
              <strong class="progress-pct">{{ progressPct() }}%</strong>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" [style.width.%]="progressPct()"></div>
            </div>
            <span class="progress-detail">
              {{ readCount() }} de {{ allQuestions().length }} completadas
            </span>
          </div>

          <nav class="sidebar-nav">
            <button
              class="sidebar-btn"
              [class.active]="filter() === 'all'"
              (click)="filter.set('all')"
            >
              <mat-icon>list</mat-icon>
              Todas
            </button>
            <button
              class="sidebar-btn"
              [class.active]="filter() === 'completed'"
              (click)="filter.set('completed')"
            >
              <mat-icon>check_circle</mat-icon>
              Completadas
            </button>
            <button
              class="sidebar-btn"
              [class.active]="filter() === 'pending'"
              (click)="filter.set('pending')"
            >
              <mat-icon>radio_button_unchecked</mat-icon>
              Pendientes
            </button>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-col">
          <header class="tech-header">
            <div class="tech-header-icon" [style.background]="technology()!.color + '15'">
              <i [class]="technology()!.devicon" [style.color]="technology()!.color"></i>
            </div>
            <div>
              <h1>{{ technology()!.name }}</h1>
              <p class="tech-desc">{{ technology()!.description }}</p>
            </div>
          </header>

          <div class="search-container">
            <mat-icon class="search-icon">search</mat-icon>
            <input
              type="text"
              class="search-input"
              placeholder="Buscar por palabra clave o tema..."
              [value]="searchQuery()"
              (input)="searchQuery.set($any($event.target).value)"
              aria-label="Buscar preguntas"
            />
          </div>

          @if (store.loading()) {
            <div class="loading-container">
              <mat-spinner diameter="40" aria-label="Cargando preguntas..."></mat-spinner>
            </div>
          } @else {
            <div class="questions-list" role="list" aria-label="Lista de preguntas">
              @for (question of filteredQuestions(); track question.id; let i = $index) {
                <a
                  [routerLink]="['/', technology()!.slug, question.slug]"
                  class="question-row"
                  [class.is-read]="progress.isRead(question.id)"
                  role="listitem"
                >
                  <div class="question-status">
                    @if (progress.isRead(question.id)) {
                      <mat-icon class="status-done">check_circle</mat-icon>
                    } @else {
                      <mat-icon class="status-pending">radio_button_unchecked</mat-icon>
                    }
                  </div>
                  <div class="question-info">
                    <span class="question-title">{{ question.title }}</span>
                    <span class="question-meta">
                      @if (progress.isRead(question.id)) {
                        <mat-icon class="meta-icon">visibility</mat-icon> Leída
                      } @else {
                        <mat-icon class="meta-icon">visibility_off</mat-icon> Sin leer
                      }
                    </span>
                  </div>
                  <mat-icon class="chevron">chevron_right</mat-icon>
                </a>
              } @empty {
                <div class="empty-message">
                  <mat-icon>search_off</mat-icon>
                  <p>No se encontraron preguntas.</p>
                </div>
              }
            </div>
          }
        </main>
      </div>
    } @else {
      <p>Tecnología no encontrada.</p>
      <a mat-button routerLink="/">Volver al inicio</a>
    }
  `,
  styles: [`
    .breadcrumb {
      margin-bottom: 24px;
      font-size: 0.85rem;
    }
    .breadcrumb a {
      color: var(--mat-sys-primary);
      text-decoration: none;
    }
    .breadcrumb a:hover { text-decoration: underline; }

    .tech-layout {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 32px;
      align-items: start;
    }

    /* Sidebar */
    .sidebar {
      position: sticky;
      top: 80px;
    }
    .progress-card {
      background: var(--mat-sys-surface, #fff);
      border: 1px solid var(--mat-sys-outline-variant, #e0e0e0);
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .progress-pct { color: var(--mat-sys-primary, #1976d2); }
    .progress-bar-track {
      height: 8px;
      border-radius: 4px;
      background: var(--mat-sys-surface-variant, #e3e3e3);
      overflow: hidden;
      margin-bottom: 8px;
    }
    .progress-bar-fill {
      height: 100%;
      border-radius: 4px;
      background: var(--mat-sys-primary, #1976d2);
      transition: width 0.4s ease;
    }
    .progress-detail { font-size: 0.78rem; opacity: 0.6; }

    .sidebar-nav { display: flex; flex-direction: column; gap: 4px; }
    .sidebar-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border: none;
      border-radius: 10px;
      background: transparent;
      cursor: pointer;
      font-size: 0.88rem;
      font-family: inherit;
      color: inherit;
      transition: background 0.15s;
    }
    .sidebar-btn:hover { background: var(--mat-sys-surface-variant, #f0f0f0); }
    .sidebar-btn.active {
      background: var(--mat-sys-primary, #1976d2);
      color: white;
      font-weight: 600;
    }

    /* Main content */
    .tech-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 28px;
    }
    .tech-header-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .tech-header-icon i { font-size: 30px; }
    .tech-header h1 { margin: 0 0 4px; font-size: 1.5rem; }
    .tech-desc { margin: 0; opacity: 0.7; font-size: 0.9rem; }

    .search-container {
      display: flex;
      align-items: center;
      background: var(--mat-sys-surface-variant, #f5f5f5);
      border-radius: 12px;
      padding: 0 16px;
      border: 1px solid var(--mat-sys-outline-variant, #e0e0e0);
      margin-bottom: 20px;
      transition: border-color 0.2s;
    }
    .search-container:focus-within {
      border-color: var(--mat-sys-primary, #1976d2);
    }
    .search-icon { color: var(--mat-sys-on-surface-variant, #666); margin-right: 12px; }
    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      padding: 14px 0;
      font-size: 0.9rem;
      outline: none;
      font-family: inherit;
      color: inherit;
    }

    /* Question rows */
    .questions-list { display: flex; flex-direction: column; gap: 8px; }
    .question-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 20px;
      background: var(--mat-sys-surface, #fff);
      border: 1px solid var(--mat-sys-outline-variant, #e0e0e0);
      border-radius: 12px;
      text-decoration: none;
      color: inherit;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .question-row:hover {
      border-color: var(--mat-sys-primary, #1976d2);
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .question-row.is-read { opacity: 0.75; }
    .status-done { color: #43a047; }
    .status-pending { color: #bdbdbd; }
    .question-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .question-title { font-weight: 600; font-size: 0.95rem; }
    .question-meta {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.78rem;
      opacity: 0.55;
    }
    .meta-icon { font-size: 14px; width: 14px; height: 14px; }
    .chevron { color: var(--mat-sys-on-surface-variant, #999); }

    .loading-container { display: flex; justify-content: center; padding: 48px; }
    .empty-message {
      text-align: center;
      padding: 48px;
      opacity: 0.5;
    }
    .empty-message mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }

    @media (max-width: 768px) {
      .tech-layout {
        grid-template-columns: 1fr;
      }
      .sidebar { position: static; }
    }
  `]
})
export class TechnologyComponent {
  private route = inject(ActivatedRoute);
  store = inject(ContentStore);
  private seo = inject(SeoService);
  progress = inject(ProgressService);

  searchQuery = signal('');
  filter = signal<'all' | 'completed' | 'pending'>('all');

  private routeParams = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });

  technology = computed(() => {
    const slug = this.routeParams().get('technology') ?? '';
    return this.store.technologies().find(t => t.slug === slug) ?? null;
  });

  allQuestions = computed(() => {
    const tech = this.technology();
    if (!tech) return [];
    return this.store.getQuestionsByTechnology(tech.slug);
  });

  readCount = computed(() => {
    const ids = this.allQuestions().map(q => q.id);
    return this.progress.getReadCountForTechnology(ids);
  });

  progressPct = computed(() => {
    const ids = this.allQuestions().map(q => q.id);
    return this.progress.getProgressPercentage(ids);
  });

  filteredQuestions = computed(() => {
    let questions = this.allQuestions();
    const query = this.searchQuery().toLowerCase();
    if (query) {
      questions = questions.filter(q => q.title.toLowerCase().includes(query));
    }
    const f = this.filter();
    if (f === 'completed') {
      questions = questions.filter(q => this.progress.isRead(q.id));
    } else if (f === 'pending') {
      questions = questions.filter(q => !this.progress.isRead(q.id));
    }
    return questions;
  });

  constructor() {
    effect(() => {
      const tech = this.technology();
      if (tech) {
        this.store.loadQuestionsForTechnology(tech.slug);
        this.seo.setPageMeta({
          title: tech.name,
          description: `Preguntas de entrevista para ${tech.name}. ${tech.description}`,
          keywords: `${tech.name.toLowerCase()}, entrevistas, preguntas técnicas`
        });
      }
    });
  }
}
