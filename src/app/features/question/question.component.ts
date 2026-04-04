import {
  ChangeDetectionStrategy,
  Component,
  inject,
  computed,
  effect,
  untracked,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { toSignal } from '@angular/core/rxjs-interop';
import { MfSnackbarService } from 'ng-comps';
import { MfIconComponent } from 'ng-comps';
import { MfButtonComponent } from 'ng-comps';
import { MfCardComponent } from 'ng-comps';
import { ContentStore } from '../../core/stores/content.store';
import { SeoService } from '../../core/services/seo.service';
import { ProgressService } from '../../core/services/progress.service';
import { MarkdownParserService } from '../../infrastructure/markdown/markdown-parser.service';
import { AiQuestionsService } from '../../core/services/ai-questions.service';
import { buildArticleSchema, buildBreadcrumbSchema } from '../../core/seo/structured-data';

import { difficultyLabel } from '../../core/utils/difficulty';

import { AuthorCardComponent } from './sidebar/author-card.component';
import { ProgressCardComponent } from './sidebar/progress-card.component';
import { RelatedQuestionsComponent } from './sidebar/related-questions.component';
import { ActionsCardComponent } from './sidebar/actions-card.component';

@Component({
  selector: 'app-question',
  standalone: true,
  imports: [
    RouterLink,
    MfIconComponent,
    MfButtonComponent,
    MfCardComponent,
    AuthorCardComponent,
    ProgressCardComponent,
    RelatedQuestionsComponent,
    ActionsCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (question()) {
      <nav class="breadcrumb" aria-label="Ruta de navegación">
        <a routerLink="/">Inicio</a>
        <span aria-hidden="true"> &rsaquo; </span>
        @if (isAiMode()) {
          <a routerLink="/ai-questions">Preguntas IA</a>
        } @else {
          <a [routerLink]="['/', question()!.technology]">{{ technologyName() }}</a>
          <span aria-hidden="true"> &rsaquo; </span>
          <a [routerLink]="['/', question()!.technology, 'preguntas']">Preguntas</a>
        }
        <span aria-hidden="true"> &rsaquo; </span>
        <span class="breadcrumb-current">{{ question()!.title }}</span>
      </nav>

      <div class="question-layout">
        <!-- Main Content -->
        <article class="main-col" aria-labelledby="question-title">
          <header class="question-header">
            <h1 id="question-title">{{ question()!.title }}</h1>
            <p class="question-summary">{{ question()!.summary }}</p>
            <div class="question-meta-row">
              <span>{{ question()!.readingTime }} min de lectura</span>
              <span>{{ seniorityLabel(question()!.seniority) }}</span>
            </div>
            @if (question()) {}
            <div class="question-badges">
              <span class="difficulty-badge" [class]="'badge-' + question()!.difficulty">
                {{ difficultyLabel(question()!.difficulty) }}
              </span>
              @for (tag of question()!.tags; track tag) {
                <span class="tag-badge">{{ tag }}</span>
              }
            </div>
          </header>

          <div class="markdown-content" [innerHTML]="renderedContent()"></div>

          <!-- Mark as read -->
          <mf-card variant="outlined" padding="md" class="mark-read-card">
            <div class="mark-read-inner">
              <div class="mark-read-content">
                @if (isRead()) {
                  <mf-icon name="check_circle" color="inherit" class="mark-read-icon done" />
                  <div>
                    <strong>¡Sección completada!</strong>
                    <p>Ya has leído esta pregunta.</p>
                  </div>
                } @else {
                  <mf-icon
                    name="radio_button_unchecked"
                    color="inherit"
                    class="mark-read-icon pending"
                  />
                  <div>
                    <strong>¿Completaste esta sección?</strong>
                    <p>Marcarla como leída actualiza tu progreso.</p>
                  </div>
                }
              </div>
              <mf-button
                [label]="isRead() ? 'Marcar como no leída' : 'Marcar como Leída'"
                variant="filled"
                (mfClick)="toggleRead()"
              />
            </div>
          </mf-card>

          <!-- Prev / Next Navigation -->
          <nav class="question-navigation" aria-label="Navegación entre preguntas">
            @if (previousQuestion()) {
              <a
                [routerLink]="['/', previousQuestion()!.technology, previousQuestion()!.slug]"
                [queryParams]="isAiMode() ? { ai: 1 } : {}"
                class="nav-card-link"
              >
                <mf-card
                  variant="outlined"
                  [interactive]="true"
                  padding="md"
                  class="nav-card nav-prev"
                >
                  <span class="nav-direction">
                    <mf-icon name="arrow_back" size="sm" color="inherit" /> ANTERIOR
                  </span>
                  <span class="nav-title">{{ previousQuestion()!.title }}</span>
                </mf-card>
              </a>
            } @else {
              <span></span>
            }

            @if (nextQuestion()) {
              <a
                [routerLink]="['/', nextQuestion()!.technology, nextQuestion()!.slug]"
                [queryParams]="isAiMode() ? { ai: 1 } : {}"
                class="nav-card-link"
              >
                <mf-card
                  variant="outlined"
                  [interactive]="true"
                  padding="md"
                  class="nav-card nav-next"
                >
                  <span class="nav-direction">
                    SIGUIENTE <mf-icon name="arrow_forward" size="sm" color="inherit" />
                  </span>
                  <span class="nav-title">{{ nextQuestion()!.title }}</span>
                </mf-card>
              </a>
            }
          </nav>
        </article>

        <!-- Sidebar -->
        <aside class="sidebar">
          @if (question()) {
            <app-author-card [question]="question()!"></app-author-card>
          }
          <app-progress-card [question]="question()!"></app-progress-card>
          <app-related-questions
            [question]="question()!"
            [isAiMode]="isAiMode()"
          ></app-related-questions>
          <app-actions-card></app-actions-card>
        </aside>
      </div>
    } @else {
      <p>Pregunta no encontrada.</p>
      <a routerLink="/" class="back-link">Volver al inicio</a>
    }
  `,
  styles: [
    `
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
      .breadcrumb a:hover {
        text-decoration: underline;
      }
      .breadcrumb-current {
        font-weight: 600;
      }

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
      .question-summary {
        margin: 0 0 12px;
        color: var(--app-text-muted);
        font-size: 1rem;
        line-height: 1.65;
      }
      .question-meta-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 14px;
        color: var(--app-text-muted);
        font-size: 0.82rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
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
      .difficulty-badge.sm {
        font-size: 0.68rem;
        padding: 2px 7px;
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

      :host ::ng-deep .markdown-content pre code[class*='language-'] {
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

      :host ::ng-deep .markdown-content table {
        display: block;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        max-width: min(100%, calc(100vw - 16px));
        border-collapse: collapse;
        margin: 20px 0;
        font-size: 0.9rem;
        white-space: nowrap;
      }
      :host ::ng-deep .markdown-content table th,
      :host ::ng-deep .markdown-content table td {
        padding: 10px 16px;
        border: 1px solid var(--app-border);
        text-align: left;
      }
      :host ::ng-deep .markdown-content table th {
        background: var(--app-surface-variant);
        font-weight: 700;
      }
      :host ::ng-deep .markdown-content table tr:nth-child(even) td {
        background: var(--app-surface-raised);
      }

      .mark-read-card {
        display: block;
        margin: 40px 0 32px;
      }
      .mark-read-card .mark-read-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .mark-read-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .mark-read-icon.done {
        color: #43a047;
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
      .mark-read-icon.pending {
        color: #bdbdbd;
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
      .mark-read-content strong {
        display: block;
      }
      .mark-read-content p {
        margin: 2px 0 0;
        font-size: 0.82rem;
        opacity: 0.6;
      }

      .question-navigation {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        margin-top: 16px;
      }
      .nav-card-link {
        flex: 1;
        text-decoration: none;
        color: var(--app-text);
        display: block;
      }
      .nav-card {
        display: flex;
        flex-direction: column;
        gap: 6px;
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
      .nav-direction mf-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
      .nav-next {
        text-align: right;
      }
      .nav-next .nav-direction {
        justify-content: flex-end;
      }
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

      @media (max-width: 900px) {
        .question-layout {
          grid-template-columns: 1fr;
        }
        .sidebar {
          position: static;
          order: 0;
        }
        .mark-read-card {
          flex-direction: column;
          text-align: center;
        }
        .question-navigation {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class QuestionComponent {
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(ContentStore);
  private readonly seo = inject(SeoService);
  private readonly markdownParser = inject(MarkdownParserService);
  private readonly snackbar = inject(MfSnackbarService);
  readonly progress = inject(ProgressService);
  private readonly aiService = inject(AiQuestionsService);

  private readonly routeParams = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly isAiMode = computed(() => this.queryParams().get('ai') === '1');

  readonly question = computed(() => {
    const tech = this.routeParams().get('technology') ?? '';
    const slug = this.routeParams().get('slug') ?? '';
    return this.store.getQuestion(tech, slug);
  });

  readonly technologyName = computed(() => {
    const tech = this.question()?.technology ?? '';
    return this.store.technologies().find((t) => t.slug === tech)?.name ?? tech;
  });

  readonly renderedContent = computed(() => {
    const q = this.question();
    if (!q) return '';
    return this.markdownParser.renderMarkdown(q.content);
  });

  readonly isRead = computed(() => {
    const q = this.question();
    return q ? this.progress.isRead(q.id) : false;
  });

  readonly previousQuestion = computed(() => {
    const q = this.question();
    if (!q) return null;
    if (this.isAiMode()) {
      const list = this.aiService.activeList();
      const idx = list.findIndex((x) => x.slug === q.slug && x.technology === q.technology);
      return idx > 0 ? list[idx - 1] : null;
    }
    const questions = this.store.getQuestionsByTechnology(q.technology);
    const idx = questions.findIndex((x) => x.slug === q.slug);
    return idx > 0 ? questions[idx - 1] : null;
  });

  readonly nextQuestion = computed(() => {
    const q = this.question();
    if (!q) return null;
    if (this.isAiMode()) {
      const list = this.aiService.activeList();
      const idx = list.findIndex((x) => x.slug === q.slug && x.technology === q.technology);
      return idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
    }
    const questions = this.store.getQuestionsByTechnology(q.technology);
    const idx = questions.findIndex((x) => x.slug === q.slug);
    return idx < questions.length - 1 ? questions[idx + 1] : null;
  });

  readonly difficultyLabel = difficultyLabel;
  readonly currentQuestionUrl = computed(() => {
    const q = this.question();
    return q ? this.seo.absoluteUrl(`/${q.technology}/${q.slug}`) : this.seo.absoluteUrl('/');
  });

  constructor() {
    effect(() => {
      const tech = this.routeParams().get('technology') ?? '';
      if (!this.store.questionsByTechnology().has(tech)) {
        untracked(() => this.store.loadQuestionsForTechnology(tech));
      }
      const q = this.question();
      if (q) {
        this.seo.setPageMeta({
          title: q.title,
          description: q.summary,
          canonical: this.currentQuestionUrl(),
          type: 'article',
          robots: q.isIndexable && !this.isAiMode() ? 'index,follow' : 'noindex,follow',
          modifiedTime: q.lastReviewed,
          schema: this.isAiMode()
            ? undefined
            : [
                buildBreadcrumbSchema([
                  { name: 'Inicio', url: this.seo.absoluteUrl('/') },
                  { name: this.technologyName(), url: this.seo.absoluteUrl(`/${q.technology}`) },
                  {
                    name: 'Preguntas',
                    url: this.seo.absoluteUrl(`/${q.technology}/preguntas`),
                  },
                  { name: q.title, url: this.currentQuestionUrl() },
                ]),
                buildArticleSchema({
                  headline: q.title,
                  description: q.summary,
                  url: this.currentQuestionUrl(),
                  keywords: [q.technology, ...q.tags, 'entrevista tecnica'],
                  authorName: q.author,
                  authorUrl: q.authorUrl,
                  dateModified: q.lastReviewed,
                }),
              ],
          keywords: `${q.technology}, ${q.title}, ${q.tags.join(', ')}, entrevista técnica`,
        });
      }
    });
  }

  seniorityLabel(value: string): string {
    switch (value) {
      case 'junior':
        return 'Junior';
      case 'senior':
        return 'Senior';
      default:
        return 'Mid';
    }
  }

  toggleRead(): void {
    const q = this.question();
    if (q) {
      this.progress.toggleRead(q.id);
      const msg = this.progress.isRead(q.id)
        ? '¡Pregunta marcada como leída!'
        : 'Pregunta marcada como no leída';
      this.snackbar.info(msg, 'Cerrar');
    }
  }
}
