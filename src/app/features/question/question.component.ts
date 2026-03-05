import { Component, inject, OnInit, computed, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ContentStore } from '../../core/stores/content.store';
import { SeoService } from '../../core/services/seo.service';
import { MarkdownParserService } from '../../infrastructure/markdown/markdown-parser.service';

@Component({
  selector: 'app-question',
  standalone: true,
  imports: [RouterLink, CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, MatSnackBarModule],
  template: `
    @if (question()) {
      <nav aria-label="Ruta de navegación">
        <a routerLink="/">Inicio</a>
        <span aria-hidden="true"> / </span>
        <a [routerLink]="['/', question()!.technology]">{{ technologyName() }}</a>
        <span aria-hidden="true"> / </span>
        <span>{{ question()!.title }}</span>
      </nav>

      <article id="content" aria-labelledby="question-title">
        <header class="question-header">
          <h1 id="question-title">{{ question()!.title }}</h1>
          <div class="question-actions">
            <button
              mat-icon-button
              (click)="copyLink()"
              matTooltip="Copiar enlace"
              aria-label="Copiar enlace a esta pregunta"
            >
              <mat-icon>link</mat-icon>
            </button>
          </div>
        </header>

        <div
          class="markdown-content"
          [innerHTML]="renderedContent()"
          aria-live="polite"
        ></div>
      </article>

      <nav class="question-navigation" aria-label="Navegación entre preguntas">
        @if (previousQuestion()) {
          <a
            mat-button
            [routerLink]="['/', question()!.technology, previousQuestion()!.slug]"
            class="nav-prev"
            [attr.aria-label]="'Pregunta anterior: ' + previousQuestion()!.title"
          >
            <mat-icon>navigate_before</mat-icon>
            <span class="nav-label">{{ previousQuestion()!.title }}</span>
          </a>
        } @else {
          <span></span>
        }

        @if (nextQuestion()) {
          <a
            mat-button
            [routerLink]="['/', question()!.technology, nextQuestion()!.slug]"
            class="nav-next"
            [attr.aria-label]="'Siguiente pregunta: ' + nextQuestion()!.title"
          >
            <span class="nav-label">{{ nextQuestion()!.title }}</span>
            <mat-icon>navigate_next</mat-icon>
          </a>
        }
      </nav>
    } @else {
      <p>Pregunta no encontrada.</p>
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
    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
    }
    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0;
      flex: 1;
    }
    .markdown-content {
      line-height: 1.8;
      font-size: 1.0625rem;
    }
    :host ::ng-deep .markdown-content pre {
      background: var(--mat-sys-surface-variant);
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
    }
    :host ::ng-deep .markdown-content code {
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    .question-navigation {
      display: flex;
      justify-content: space-between;
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }
    .nav-prev, .nav-next {
      display: flex;
      align-items: center;
      gap: 4px;
      max-width: 45%;
      text-decoration: none;
    }
    .nav-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `]
})
export class QuestionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  store = inject(ContentStore);
  private seo = inject(SeoService);
  private markdownParser = inject(MarkdownParserService);
  private sanitizer = inject(DomSanitizer);
  private snackBar = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);

  question = computed(() => {
    const tech = this.route.snapshot.paramMap.get('technology') ?? '';
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
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

  ngOnInit(): void {
    const tech = this.question()?.technology ?? this.route.snapshot.paramMap.get('technology') ?? '';
    if (!this.question()) {
      this.store.loadQuestionsForTechnology(tech);
    }

    const q = this.question();
    if (q) {
      this.seo.setPageMeta({
        title: q.title,
        description: q.content.slice(0, 160).replace(/[#`*]/g, ''),
        keywords: `${q.technology}, ${q.title}, entrevista técnica`
      });
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
