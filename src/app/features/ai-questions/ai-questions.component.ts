import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AiQuestionsService, AiQuestion } from '../../core/services/ai-questions.service';
import { ContentStore } from '../../core/stores/content.store';
import { SeoService } from '../../core/services/seo.service';
import { difficultyLabel } from '../../core/utils/difficulty';
import { generateSlug } from '../../core/utils/slug-generator';
import { Difficulty } from '../../domain/models/question.model';

@Component({
  selector: 'app-ai-questions',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <nav class="breadcrumb" aria-label="Ruta de navegación">
      <a routerLink="/">Inicio</a>
      <span aria-hidden="true"> &rsaquo; </span>
      <span>Generar Preguntas IA</span>
    </nav>

    <header class="page-header">
      <div class="page-header-icon">
        <mat-icon>auto_awesome</mat-icon>
      </div>
      <div class="page-header-info">
        <h1>Generar Preguntas con IA</h1>
        <p class="page-desc">Pega la descripción de una oferta de empleo y la IA seleccionará las preguntas de entrevista más relevantes de nuestro catálogo.</p>
      </div>
    </header>

    <!-- Input section -->
    @if (!hasResults()) {
      <div class="input-section">
        <label for="job-desc" class="input-label">Descripción de la oferta de empleo</label>
        <textarea
          id="job-desc"
          class="job-textarea"
          [(ngModel)]="jobDescription"
          placeholder="Pega aquí la descripción de la oferta de empleo...&#10;&#10;Ejemplo: Buscamos un desarrollador Frontend con experiencia en Angular, TypeScript y RxJS..."
          rows="10"
          [disabled]="loading()"
          maxlength="10000"
        ></textarea>
        <div class="input-footer">
          <span class="char-count">{{ jobDescription().length }} / 10.000 caracteres</span>
          <button
            class="generate-btn"
            (click)="generate()"
            [disabled]="loading() || jobDescription().trim().length === 0"
          >
            @if (loading()) {
              <mat-spinner diameter="20"></mat-spinner>
              Analizando oferta...
            } @else {
              <mat-icon>auto_awesome</mat-icon>
              Generar Preguntas
            }
          </button>
        </div>
      </div>
    }

    @if (error()) {
      <div class="error-message">
        <mat-icon>error_outline</mat-icon>
        <p>{{ error() }}</p>
      </div>
    }

    <!-- Results section -->
    @if (hasResults()) {
      <div class="results-section">
        <div class="results-header">
          <div class="results-summary">
            <h2>{{ filteredQuestions().length }} preguntas seleccionadas</h2>
            <p class="detected-techs">
              Tecnologías detectadas:
              @for (tech of detectedTechnologies(); track tech) {
                <span class="tech-chip">{{ tech }}</span>
              }
            </p>
          </div>
          <button class="reset-btn" (click)="reset()">
            <mat-icon>refresh</mat-icon>
            Nueva consulta
          </button>
        </div>

        <div class="results-layout">
          <!-- Sidebar -->
          <aside class="sidebar">
            <!-- Filter by technology -->
            <div class="filter-section">
              <p class="filter-label">Tecnología</p>
              <div class="tech-filters">
                <button
                  class="tech-filter-btn"
                  [class.active]="technologyFilter() === null"
                  (click)="technologyFilter.set(null)"
                >Todas</button>
                @for (tech of availableTechnologies(); track tech) {
                  <button
                    class="tech-filter-btn"
                    [class.active]="technologyFilter() === tech"
                    (click)="technologyFilter.set(tech)"
                  >{{ techDisplayName(tech) }} ({{ techCount(tech) }})</button>
                }
              </div>
            </div>

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
          </aside>

          <!-- Question list -->
          <main class="main-col">
            <div class="search-container">
              <mat-icon class="search-icon">search</mat-icon>
              <input
                type="text"
                class="search-input"
                placeholder="Buscar preguntas..."
                [value]="searchQuery()"
                (input)="searchQuery.set($any($event.target).value)"
                aria-label="Buscar preguntas"
              />
            </div>

            <div class="questions-list" role="list" aria-label="Preguntas generadas por IA">
              @for (question of pagedQuestions(); track question.title) {
                <a
                  [routerLink]="['/', question.technology, slugify(question.title)]"
                  [queryParams]="{ ai: 1 }"
                  class="question-row"
                  role="listitem"
                >
                  <div class="question-tech-icon">
                    <i [class]="getDevicon(question.technology)" [style.color]="getTechColor(question.technology)"></i>
                  </div>
                  <div class="question-info">
                    <span class="question-title">{{ question.title }}</span>
                    <p class="question-relevance">{{ question.relevance }}</p>
                    <div class="question-meta">
                      <span class="tech-badge" [style.background]="getTechColor(question.technology) + '15'" [style.color]="getTechColor(question.technology)">
                        {{ techDisplayName(question.technology) }}
                      </span>
                      <span class="difficulty-badge" [class]="'badge-' + question.difficulty">
                        {{ difficultyLabel(question.difficulty) }}
                      </span>
                      @for (tag of question.tags.slice(0, 3); track tag) {
                        <span class="tag-badge">{{ tag }}</span>
                      }
                    </div>
                  </div>
                  <mat-icon class="chevron">chevron_right</mat-icon>
                </a>
              } @empty {
                <div class="empty-message">
                  <mat-icon>search_off</mat-icon>
                  <p>No se encontraron preguntas con estos filtros.</p>
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
                  <mat-icon>chevron_left</mat-icon>
                </button>
                @for (page of pageNumbers(); track page) {
                  <button
                    class="page-btn"
                    [class.active]="page === currentPage()"
                    (click)="goToPage(page)"
                    [attr.aria-label]="'Página ' + page"
                  >{{ page }}</button>
                }
                <button
                  class="page-btn"
                  [disabled]="currentPage() === totalPages()"
                  (click)="goToPage(currentPage() + 1)"
                  aria-label="Página siguiente"
                >
                  <mat-icon>chevron_right</mat-icon>
                </button>
              </nav>
            }
          </main>
        </div>
      </div>
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

    .page-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;
    }
    .page-header-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: linear-gradient(135deg, #7c3aed20, #a855f720);
    }
    .page-header-icon mat-icon {
      font-size: 30px;
      width: 30px;
      height: 30px;
      color: #7c3aed;
    }
    .page-header-info { flex: 1; }
    .page-header-info h1 { margin: 0 0 4px; font-size: 1.5rem; }
    .page-desc { margin: 0; opacity: 0.7; font-size: 0.9rem; }

    /* Input section */
    .input-section {
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 14px;
      padding: 24px;
    }
    .input-label {
      display: block;
      font-weight: 600;
      margin-bottom: 12px;
      font-size: 0.9rem;
    }
    .job-textarea {
      width: 100%;
      min-height: 200px;
      padding: 16px;
      border: 1px solid var(--app-border);
      border-radius: 10px;
      background: var(--app-surface-variant);
      color: var(--app-text);
      font-family: inherit;
      font-size: 0.9rem;
      line-height: 1.6;
      resize: vertical;
      outline: none;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }
    .job-textarea:focus {
      border-color: var(--app-primary);
    }
    .job-textarea::placeholder {
      color: var(--app-text-muted);
    }
    .input-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
    }
    .char-count {
      font-size: 0.78rem;
      opacity: 0.5;
    }
    .generate-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 10px;
      border: none;
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      color: white;
      font-size: 0.9rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
    }
    .generate-btn:hover:not([disabled]) {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    .generate-btn[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .generate-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }

    /* Error */
    .error-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: #fce4ec;
      color: #c62828;
      border-radius: 10px;
      margin-top: 16px;
      font-size: 0.9rem;
    }

    /* Results */
    .results-section { margin-top: 8px; }
    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .results-summary h2 { margin: 0 0 8px; font-size: 1.2rem; }
    .detected-techs {
      margin: 0;
      font-size: 0.85rem;
      opacity: 0.7;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
    }
    .tech-chip {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 20px;
      background: var(--app-primary);
      color: var(--app-on-primary);
      font-size: 0.75rem;
      font-weight: 600;
    }
    .reset-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 10px;
      border: 1px solid var(--app-border);
      background: var(--app-surface);
      color: var(--app-text);
      font-size: 0.85rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.15s;
    }
    .reset-btn:hover {
      background: var(--app-surface-variant);
    }
    .reset-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .results-layout {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 32px;
      align-items: start;
    }

    /* Sidebar */
    .sidebar {
      position: sticky;
      top: 80px;
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
    .tech-filters { display: flex; flex-direction: column; gap: 4px; }
    .tech-filter-btn {
      text-align: left;
      padding: 8px 12px;
      border: none;
      border-radius: 8px;
      background: transparent;
      font-size: 0.85rem;
      font-family: inherit;
      cursor: pointer;
      color: inherit;
      transition: background 0.15s;
    }
    .tech-filter-btn:hover { background: var(--app-surface-variant); }
    .tech-filter-btn.active {
      background: var(--app-primary);
      color: var(--app-on-primary);
      font-weight: 600;
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

    /* Main content */
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
    .search-container:focus-within { border-color: var(--app-primary); }
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
    .question-tech-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: var(--app-surface-variant);
    }
    .question-tech-icon i { font-size: 22px; }
    .question-info { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .question-title { font-weight: 600; font-size: 0.95rem; }
    .question-relevance {
      margin: 0;
      font-size: 0.8rem;
      opacity: 0.6;
      line-height: 1.4;
    }
    .question-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 0.78rem;
    }
    .tech-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 700;
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
    .chevron { color: var(--app-text-subtle); flex-shrink: 0; }

    .empty-message {
      text-align: center;
      padding: 48px;
      opacity: 0.5;
    }
    .empty-message mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }

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
    .page-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }

    @media (max-width: 768px) {
      .results-layout {
        grid-template-columns: 1fr;
      }
      .sidebar { position: static; order: 2; }
      .main-col { order: 1; }
      .page-header { flex-wrap: wrap; }
      .results-header { flex-direction: column; }
    }
  `]
})
export class AiQuestionsComponent {
  private aiService = inject(AiQuestionsService);
  private store = inject(ContentStore);
  private seo = inject(SeoService);

  jobDescription = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  questions = signal<AiQuestion[]>([]);
  detectedTechnologies = signal<string[]>([]);

  searchQuery = signal('');
  technologyFilter = signal<string | null>(null);
  difficultyFilter = signal<Difficulty | null>(null);
  currentPage = signal(1);

  readonly PAGE_SIZE = 10;
  readonly difficultyLabel = difficultyLabel;
  readonly slugify = generateSlug;

  private readonly TECH_DISPLAY: Record<string, string> = {
    angular: 'Angular', react: 'React', vue: 'Vue.js',
    nodejs: 'Node.js', typescript: 'TypeScript', javascript: 'JavaScript',
  };

  private readonly TECH_DEVICON: Record<string, string> = {
    angular: 'devicon-angular-plain', react: 'devicon-react-original', vue: 'devicon-vuejs-plain',
    nodejs: 'devicon-nodejs-plain', typescript: 'devicon-typescript-plain', javascript: 'devicon-javascript-plain',
  };

  private readonly TECH_COLOR: Record<string, string> = {
    angular: '#DD0031', react: '#61DAFB', vue: '#42B883',
    nodejs: '#339933', typescript: '#3178C6', javascript: '#F7DF1E',
  };

  hasResults = computed(() => this.questions().length > 0);

  availableTechnologies = computed(() => {
    const techs = new Set(this.questions().map(q => q.technology));
    return Array.from(techs).sort();
  });

  filteredQuestions = computed(() => {
    let qs = this.questions();
    const query = this.searchQuery().toLowerCase();
    if (query) {
      qs = qs.filter(q =>
        q.title.toLowerCase().includes(query) ||
        q.tags.some(t => t.toLowerCase().includes(query)) ||
        q.relevance.toLowerCase().includes(query)
      );
    }
    const tech = this.technologyFilter();
    if (tech) qs = qs.filter(q => q.technology === tech);
    const diff = this.difficultyFilter();
    if (diff) qs = qs.filter(q => q.difficulty === diff);
    return qs;
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredQuestions().length / this.PAGE_SIZE)));

  pagedQuestions = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * this.PAGE_SIZE;
    return this.filteredQuestions().slice(start, start + this.PAGE_SIZE);
  });

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const delta = 2;
    for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
      pages.push(i);
    }
    return pages;
  });

  constructor() {
    this.seo.setPageMeta({
      title: 'Generar Preguntas IA',
      description: 'Genera preguntas de entrevista personalizadas analizando ofertas de empleo con inteligencia artificial.',
      keywords: 'ia, inteligencia artificial, preguntas entrevista, oferta empleo',
    });
  }

  techDisplayName(slug: string): string {
    return this.TECH_DISPLAY[slug] ?? slug;
  }

  getDevicon(slug: string): string {
    return this.TECH_DEVICON[slug] ?? 'devicon-devicon-plain';
  }

  getTechColor(slug: string): string {
    return this.TECH_COLOR[slug] ?? '#64748b';
  }

  techCount(slug: string): number {
    return this.questions().filter(q => q.technology === slug).length;
  }

  generate(): void {
    const desc = this.jobDescription().trim();
    if (!desc) return;

    this.loading.set(true);
    this.error.set(null);

    this.aiService.generateQuestions(desc).subscribe({
      next: (res) => {
        this.questions.set(res.questions);
        this.detectedTechnologies.set(res.technologies_detected);
        this.aiService.setActiveList(res.questions);
        this.loading.set(false);

        // Pre-load question data for all detected technologies
        for (const q of res.questions) {
          this.store.loadQuestionsForTechnology(q.technology);
        }
      },
      error: (err) => {
        const message = err.error?.error || 'Error al generar las preguntas. Inténtalo de nuevo.';
        this.error.set(message);
        this.loading.set(false);
      },
    });
  }

  reset(): void {
    this.questions.set([]);
    this.detectedTechnologies.set([]);
    this.aiService.clearActiveList();
    this.error.set(null);
    this.searchQuery.set('');
    this.technologyFilter.set(null);
    this.difficultyFilter.set(null);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    const total = this.totalPages();
    if (page >= 1 && page <= total) {
      this.currentPage.set(page);
    }
  }
}
