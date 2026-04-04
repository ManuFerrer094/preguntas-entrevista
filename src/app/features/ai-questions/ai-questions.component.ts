import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import {
  MfIconComponent,
  MfProgressSpinnerComponent,
  MfCardComponent,
  MfInputComponent,
  MfButtonComponent,
} from 'ng-comps';
import { AiQuestionsService, AiQuestion } from '../../core/services/ai-questions.service';
import { ContentStore } from '../../core/stores/content.store';
import { SeoService } from '../../core/services/seo.service';
import { SavedSessionsService, SavedAiSession } from '../../core/services/saved-sessions.service';
import { difficultyLabel } from '../../core/utils/difficulty';
import { generateSlug } from '../../core/utils/slug-generator';
import { getTagLabel } from '../../core/utils/tag-labels';
import { Difficulty } from '../../domain/models/question.model';
import { Technology } from '../../domain/models/technology.model';

@Component({
  selector: 'app-ai-questions',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    SlicePipe,
    MfIconComponent,
    MfProgressSpinnerComponent,
    MfCardComponent,
    MfInputComponent,
    MfButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ==================== LOADING OVERLAY ==================== -->
    @if (loading()) {
      <div class="loading-overlay" role="status" aria-live="polite" aria-label="Analizando oferta">
        <div class="loading-overlay-card">
          <mf-progress-spinner mode="indeterminate" [diameter]="52" />
          <p class="loading-overlay-title">Analizando oferta con IA...</p>
          <p class="loading-overlay-desc">Esto puede tardar unos segundos</p>
        </div>
      </div>
    }

    <nav class="breadcrumb" aria-label="Ruta de navegación">
      <a routerLink="/">Inicio</a>
      <span aria-hidden="true"> &rsaquo; </span>
      <span>Generar Preguntas IA</span>
    </nav>

    <header class="page-header">
      <div class="page-header-info">
        <h1>Generar Preguntas con IA</h1>
        <p class="page-desc">
          Pega la descripción de una oferta de empleo y la IA seleccionará las preguntas de
          entrevista más relevantes de nuestro catálogo.
        </p>
      </div>
    </header>

    <!-- Input section -->
    @if (!hasResults()) {
      <mf-card variant="outlined" padding="lg" class="input-section">
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
          <mf-button
            [label]="loading() ? 'Analizando oferta...' : 'Generar Preguntas'"
            variant="filled"
            [leadingIcon]="loading() ? '' : 'auto_awesome'"
            [disabled]="loading() || jobDescription().trim().length === 0"
            (mfClick)="generate()"
          />
        </div>
      </mf-card>

      <!-- ===================== SAVED AI SESSIONS ===================== -->
      @if (savedSessions.savedAiSessions().length > 0) {
        <div class="saved-section">
          <h2 class="saved-title">
            <mf-icon name="bookmark" color="inherit" />
            Preguntas IA guardadas
          </h2>
          <div class="saved-list">
            @for (session of savedSessions.savedAiSessions(); track session.id) {
              <mf-card variant="outlined" padding="md" class="saved-card">
                <div class="saved-card-info">
                  <p class="saved-card-date">{{ formatDate(session.savedAt) }}</p>
                  <p class="saved-card-desc">
                    {{ session.jobDescription | slice: 0 : 120
                    }}{{ session.jobDescription.length > 120 ? '…' : '' }}
                  </p>
                  <div class="saved-card-meta">
                    <span class="saved-meta-chip">{{ session.questions.length }} preguntas</span>
                    @for (tech of session.technologiesDetected.slice(0, 3); track tech) {
                      <span class="saved-meta-chip">{{ tech }}</span>
                    }
                    @if (session.technologiesDetected.length > 3) {
                      <span class="saved-meta-chip"
                        >+{{ session.technologiesDetected.length - 3 }}</span
                      >
                    }
                  </div>
                </div>
                <div class="saved-card-actions">
                  <mf-button
                    label="Cargar"
                    variant="outlined"
                    size="sm"
                    leadingIcon="open_in_new"
                    (mfClick)="loadSavedSession(session)"
                  />
                  <mf-button
                    label=""
                    variant="text"
                    size="sm"
                    leadingIcon="delete_outline"
                    (mfClick)="savedSessions.deleteAiSession(session.id)"
                  />
                </div>
              </mf-card>
            }
          </div>
        </div>
      }
    }

    @if (error()) {
      <div class="error-message">
        <mf-icon name="error_outline" color="inherit" />
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
          <div class="results-header-actions">
            <mf-button
              [label]="sessionAlreadySaved() ? 'Guardado' : 'Guardar'"
              variant="outlined"
              [leadingIcon]="sessionAlreadySaved() ? 'bookmark' : 'bookmark_border'"
              [disabled]="sessionAlreadySaved()"
              (mfClick)="saveCurrentSession()"
            />
            <mf-button
              label="Nueva consulta"
              variant="outlined"
              leadingIcon="refresh"
              (mfClick)="reset()"
            />
          </div>
        </div>

        <div class="results-layout">
          <!-- Sidebar -->
          <aside class="sidebar">
            <!-- Filter by technology -->
            <mf-card variant="outlined" padding="md" class="filter-section">
              <p class="filter-label">Tecnología</p>
              <div class="tech-filters">
                <mf-button
                  label="Todas"
                  [variant]="technologyFilter() === null ? 'filled' : 'text'"
                  size="sm"
                  [fullWidth]="true"
                  (mfClick)="technologyFilter.set(null)"
                />
                @for (tech of availableTechnologies(); track tech) {
                  <mf-button
                    [label]="techDisplayName(tech) + ' (' + techCount(tech) + ')'"
                    [variant]="technologyFilter() === tech ? 'filled' : 'text'"
                    size="sm"
                    [fullWidth]="true"
                    (mfClick)="technologyFilter.set(tech)"
                  />
                }
              </div>
            </mf-card>

            <!-- Difficulty filter -->
            <mf-card variant="outlined" padding="md" class="filter-section">
              <p class="filter-label">Dificultad</p>
              <div class="difficulty-filters">
                <mf-button
                  label="Todas"
                  [variant]="difficultyFilter() === null ? 'filled' : 'text'"
                  size="sm"
                  (mfClick)="difficultyFilter.set(null)"
                />
                <mf-button
                  label="Fácil"
                  [variant]="difficultyFilter() === 'easy' ? 'filled' : 'text'"
                  size="sm"
                  (mfClick)="difficultyFilter.set('easy')"
                />
                <mf-button
                  label="Media"
                  [variant]="difficultyFilter() === 'medium' ? 'filled' : 'text'"
                  size="sm"
                  (mfClick)="difficultyFilter.set('medium')"
                />
                <mf-button
                  label="Difícil"
                  [variant]="difficultyFilter() === 'hard' ? 'filled' : 'text'"
                  size="sm"
                  (mfClick)="difficultyFilter.set('hard')"
                />
              </div>
            </mf-card>
          </aside>

          <!-- Question list -->
          <main class="main-col">
            <mf-input
              type="search"
              placeholder="Buscar preguntas..."
              leadingIcon="search"
              [value]="searchQuery()"
              [fullWidth]="true"
              (mfInput)="searchQuery.set($event)"
            />

            <div class="questions-list" role="list" aria-label="Preguntas generadas por IA">
              @for (question of pagedQuestions(); track question.title) {
                <a
                  [routerLink]="['/', question.technology, slugify(question.title)]"
                  [queryParams]="{ ai: 1 }"
                  class="question-row"
                  role="listitem"
                >
                  <div class="question-tech-icon">
                    <i
                      [class]="getDevicon(question.technology)"
                      [style.color]="getTechColor(question.technology)"
                    ></i>
                  </div>
                  <div class="question-info">
                    <span class="question-title">{{ question.title }}</span>
                    <p class="question-relevance">{{ question.relevance }}</p>
                    <div class="question-meta">
                      <span
                        class="tech-badge"
                        [style.background]="getTechColor(question.technology) + '15'"
                        [style.color]="getTechColor(question.technology)"
                      >
                        {{ techDisplayName(question.technology) }}
                      </span>
                      <span class="difficulty-badge" [class]="'badge-' + question.difficulty">
                        {{ difficultyLabel(question.difficulty) }}
                      </span>
                      @for (tag of question.tags.slice(0, 3); track tag) {
                        <span class="tag-badge">{{ tagLabel(tag) }}</span>
                      }
                    </div>
                  </div>
                  <mf-icon name="chevron_right" color="inherit" class="chevron" />
                </a>
              } @empty {
                <div class="empty-message">
                  <mf-icon name="search_off" color="inherit" />
                  <p>No se encontraron preguntas con estos filtros.</p>
                </div>
              }
            </div>

            <!-- Pagination -->
            @if (totalPages() > 1) {
              <nav class="pagination" aria-label="Paginación">
                <mf-button
                  label=""
                  variant="outlined"
                  leadingIcon="chevron_left"
                  [disabled]="currentPage() === 1"
                  (mfClick)="goToPage(currentPage() - 1)"
                />
                @for (page of pageNumbers(); track page) {
                  <mf-button
                    [label]="'' + page"
                    [variant]="page === currentPage() ? 'filled' : 'outlined'"
                    size="sm"
                    (mfClick)="goToPage(page)"
                  />
                }
                <mf-button
                  label=""
                  variant="outlined"
                  leadingIcon="chevron_right"
                  [disabled]="currentPage() === totalPages()"
                  (mfClick)="goToPage(currentPage() + 1)"
                />
              </nav>
            }
          </main>
        </div>
      </div>
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

      .page-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 32px;
      }
      .page-header-info {
        flex: 1;
      }
      .page-header-info h1 {
        margin: 0 0 4px;
        font-size: 1.5rem;
      }
      .page-desc {
        margin: 0;
        opacity: 0.7;
        font-size: 0.9rem;
      }

      /* Input section */
      mf-card {
        display: block;
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
      .results-section {
        margin-top: 8px;
      }
      .results-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
        flex-wrap: wrap;
        gap: 16px;
      }
      .results-summary h2 {
        margin: 0 0 8px;
        font-size: 1.2rem;
      }
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
      .tech-filters {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .difficulty-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      /* Main content */
      mf-input {
        margin-bottom: 20px;
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
      .question-tech-icon i {
        font-size: 22px;
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
      .chevron {
        color: var(--app-text-subtle);
        flex-shrink: 0;
      }

      .empty-message {
        text-align: center;
        padding: 48px;
        opacity: 0.5;
      }
      .empty-message mf-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 12px;
      }

      /* Pagination */
      .pagination {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin-top: 24px;
        flex-wrap: wrap;
      }

      /* Loading overlay */
      .loading-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(0, 0, 0, 0.55);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .loading-overlay-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 18px;
        background: var(--app-surface);
        border-radius: 20px;
        padding: 40px 52px;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.35);
        text-align: center;
      }
      .loading-overlay-title {
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--app-text);
        margin: 0;
      }
      .loading-overlay-desc {
        font-size: 0.85rem;
        color: var(--app-text-muted);
        margin: 0;
      }

      @media (max-width: 768px) {
        .results-layout {
          grid-template-columns: 1fr;
        }
        .sidebar {
          position: static;
          order: 2;
        }
        .main-col {
          order: 1;
        }
        .page-header {
          flex-wrap: wrap;
        }
        .results-header {
          flex-direction: column;
          align-items: flex-start;
        }
        .results-header-actions {
          flex-direction: row;
          width: 100%;
          justify-content: flex-end;
        }
      }

      /* Results header actions */
      .results-header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    `,
  ],
})
export class AiQuestionsComponent {
  private readonly aiService = inject(AiQuestionsService);
  private readonly store = inject(ContentStore);
  private readonly seo = inject(SeoService);
  readonly savedSessions = inject(SavedSessionsService);

  readonly jobDescription = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly questions = signal<AiQuestion[]>([]);
  readonly detectedTechnologies = signal<string[]>([]);

  readonly searchQuery = signal('');
  readonly technologyFilter = signal<string | null>(null);
  readonly difficultyFilter = signal<Difficulty | null>(null);
  readonly currentPage = signal(1);

  // Save state
  readonly sessionAlreadySaved = signal(false);

  readonly PAGE_SIZE = 10;
  readonly difficultyLabel = difficultyLabel;
  readonly tagLabel = getTagLabel;
  readonly slugify = generateSlug;

  private readonly techMap = computed(() => {
    const map = new Map<string, Technology>();
    for (const t of this.store.technologies()) {
      map.set(t.slug, t);
    }
    return map;
  });

  readonly hasResults = computed(() => this.questions().length > 0);

  readonly availableTechnologies = computed(() => {
    const techs = new Set(this.questions().map((q) => q.technology));
    return Array.from(techs).sort();
  });

  readonly filteredQuestions = computed(() => {
    let qs = this.questions();
    const query = this.searchQuery().toLowerCase();
    if (query) {
      qs = qs.filter(
        (q) =>
          q.title.toLowerCase().includes(query) ||
          q.tags.some((t) => t.toLowerCase().includes(query)) ||
          q.relevance.toLowerCase().includes(query),
      );
    }
    const tech = this.technologyFilter();
    if (tech) qs = qs.filter((q) => q.technology === tech);
    const diff = this.difficultyFilter();
    if (diff) qs = qs.filter((q) => q.difficulty === diff);
    return qs;
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredQuestions().length / this.PAGE_SIZE)),
  );

  readonly pagedQuestions = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * this.PAGE_SIZE;
    return this.filteredQuestions().slice(start, start + this.PAGE_SIZE);
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

  constructor() {
    this.seo.setPageMeta({
      title: 'Generar Preguntas IA',
      description:
        'Genera preguntas de entrevista personalizadas analizando ofertas de empleo con inteligencia artificial.',
      keywords: 'ia, inteligencia artificial, preguntas entrevista, oferta empleo',
      canonical: this.seo.absoluteUrl('/ai-questions'),
      robots: 'noindex,follow',
    });

    effect(() => {
      this.filteredQuestions();
      this.currentPage.set(1);
    });
  }

  techDisplayName(slug: string): string {
    return this.techMap().get(slug)?.name ?? slug;
  }

  getDevicon(slug: string): string {
    return this.techMap().get(slug)?.devicon ?? '';
  }

  getTechColor(slug: string): string {
    return this.techMap().get(slug)?.color ?? '#64748b';
  }

  techCount(slug: string): number {
    return this.questions().filter((q) => q.technology === slug).length;
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
        this.sessionAlreadySaved.set(false);
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
    this.sessionAlreadySaved.set(false);
  }

  goToPage(page: number): void {
    const total = this.totalPages();
    if (page >= 1 && page <= total) {
      this.currentPage.set(page);
    }
  }

  saveCurrentSession(): void {
    if (this.sessionAlreadySaved()) return;
    this.savedSessions.saveAiSession(
      this.jobDescription(),
      this.detectedTechnologies(),
      this.questions(),
    );
    this.sessionAlreadySaved.set(true);
  }

  loadSavedSession(session: SavedAiSession): void {
    this.jobDescription.set(session.jobDescription);
    this.questions.set(session.questions);
    this.detectedTechnologies.set(session.technologiesDetected);
    this.aiService.setActiveList(session.questions);
    this.sessionAlreadySaved.set(true);
    this.searchQuery.set('');
    this.technologyFilter.set(null);
    this.difficultyFilter.set(null);
    this.currentPage.set(1);

    // Pre-load question data for all detected technologies
    for (const q of session.questions) {
      this.store.loadQuestionsForTechnology(q.technology);
    }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
