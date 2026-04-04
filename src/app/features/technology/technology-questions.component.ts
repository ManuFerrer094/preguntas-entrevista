import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  MfButtonComponent,
  MfCardComponent,
  MfIconComponent,
  MfInputComponent,
  MfProgressBarComponent,
  MfProgressSpinnerComponent,
} from 'ng-comps';
import { ContentStore } from '../../core/stores/content.store';
import { ProgressService } from '../../core/services/progress.service';
import { SeoService } from '../../core/services/seo.service';
import { Difficulty } from '../../domain/models/question.model';
import { difficultyLabel } from '../../core/utils/difficulty';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-technology-questions',
  standalone: true,
  imports: [
    RouterLink,
    MfIconComponent,
    MfProgressSpinnerComponent,
    MfProgressBarComponent,
    MfCardComponent,
    MfInputComponent,
    MfButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (technology()) {
      <nav class="breadcrumb" aria-label="Ruta de navegación">
        <a routerLink="/">Inicio</a>
        <span aria-hidden="true"> &rsaquo; </span>
        <a [routerLink]="['/', technology()!.slug]">{{ technology()!.name }}</a>
        <span aria-hidden="true"> &rsaquo; </span>
        <span>Preguntas</span>
      </nav>

      <div class="tech-layout">
        <aside class="sidebar">
          <mf-card variant="outlined" padding="md">
            <div class="progress-header">
              <span>Tu progreso</span>
              <strong class="progress-pct">{{ progressPct() }}%</strong>
            </div>
            <mf-progress-bar
              mode="determinate"
              [value]="progressPct()"
              color="brand"
              [showValue]="false"
              [height]="8"
            />
            <span class="progress-detail"
              >{{ readCount() }} de {{ allQuestions().length }} completadas</span
            >
          </mf-card>

          <nav class="sidebar-nav">
            <mf-button
              label="Todas"
              [variant]="filter() === 'all' ? 'filled' : 'text'"
              leadingIcon="list"
              [fullWidth]="true"
              (mfClick)="filter.set('all')"
            />
            <mf-button
              label="Completadas"
              [variant]="filter() === 'completed' ? 'filled' : 'text'"
              leadingIcon="check_circle"
              [fullWidth]="true"
              (mfClick)="filter.set('completed')"
            />
            <mf-button
              label="Pendientes"
              [variant]="filter() === 'pending' ? 'filled' : 'text'"
              leadingIcon="radio_button_unchecked"
              [fullWidth]="true"
              (mfClick)="filter.set('pending')"
            />
          </nav>

          <mf-card variant="outlined" padding="md">
            <p class="filter-label">Dificultad</p>
            <div class="difficulty-filters">
              <button
                class="diff-btn"
                [class.active]="difficultyFilter() === null"
                (click)="difficultyFilter.set(null)"
              >
                Todas
              </button>
              <button
                class="diff-btn easy"
                [class.active]="difficultyFilter() === 'easy'"
                (click)="difficultyFilter.set('easy')"
              >
                Fácil
              </button>
              <button
                class="diff-btn medium"
                [class.active]="difficultyFilter() === 'medium'"
                (click)="difficultyFilter.set('medium')"
              >
                Media
              </button>
              <button
                class="diff-btn hard"
                [class.active]="difficultyFilter() === 'hard'"
                (click)="difficultyFilter.set('hard')"
              >
                Difícil
              </button>
            </div>
          </mf-card>

          @if (availableTags().length > 0) {
            <mf-card variant="outlined" padding="md">
              <p class="filter-label">Etiquetas</p>
              <div class="tag-filters">
                @for (tag of availableTags(); track tag) {
                  <button
                    class="tag-chip"
                    [class.active]="activeTag() === tag"
                    (click)="toggleTag(tag)"
                  >
                    {{ tag }}
                  </button>
                }
              </div>
            </mf-card>
          }
        </aside>

        <main class="main-col">
          <header class="tech-header">
            <div class="tech-header-main">
              <div class="tech-header-icon" [style.background]="technology()!.color + '15'">
                <i [class]="technology()!.devicon" [style.color]="technology()!.color"></i>
              </div>
              <div class="tech-header-info">
                <p class="tech-kicker">Preparación práctica</p>
                <h1>Preguntas de {{ technology()!.name }}</h1>
                <p class="tech-desc">{{ technology()!.description }}</p>
              </div>
            </div>

            <div class="tech-header-actions">
              <a [routerLink]="['/', technology()!.slug]" class="header-link">
                <mf-icon name="dashboard" color="inherit" />
                Resumen
              </a>
              <a [routerLink]="['/', technology()!.slug, 'recursos']" class="header-link accent">
                <mf-icon name="library_books" color="inherit" />
                Recursos
              </a>
            </div>
          </header>

          <mf-input
            type="search"
            placeholder="Buscar por palabra clave, tema o etiqueta..."
            leadingIcon="search"
            [value]="searchQuery()"
            [fullWidth]="true"
            (mfInput)="searchQuery.set($event)"
            label="Buscar preguntas"
          />

          @if (store.loading()) {
            <div class="loading-container">
              <mf-progress-spinner
                mode="indeterminate"
                [diameter]="40"
                label="Cargando preguntas..."
              />
            </div>
          } @else {
            <div class="questions-list" role="list" aria-label="Lista de preguntas">
              @for (question of pagedQuestions(); track question.id) {
                <a
                  [routerLink]="['/', technology()!.slug, question.slug]"
                  class="question-row"
                  [class.is-read]="progress.isRead(question.id)"
                  role="listitem"
                >
                  <div class="question-status">
                    @if (progress.isRead(question.id)) {
                      <mf-icon name="check_circle" color="inherit" class="status-done" />
                    } @else {
                      <mf-icon
                        name="radio_button_unchecked"
                        color="inherit"
                        class="status-pending"
                      />
                    }
                  </div>
                  <div class="question-info">
                    <span class="question-title">{{ question.title }}</span>
                    <div class="question-meta">
                      <span class="difficulty-badge" [class]="'badge-' + question.difficulty">{{
                        difficultyLabel(question.difficulty)
                      }}</span>
                      @for (tag of question.tags.slice(0, 3); track tag) {
                        <span class="tag-badge">{{ tag }}</span>
                      }
                      <span class="read-status">
                        @if (progress.isRead(question.id)) {
                          <mf-icon name="visibility" size="sm" color="inherit" class="meta-icon" />
                          Leída
                        } @else {
                          <mf-icon
                            name="visibility_off"
                            size="sm"
                            color="inherit"
                            class="meta-icon"
                          />
                          Sin leer
                        }
                      </span>
                    </div>
                  </div>
                  <mf-icon name="chevron_right" color="inherit" class="chevron" />
                </a>
              } @empty {
                <div class="empty-message">
                  <mf-icon name="search_off" color="inherit" />
                  <p>No se encontraron preguntas.</p>
                </div>
              }
            </div>

            @if (totalPages() > 1) {
              <nav class="pagination" aria-label="Paginación">
                <mf-button
                  label=""
                  variant="outlined"
                  leadingIcon="chevron_left"
                  [disabled]="currentPage() === 1"
                  (mfClick)="goToPage(currentPage() - 1)"
                  aria-label="Página anterior"
                />
                @for (page of pageNumbers(); track page) {
                  <mf-button
                    [label]="'' + page"
                    [variant]="page === currentPage() ? 'filled' : 'outlined'"
                    (mfClick)="goToPage(page)"
                    [attr.aria-label]="'Página ' + page"
                    [attr.aria-current]="page === currentPage() ? 'page' : null"
                  />
                }
                <mf-button
                  label=""
                  variant="outlined"
                  leadingIcon="chevron_right"
                  [disabled]="currentPage() === totalPages()"
                  (mfClick)="goToPage(currentPage() + 1)"
                  aria-label="Página siguiente"
                />
              </nav>
            }
          }
        </main>
      </div>
    } @else {
      <p>Tecnología no encontrada.</p>
      <a routerLink="/" class="back-link">Volver al inicio</a>
    }
  `,
  styles: [
    `
      .breadcrumb {
        margin-bottom: 24px;
        font-size: 0.85rem;
      }
      .breadcrumb a {
        color: var(--app-primary);
        text-decoration: none;
      }
      .breadcrumb a:hover {
        text-decoration: underline;
      }
      .tech-layout {
        display: grid;
        grid-template-columns: 260px 1fr;
        gap: 32px;
        align-items: start;
      }
      .sidebar {
        position: sticky;
        top: 80px;
      }
      mf-card {
        display: block;
        margin-bottom: 12px;
      }
      mf-progress-bar {
        display: block;
        margin-bottom: 8px;
      }
      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.9rem;
        font-weight: 600;
        margin-bottom: 12px;
      }
      .progress-pct {
        color: var(--app-primary);
      }
      .progress-detail {
        font-size: 0.78rem;
        opacity: 0.6;
      }
      .sidebar-nav {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 16px;
      }
      .filter-label {
        font-size: 0.78rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.55;
        margin: 0 0 10px;
      }
      .difficulty-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .diff-btn {
        padding: 4px 12px;
        border-radius: 20px;
        border: 1px solid var(--app-border);
        background: transparent;
        font-size: 0.8rem;
        font-family: inherit;
        cursor: pointer;
        color: inherit;
        transition:
          background 0.15s,
          border-color 0.15s;
      }
      .diff-btn:hover {
        background: var(--app-surface-variant);
      }
      .diff-btn.active {
        border-color: currentColor;
        font-weight: 600;
      }
      .diff-btn.easy.active {
        background: #e8f5e9;
        color: #2e7d32;
        border-color: #2e7d32;
      }
      .diff-btn.medium.active {
        background: #fff3e0;
        color: #e65100;
        border-color: #e65100;
      }
      .diff-btn.hard.active {
        background: #fce4ec;
        color: #c62828;
        border-color: #c62828;
      }
      .tag-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        max-height: 180px;
        overflow-y: auto;
        padding-right: 2px;
      }
      .tag-chip {
        padding: 3px 10px;
        border-radius: 20px;
        border: 1px solid var(--app-border);
        background: transparent;
        font-size: 0.77rem;
        font-family: inherit;
        cursor: pointer;
        color: inherit;
        transition: background 0.15s;
      }
      .tag-chip:hover {
        background: var(--app-surface-variant);
      }
      .tag-chip.active {
        background: var(--app-primary);
        color: var(--app-on-primary);
        border-color: var(--app-primary);
        font-weight: 600;
      }
      .tech-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 28px;
      }
      .tech-header-main {
        display: flex;
        align-items: center;
        gap: 16px;
        min-width: 0;
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
      .tech-header-icon i {
        font-size: 30px;
      }
      .tech-kicker {
        margin: 0 0 6px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--app-primary);
      }
      .tech-header-info h1 {
        margin: 0 0 4px;
        font-size: 1.6rem;
      }
      .tech-desc {
        margin: 0;
        opacity: 0.7;
        font-size: 0.92rem;
      }
      .tech-header-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .header-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: 12px;
        border: 1px solid var(--app-border);
        background: var(--app-surface);
        color: var(--app-text);
        text-decoration: none;
        font-weight: 600;
        transition:
          border-color 0.2s,
          transform 0.2s,
          box-shadow 0.2s;
      }
      .header-link:hover {
        border-color: var(--app-primary);
        box-shadow: var(--app-shadow-sm);
        transform: translateY(-1px);
      }
      .header-link.accent {
        color: var(--app-primary);
      }
      .questions-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .question-row {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px 20px;
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        border-radius: 12px;
        text-decoration: none;
        color: var(--app-text);
        transition:
          border-color 0.2s,
          box-shadow 0.2s;
      }
      .question-row:hover {
        border-color: var(--app-primary);
        box-shadow: var(--app-shadow-sm);
      }
      .question-row.is-read {
        opacity: 0.75;
      }
      .status-done {
        color: #43a047;
      }
      .status-pending {
        color: #bdbdbd;
      }
      .question-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
      }
      .question-title {
        font-weight: 600;
        font-size: 0.95rem;
      }
      .question-meta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        font-size: 0.78rem;
      }
      .difficulty-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 20px;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      .badge-easy {
        background: #e8f5e9;
        color: #2e7d32;
      }
      .badge-medium {
        background: #fff3e0;
        color: #e65100;
      }
      .badge-hard {
        background: #fce4ec;
        color: #c62828;
      }
      .tag-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 20px;
        font-size: 0.72rem;
        background: var(--app-surface-variant);
        color: var(--app-text-muted);
        border: 1px solid var(--app-border);
      }
      .read-status {
        display: flex;
        align-items: center;
        gap: 3px;
        opacity: 0.55;
        margin-left: auto;
      }
      .meta-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
      .chevron {
        color: var(--app-text-subtle);
        flex-shrink: 0;
      }
      .loading-container {
        display: flex;
        justify-content: center;
        padding: 48px;
      }
      .empty-message {
        text-align: center;
        padding: 48px;
        opacity: 0.5;
        background: var(--app-surface);
        border: 1px dashed var(--app-border);
        border-radius: 16px;
        margin-top: 16px;
      }
      .empty-message mf-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 12px;
      }
      .pagination {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin-top: 24px;
        flex-wrap: wrap;
      }
      @media (max-width: 900px) {
        .tech-layout {
          grid-template-columns: 1fr;
        }
        .sidebar {
          position: static;
          order: 2;
        }
        .main-col {
          order: 1;
        }
        .tech-header {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class TechnologyQuestionsComponent {
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(ContentStore);
  private readonly seo = inject(SeoService);
  readonly progress = inject(ProgressService);
  private readonly viewportScroller = inject(ViewportScroller);

  readonly searchQuery = signal('');
  readonly filter = signal<'all' | 'completed' | 'pending'>('all');
  readonly difficultyFilter = signal<Difficulty | null>(null);
  readonly activeTag = signal<string | null>(null);
  readonly currentPage = signal(1);

  private readonly routeParams = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly technology = computed(() => {
    const slug = this.routeParams().get('technology') ?? '';
    return this.store.getTechnology(slug) ?? null;
  });

  readonly allQuestions = computed(() => {
    const tech = this.technology();
    if (!tech) return [];
    return this.store.getQuestionsByTechnology(tech.slug);
  });

  readonly availableTags = computed(() => {
    const tagSet = new Set<string>();
    for (const question of this.allQuestions()) {
      for (const tag of question.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  });

  readonly readCount = computed(() => {
    const ids = this.allQuestions().map((question) => question.id);
    return this.progress.getReadCountForTechnology(ids);
  });

  readonly progressPct = computed(() => {
    const ids = this.allQuestions().map((question) => question.id);
    return this.progress.getProgressPercentage(ids);
  });

  readonly filteredQuestions = computed(() => {
    let questions = this.allQuestions();
    const query = this.searchQuery().toLowerCase();
    if (query) {
      questions = questions.filter(
        (question) =>
          question.title.toLowerCase().includes(query) ||
          question.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }
    const difficulty = this.difficultyFilter();
    if (difficulty) {
      questions = questions.filter((question) => question.difficulty === difficulty);
    }
    const tag = this.activeTag();
    if (tag) {
      questions = questions.filter((question) => question.tags.includes(tag));
    }
    const filter = this.filter();
    if (filter === 'completed') {
      questions = questions.filter((question) => this.progress.isRead(question.id));
    } else if (filter === 'pending') {
      questions = questions.filter((question) => !this.progress.isRead(question.id));
    }
    return questions;
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredQuestions().length / PAGE_SIZE)),
  );

  readonly pagedQuestions = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredQuestions().slice(start, start + PAGE_SIZE);
  });

  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const delta = 2;
    for (
      let page = Math.max(1, current - delta);
      page <= Math.min(total, current + delta);
      page++
    ) {
      pages.push(page);
    }
    return pages;
  });

  readonly difficultyLabel = difficultyLabel;

  constructor() {
    effect(() => {
      const tech = this.technology();
      if (!tech) return;

      this.store.loadQuestionsForTechnology(tech.slug);
      this.seo.setPageMeta({
        title: `Preguntas de entrevista de ${tech.name}`,
        description: `Practica preguntas de entrevista de ${tech.name}, filtra por dificultad y sigue tu progreso de preparación.`,
        keywords: `${tech.name.toLowerCase()}, preguntas de entrevista, preguntas técnicas, práctica`,
      });
    });

    effect(() => {
      this.searchQuery();
      this.filter();
      this.difficultyFilter();
      this.activeTag();
      untracked(() => this.currentPage.set(1));
    });
  }

  toggleTag(tag: string): void {
    this.activeTag.update((current) => (current === tag ? null : tag));
  }

  goToPage(page: number): void {
    const total = this.totalPages();
    if (page >= 1 && page <= total) {
      this.currentPage.set(page);
      this.viewportScroller.scrollToPosition([0, 0]);
    }
  }
}
