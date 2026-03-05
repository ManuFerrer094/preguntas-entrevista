import { Component, inject, computed, effect, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ContentStore } from '../../core/stores/content.store';
import { SeoService } from '../../core/services/seo.service';
import { ProgressService } from '../../core/services/progress.service';
import { MarkdownParserService } from '../../infrastructure/markdown/markdown-parser.service';
import { Difficulty } from '../../domain/models/question.model';

@Component({
  selector: 'app-question',
  standalone: true,
  imports: [RouterLink, CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, MatSnackBarModule],
  template: `
    @if (question()) {
      <nav class="breadcrumb" aria-label="Ruta de navegación">
        <a routerLink="/">Inicio</a>
        <span aria-hidden="true"> &rsaquo; </span>
        <a [routerLink]="['/', question()!.technology]">{{ technologyName() }}</a>
        <span aria-hidden="true"> &rsaquo; </span>
        <span class="breadcrumb-current">{{ question()!.title }}</span>
      </nav>

      <div class="question-layout">
        <!-- Main Content -->
        <article class="main-col" aria-labelledby="question-title">
          <header class="question-header">
            <h1 id="question-title">{{ question()!.title }}</h1>
            <div class="question-badges">
              <span class="difficulty-badge" [class]="'badge-' + question()!.difficulty">
                {{ difficultyLabel(question()!.difficulty) }}
              </span>
              @for (tag of question()!.tags; track tag) {
                <span class="tag-badge">{{ tag }}</span>
              }
            </div>
          </header>

          <div
            class="markdown-content"
            [innerHTML]="renderedContent()"
            aria-live="polite"
          ></div>

          <!-- Mark as read -->
          <div class="mark-read-card">
            <div class="mark-read-content">
              @if (isRead()) {
                <mat-icon class="mark-read-icon done">check_circle</mat-icon>
                <div>
                  <strong>¡Sección completada!</strong>
                  <p>Ya has leído esta pregunta.</p>
                </div>
              } @else {
                <mat-icon class="mark-read-icon pending">radio_button_unchecked</mat-icon>
                <div>
                  <strong>¿Completaste esta sección?</strong>
                  <p>Marcarla como leída actualiza tu progreso.</p>
                </div>
              }
            </div>
            <button
              mat-flat-button
              [color]="isRead() ? 'accent' : 'primary'"
              (click)="toggleRead()"
            >
              {{ isRead() ? 'Marcar como no leída' : 'Marcar como Leída' }}
            </button>
          </div>

          <!-- Prev / Next Navigation -->
          <nav class="question-navigation" aria-label="Navegación entre preguntas">
            @if (previousQuestion()) {
              <a
                [routerLink]="['/', question()!.technology, previousQuestion()!.slug]"
                class="nav-card nav-prev"
              >
                <span class="nav-direction">
                  <mat-icon>arrow_back</mat-icon> ANTERIOR
                </span>
                <span class="nav-title">{{ previousQuestion()!.title }}</span>
              </a>
            } @else {
              <span></span>
            }

            @if (nextQuestion()) {
              <a
                [routerLink]="['/', question()!.technology, nextQuestion()!.slug]"
                class="nav-card nav-next"
              >
                <span class="nav-direction">
                  SIGUIENTE <mat-icon>arrow_forward</mat-icon>
                </span>
                <span class="nav-title">{{ nextQuestion()!.title }}</span>
              </a>
            }
          </nav>
        </article>

        <!-- Sidebar -->
        <aside class="sidebar">
          <!-- Progress -->
          <div class="sidebar-card">
            <div class="sidebar-card-header">
              <mat-icon class="sidebar-icon">trending_up</mat-icon>
              <strong>Tu Progreso</strong>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" [style.width.%]="progressPct()"></div>
            </div>
            <span class="progress-detail">{{ progressPct() }}% de "{{ technologyName() }}" completado</span>
          </div>

          <!-- Related Questions -->
          <div class="sidebar-card">
            <div class="sidebar-card-header">
              <mat-icon class="sidebar-icon">quiz</mat-icon>
              <strong>Preguntas Relacionadas</strong>
            </div>
            <div class="related-list">
              @for (rq of relatedQuestions(); track rq.id) {
                <a [routerLink]="['/', question()!.technology, rq.slug]" class="related-item">
                  <span class="related-title">{{ rq.title }}</span>
                  <span class="difficulty-badge sm" [class]="'badge-' + rq.difficulty">
                    {{ difficultyLabel(rq.difficulty) }}
                  </span>
                </a>
              }
            </div>
            <a [routerLink]="['/', question()!.technology]" class="view-all-link">
              Ver todas las preguntas de {{ technologyName() }}
            </a>
          </div>

          <!-- Actions -->
          <div class="sidebar-card actions-card">
            <button
              mat-button
              (click)="copyLink()"
              class="action-btn"
            >
              <mat-icon>link</mat-icon>
              Copiar enlace
            </button>
          </div>
        </aside>
      </div>
    } @else {
      <p>Pregunta no encontrada.</p>
      <a mat-button routerLink="/">Volver al inicio</a>
    }
  `,
  styles: [`
    :host {
      display: block;
      overflow: hidden;
    }
    .breadcrumb {
      margin-bottom: 24px;
      font-size: 0.85rem;
    }
    .breadcrumb a {
      color: var(--app-primary);
      text-decoration: none;
    }
    .breadcrumb a:hover { text-decoration: underline; }
    .breadcrumb-current { font-weight: 600; }

    .question-layout {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 36px;
      align-items: start;
    }

    .main-col {
      min-width: 0;
      overflow: hidden;
    }
    .question-header {
      margin-bottom: 32px;
    }
    .question-header h1 {
      font-size: 1.85rem;
      font-weight: 800;
      margin: 0 0 14px;
      line-height: 1.25;
    }
    .question-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    .difficulty-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .difficulty-badge.sm { font-size: 0.68rem; padding: 2px 7px; }
    .badge-easy { background: #e8f5e9; color: #2e7d32; }
    .badge-medium { background: #fff3e0; color: #e65100; }
    .badge-hard { background: #fce4ec; color: #c62828; }

    .tag-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      background: var(--app-surface-variant);
      color: var(--app-text-muted);
      border: 1px solid var(--app-border);
    }

    .markdown-content {
      line-height: 1.85;
      font-size: 1.05rem;
      overflow: hidden;
    }
    :host ::ng-deep .markdown-content pre {
      background: #1e293b;
      border-radius: 12px;
      padding: 20px;
      overflow-x: auto;
      font-size: 0.9rem;
      line-height: 1.6;
      margin: 20px 0;
      max-width: min(100%, calc(100vw - 16px));
      color-scheme: normal;
    }

    :host ::ng-deep .markdown-content pre code.hljs {
      background: transparent;
      padding: 0;
      color-scheme: normal;
    }

    :host ::ng-deep .markdown-content pre code.language-javascript,
    :host ::ng-deep .markdown-content pre code.language-typescript {
      color: #ffffff !important;
    }
    :host ::ng-deep .markdown-content code {
      font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
      font-size: 1em;
    }
    :host ::ng-deep .markdown-content p code {
      background: var(--app-surface-variant);
      color: var(--app-text);
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.88em;
    }
    :host ::ng-deep .markdown-content h2,
    :host ::ng-deep .markdown-content h3 {
      margin-top: 32px;
      margin-bottom: 12px;
      font-weight: 700;
    }
    :host ::ng-deep .markdown-content ul,
    :host ::ng-deep .markdown-content ol {
      padding-left: 24px;
    }
    :host ::ng-deep .markdown-content li {
      margin-bottom: 6px;
    }

    .mark-read-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 20px 24px;
      margin: 40px 0 32px;
      border: 1px solid var(--app-border);
      border-radius: 14px;
      background: var(--app-surface);
      color: var(--app-text);
    }
    .mark-read-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .mark-read-icon.done { color: #43a047; font-size: 28px; width: 28px; height: 28px; }
    .mark-read-icon.pending { color: #bdbdbd; font-size: 28px; width: 28px; height: 28px; }
    .mark-read-content strong { display: block; }
    .mark-read-content p { margin: 2px 0 0; font-size: 0.82rem; opacity: 0.6; }

    .question-navigation {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-top: 16px;
    }
    .nav-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 16px 20px;
      border: 1px solid var(--app-border);
      border-radius: 12px;
      text-decoration: none;
      color: var(--app-text);
      background: var(--app-surface);
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .nav-card:hover {
      border-color: var(--app-primary);
      box-shadow: var(--app-shadow-sm);
    }
    .nav-direction {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      opacity: 0.5;
    }
    .nav-direction mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .nav-next { text-align: right; }
    .nav-next .nav-direction { justify-content: flex-end; }
    .nav-title {
      font-weight: 600;
      font-size: 0.92rem;
      line-height: 1.3;
    }

    .sidebar {
      position: sticky;
      top: 80px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .sidebar-card {
      border: 1px solid var(--app-border);
      border-radius: 14px;
      padding: 20px;
      background: var(--app-surface);
      color: var(--app-text);
    }
    .sidebar-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      margin-bottom: 14px;
    }
    .sidebar-icon { font-size: 20px; width: 20px; height: 20px; color: var(--app-primary); }

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

    .related-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 14px;
    }
    .related-item {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      text-decoration: none;
    }
    .related-title {
      font-size: 0.85rem;
      color: var(--app-text-muted);
      line-height: 1.4;
    }
    .related-item:hover .related-title { color: var(--app-primary); }
    .view-all-link {
      font-size: 0.82rem;
      color: var(--app-primary);
      text-decoration: none;
      font-weight: 600;
    }
    .view-all-link:hover { text-decoration: underline; }

    .actions-card { display: flex; flex-direction: column; gap: 8px; padding: 12px 16px; }
    .action-btn { justify-content: flex-start; }

    @media (max-width: 900px) {
      .question-layout {
        grid-template-columns: 1fr;
      }
      .sidebar { position: static; order: 0; }
      .mark-read-card { flex-direction: column; text-align: center; }
      .question-navigation { flex-direction: column; }
    }
  `]
})
export class QuestionComponent {
  private route = inject(ActivatedRoute);
  store = inject(ContentStore);
  private seo = inject(SeoService);
  private markdownParser = inject(MarkdownParserService);
  private sanitizer = inject(DomSanitizer);
  private snackBar = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);
  progress = inject(ProgressService);

  private routeParams = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });

  question = computed(() => {
    const tech = this.routeParams().get('technology') ?? '';
    const slug = this.routeParams().get('slug') ?? '';
    return this.store.getQuestion(tech, slug);
  });

  technologyName = computed(() => {
    const tech = this.question()?.technology ?? '';
    return this.store.technologies().find(t => t.slug === tech)?.name ?? tech;
  });

  renderedContent = computed(() => {
    const q = this.question();
    if (!q) return '';
    const html = this.markdownParser.renderMarkdown(q.content);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  isRead = computed(() => {
    const q = this.question();
    return q ? this.progress.isRead(q.id) : false;
  });

  progressPct = computed(() => {
    const q = this.question();
    if (!q) return 0;
    const allQ = this.store.getQuestionsByTechnology(q.technology);
    return this.progress.getProgressPercentage(allQ.map(x => x.id));
  });

  previousQuestion = computed(() => {
    const q = this.question();
    if (!q) return null;
    const questions = this.store.getQuestionsByTechnology(q.technology);
    const idx = questions.findIndex(x => x.slug === q.slug);
    return idx > 0 ? questions[idx - 1] : null;
  });

  nextQuestion = computed(() => {
    const q = this.question();
    if (!q) return null;
    const questions = this.store.getQuestionsByTechnology(q.technology);
    const idx = questions.findIndex(x => x.slug === q.slug);
    return idx < questions.length - 1 ? questions[idx + 1] : null;
  });

  relatedQuestions = computed(() => {
    const q = this.question();
    if (!q) return [];
    const questions = this.store.getQuestionsByTechnology(q.technology);
    return questions.filter(x => x.slug !== q.slug).slice(0, 3);
  });

  difficultyLabel(d: Difficulty): string {
    return d === 'easy' ? 'Fácil' : d === 'medium' ? 'Media' : 'Difícil';
  }

  constructor() {
    effect(() => {
      const tech = this.routeParams().get('technology') ?? '';
      if (!this.store.questionsByTechnology().has(tech)) {
        this.store.loadQuestionsForTechnology(tech);
      }
      const q = this.question();
      if (q) {
        this.seo.setPageMeta({
          title: q.title,
          description: q.content.slice(0, 160).replace(/[#`*]/g, ''),
          keywords: `${q.technology}, ${q.title}, ${q.tags.join(', ')}, entrevista técnica`
        });
      }
    });
  }

  toggleRead(): void {
    const q = this.question();
    if (q) {
      this.progress.toggleRead(q.id);
      const msg = this.progress.isRead(q.id) ? '¡Pregunta marcada como leída!' : 'Pregunta marcada como no leída';
      this.snackBar.open(msg, 'Cerrar', { duration: 2000 });
    }
  }

  copyLink(): void {
    if (isPlatformBrowser(this.platformId)) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.snackBar.open('¡Enlace copiado!', 'Cerrar', { duration: 2000 });
      });
    }
  }
}
