import { ChangeDetectionStrategy, Component, inject, computed, effect, signal, untracked } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MfIconComponent, MfProgressSpinnerComponent } from 'ng-comps';
import { ContentStore } from '../../core/stores/content.store';
import { SeoService } from '../../core/services/seo.service';
import { ProgressService } from '../../core/services/progress.service';
import { Difficulty } from '../../domain/models/question.model';
import { difficultyLabel } from '../../core/utils/difficulty';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-technology',
  standalone: true,
  imports: [RouterLink, MfIconComponent, MfProgressSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
              <mf-icon name="list" color="inherit" />
              Todas
            </button>
            <button
              class="sidebar-btn"
              [class.active]="filter() === 'completed'"
              (click)="filter.set('completed')"
            >
              <mf-icon name="check_circle" color="inherit" />
              Completadas
            </button>
            <button
              class="sidebar-btn"
              [class.active]="filter() === 'pending'"
              (click)="filter.set('pending')"
            >
              <mf-icon name="radio_button_unchecked" color="inherit" />
              Pendientes
            </button>
          </nav>

          <!-- Difficulty filter -->
          <div class="filter-section">
            <p class="filter-label">Dificultad</p>
            <div class="difficulty-filters">
              <button
                class="diff-btn"
                [class.active]="difficultyFilter() === null"
                (click)="difficultyFilter.set(null)"
              >Todas</button>
              <button
                class="diff-btn easy"
                [class.active]="difficultyFilter() === 'easy'"
                (click)="difficultyFilter.set('easy')"
              >Fácil</button>
              <button
                class="diff-btn medium"
                [class.active]="difficultyFilter() === 'medium'"
                (click)="difficultyFilter.set('medium')"
              >Media</button>
              <button
                class="diff-btn hard"
                [class.active]="difficultyFilter() === 'hard'"
                (click)="difficultyFilter.set('hard')"
              >Difícil</button>
            </div>
          </div>

          <!-- Tag filter -->
          @if (availableTags().length > 0) {
            <div class="filter-section">
              <p class="filter-label">Etiquetas</p>
              <div class="tag-filters">
                @for (tag of availableTags(); track tag) {
                  <button
                    class="tag-chip"
                    [class.active]="activeTag() === tag"
                    (click)="toggleTag(tag)"
                  >{{ tag }}</button>
                }
              </div>
            </div>
          }
        </aside>

        <!-- Main Content -->
        <main class="main-col">
          <header class="tech-header">
            <div class="tech-header-icon" [style.background]="technology()!.color + '15'">
              <i [class]="technology()!.devicon" [style.color]="technology()!.color"></i>
            </div>
            <div class="tech-header-info">
              <h1>{{ technology()!.name }}</h1>
              <p class="tech-desc">{{ technology()!.description }}</p>
            </div>
          </header>

          <div class="search-container">
            <mf-icon name="search" color="inherit" class="search-icon" />
            <input
              type="text"
              class="search-input"
              placeholder="Buscar por palabra clave, tema o etiqueta..."
              [value]="searchQuery()"
              (input)="onSearchInput($event)"
              aria-label="Buscar preguntas"
            />
          </div>

          @if (store.loading()) {
            <div class="loading-container">
              <mf-progress-spinner mode="indeterminate" [diameter]="40" label="Cargando preguntas..." />
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
                      <mf-icon name="radio_button_unchecked" color="inherit" class="status-pending" />
                    }
                  </div>
                  <div class="question-info">
                    <span class="question-title">{{ question.title }}</span>
                    <div class="question-meta">
                      <span class="difficulty-badge" [class]="'badge-' + question.difficulty">
                        {{ difficultyLabel(question.difficulty) }}
                      </span>
                      @for (tag of question.tags.slice(0, 3); track tag) {
                        <span class="tag-badge">{{ tag }}</span>
                      }
                      <span class="read-status">
                        @if (progress.isRead(question.id)) {
                          <mf-icon name="visibility" size="sm" color="inherit" class="meta-icon" /> Leída
                        } @else {
                          <mf-icon name="visibility_off" size="sm" color="inherit" class="meta-icon" /> Sin leer
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

            <!-- Pagination -->
            @if (totalPages() > 1) {
              <nav class="pagination" aria-label="Paginación">
                <button
                  class="page-btn"
                  [disabled]="currentPage() === 1"
                  (click)="goToPage(currentPage() - 1)"
                  aria-label="Página anterior"
                >
                  <mf-icon name="chevron_left" color="inherit" />
                </button>

                @for (page of pageNumbers(); track page) {
                  <button
                    class="page-btn"
                    [class.active]="page === currentPage()"
                    (click)="goToPage(page)"
                    [attr.aria-label]="'Página ' + page"
                    [attr.aria-current]="page === currentPage() ? 'page' : null"
                  >{{ page }}</button>
                }

                <button
                  class="page-btn"
                  [disabled]="currentPage() === totalPages()"
                  (click)="goToPage(currentPage() + 1)"
                  aria-label="Página siguiente"
                >
                  <mf-icon name="chevron_right" color="inherit" />
                </button>
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
  styles: [`
    .breadcrumb {
      margin-bottom: 24px;
      font-size: 0.85rem;
    }
    .breadcrumb a {
      color: var(--app-primary);
      text-decoration: none;
    }
    .breadcrumb a:hover { text-decoration: underline; }

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
    .progress-card {
      background: var(--app-surface);
      border: 1px solid var(--app-border);
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
    .progress-pct { color: var(--app-primary); }
    .progress-bar-track {
      height: 8px;
      border-radius: 4px;
      background: var(--app-surface-variant);
      overflow: hidden;
      margin-bottom: 8px;
    }
    .progress-bar-fill {
      height: 100%;
      border-radius: 4px;
      background: var(--app-primary);
      transition: width 0.4s ease;
    }
    .progress-detail { font-size: 0.78rem; opacity: 0.6; }

    .sidebar-nav { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
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
    .sidebar-btn:hover { background: var(--app-surface-variant); }
    .sidebar-btn.active {
      background: var(--app-primary);
      color: var(--app-on-primary);
      font-weight: 600;
    }

    .filter-section {
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 12px;
    }
    .filter-label {
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.55;
      margin: 0 0 10px;
    }

    .difficulty-filters { display: flex; flex-wrap: wrap; gap: 6px; }
    .diff-btn {
      padding: 4px 12px;
      border-radius: 20px;
      border: 1px solid var(--app-border);
      background: transparent;
      font-size: 0.8rem;
      font-family: inherit;
      cursor: pointer;
      color: inherit;
      transition: background 0.15s, border-color 0.15s;
    }
    .diff-btn:hover { background: var(--app-surface-variant); }
    .diff-btn.active { border-color: currentColor; font-weight: 600; }
    .diff-btn.easy.active { background: #e8f5e9; color: #2e7d32; border-color: #2e7d32; }
    .diff-btn.medium.active { background: #fff3e0; color: #e65100; border-color: #e65100; }
    .diff-btn.hard.active { background: #fce4ec; color: #c62828; border-color: #c62828; }

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
    .tag-chip:hover { background: var(--app-surface-variant); }
    .tag-chip.active {
      background: var(--app-primary);
      color: var(--app-on-primary);
      border-color: var(--app-primary);
      font-weight: 600;
    }

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
    .tech-header-info { flex: 1; }
    .tech-header-info h1 { margin: 0 0 4px; font-size: 1.5rem; }
    .tech-desc { margin: 0; opacity: 0.7; font-size: 0.9rem; }

    .pdf-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 10px;
      border: 1px solid var(--app-border);
      background: var(--app-surface);
      color: var(--app-text);
      font-size: 0.85rem;
      font-family: inherit;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
    }
    .pdf-btn:hover {
      background: var(--app-surface-variant);
      border-color: var(--app-primary);
      box-shadow: var(--app-shadow-sm);
    }
    .pdf-btn mf-icon { font-size: 18px; width: 18px; height: 18px; }

    .search-container {
      display: flex;
      align-items: center;
      background: var(--app-surface-variant);
      border-radius: 12px;
      padding: 0 16px;
      border: 1px solid var(--app-border);
      margin-bottom: 20px;
      transition: border-color 0.2s;
    }
    .search-container:focus-within {
      border-color: var(--app-primary);
    }
    .search-icon { color: var(--app-text-muted); margin-right: 12px; }
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

    .questions-list { display: flex; flex-direction: column; gap: 8px; }
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
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .question-row:hover {
      border-color: var(--app-primary);
      box-shadow: var(--app-shadow-sm);
    }
    .question-row.is-read { opacity: 0.75; }
    .status-done { color: #43a047; }
    .status-pending { color: #bdbdbd; }
    .question-info { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .question-title { font-weight: 600; font-size: 0.95rem; }
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
    .badge-easy { background: #e8f5e9; color: #2e7d32; }
    .badge-medium { background: #fff3e0; color: #e65100; }
    .badge-hard { background: #fce4ec; color: #c62828; }

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
    .meta-icon { font-size: 14px; width: 14px; height: 14px; }
    .chevron { color: var(--app-text-subtle); flex-shrink: 0; }

    .loading-container { display: flex; justify-content: center; padding: 48px; }
    .empty-message {
      text-align: center;
      padding: 48px;
      opacity: 0.5;
    }
    .empty-message mf-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      margin-top: 24px;
      flex-wrap: wrap;
    }
    .page-btn {
      min-width: 36px;
      height: 36px;
      padding: 0 10px;
      border: 1px solid var(--app-border);
      border-radius: 8px;
      background: var(--app-surface);
      cursor: pointer;
      font-size: 0.88rem;
      font-family: inherit;
      color: inherit;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, border-color 0.15s;
    }
    .page-btn:hover:not([disabled]) { background: var(--app-surface-variant); border-color: var(--app-primary); }
    .page-btn.active {
      background: var(--app-primary);
      color: var(--app-on-primary);
      border-color: var(--app-primary);
      font-weight: 700;
    }
    .page-btn[disabled] { opacity: 0.4; cursor: not-allowed; }
    .page-btn mf-icon { font-size: 20px; width: 20px; height: 20px; }

    @media (max-width: 768px) {
      .tech-layout {
        grid-template-columns: 1fr;
      }
      .sidebar { position: static; order: 2; }
      .main-col { order: 1; }
      .tech-header { flex-wrap: wrap; }
      .pdf-btn { width: 100%; justify-content: center; }
    }
  `]
})
export class TechnologyComponent {
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

  private readonly routeParams = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });

  readonly technology = computed(() => {
    const slug = this.routeParams().get('technology') ?? '';
    return this.store.technologies().find(t => t.slug === slug) ?? null;
  });

  readonly allQuestions = computed(() => {
    const tech = this.technology();
    if (!tech) return [];
    return this.store.getQuestionsByTechnology(tech.slug);
  });

  readonly availableTags = computed(() => {
    const tagSet = new Set<string>();
    for (const q of this.allQuestions()) {
      for (const t of q.tags) {
        tagSet.add(t);
      }
    }
    return Array.from(tagSet).sort();
  });

  readonly readCount = computed(() => {
    const ids = this.allQuestions().map(q => q.id);
    return this.progress.getReadCountForTechnology(ids);
  });

  readonly progressPct = computed(() => {
    const ids = this.allQuestions().map(q => q.id);
    return this.progress.getProgressPercentage(ids);
  });

  readonly filteredQuestions = computed(() => {
    let questions = this.allQuestions();
    const query = this.searchQuery().toLowerCase();
    if (query) {
      questions = questions.filter(
        q =>
          q.title.toLowerCase().includes(query) ||
          q.tags.some(t => t.toLowerCase().includes(query)),
      );
    }
    const diff = this.difficultyFilter();
    if (diff) {
      questions = questions.filter(q => q.difficulty === diff);
    }
    const tag = this.activeTag();
    if (tag) {
      questions = questions.filter(q => q.tags.includes(tag));
    }
    const f = this.filter();
    if (f === 'completed') {
      questions = questions.filter(q => this.progress.isRead(q.id));
    } else if (f === 'pending') {
      questions = questions.filter(q => !this.progress.isRead(q.id));
    }
    return questions;
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredQuestions().length / PAGE_SIZE)));

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
    for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
      pages.push(i);
    }
    return pages;
  });

  readonly difficultyLabel = difficultyLabel;

  toggleTag(tag: string): void {
    this.activeTag.update(current => (current === tag ? null : tag));
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  goToPage(page: number): void {
    const total = this.totalPages();
    if (page >= 1 && page <= total) {
      this.currentPage.set(page);
      this.viewportScroller.scrollToPosition([0, 0]);
    }
  }

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

    // Reset to page 1 whenever filters change
    effect(() => {
      this.searchQuery();
      this.filter();
      this.difficultyFilter();
      this.activeTag();
      untracked(() => this.currentPage.set(1));
    });
  }
}
