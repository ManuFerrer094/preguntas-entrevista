import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  computed,
  effect,
  untracked,
  PLATFORM_ID,
  ViewChild,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MfIconComponent, MfProgressSpinnerComponent, MfButtonComponent, MfSelectComponent, MfSelectOption, MfInputComponent, MfTextareaComponent } from 'ng-comps';
import { MatStepperModule } from '@angular/material/stepper';
import { ContentStore } from '../../core/stores/content.store';
import { GitHubAuthService } from '../../core/services/github-auth.service';
import { MarkdownParserService } from '../../infrastructure/markdown/markdown-parser.service';
import { TECHNOLOGY_TAGS } from './technology-tags';

@Component({
  selector: 'app-contribute',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatStepperModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="breadcrumb" aria-label="Ruta de navegación">
      <a routerLink="/">Inicio</a>
      <span aria-hidden="true"> &rsaquo; </span>
      <span>Contribuir</span>
    </nav>

    <header class="page-header">
      <div class="page-header-info">
        <h1>Contribuir una Pregunta</h1>
        <p class="page-desc">
          Comparte tu conocimiento con la comunidad. Tu pregunta será revisada y, si es aprobada,
          aparecerá en el sitio con tu nombre como autor.
        </p>
      </div>
    </header>

    <!-- Success state -->
    @if (prUrl()) {
      <div class="success-card">
        <mf-icon name="check_circle" color="inherit" class="success-icon" />
        <h2>¡Contribución enviada!</h2>
        <p>Tu pregunta ha sido enviada para revisión. Puedes seguir el estado en GitHub:</p>
        <a [href]="prUrl()" target="_blank" rel="noopener noreferrer" class="pr-link">
          <mf-icon name="open_in_new" color="inherit" />
          Ver Pull Request
        </a>
        <button class="reset-btn" (click)="resetForm()">
          <mf-icon name="add" color="inherit" />
          Enviar otra pregunta
        </button>
      </div>
    } @else if (authService.loading()) {
      <div class="login-card">
        <mf-progress-spinner mode="indeterminate" [diameter]="40" />
        <p style="margin-top: 16px; opacity: 0.7">Autenticando con GitHub...</p>
      </div>
    } @else if (!authService.isAuthenticated()) {
      <div class="login-card">
        <svg class="github-logo" viewBox="0 0 16 16" fill="currentColor" width="56" height="56">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
        <h2>Inicia sesión con GitHub</h2>
        <p>Para contribuir una pregunta necesitas autenticarte con tu cuenta de GitHub.<br/>
           La Pull Request se creará bajo tu nombre de usuario.</p>
        @if (authService.error()) {
          <div class="error-message" style="margin: 16px 0 0; justify-content: center">
            <mf-icon name="error_outline" color="inherit" />
            <p>{{ authService.error() }}</p>
          </div>
        }
        <button class="github-login-btn" (click)="authService.login()">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          Iniciar sesión con GitHub
        </button>
      </div>
    } @else {
      <div class="user-bar">
        <img [src]="authService.user()!.avatarUrl" [alt]="authService.user()!.username" class="user-avatar" />
        <div class="user-info">
          <span class="user-name">{{ authService.user()!.name }}</span>
          <span class="user-handle">&#64;{{ authService.user()!.username }}</span>
        </div>
        <button class="logout-btn" (click)="authService.logout()" type="button">
          <mf-icon name="logout" color="inherit" />
          Cerrar sesión
        </button>
      </div>

      <mat-stepper [linear]="true" #stepper class="contribute-stepper">

        <!-- ── Step 1: Tecnología, título, dificultad y tags ────────────── -->
        <mat-step [stepControl]="step1">
          <ng-template matStepLabel>Tecnología y detalles</ng-template>

          <div class="step-content">
            <div class="field">
              <mf-select
                label="Tecnología"
                placeholder="Selecciona una tecnología"
                [options]="technologyOptions()"
                [value]="step1.controls.technology.value"
                [error]="step1.controls.technology.touched && step1.controls.technology.errors?.['required'] ? 'Selecciona una tecnología' : ''"
                [fullWidth]="true"
                (mfSelectionChange)="onTechnologyChange($event)"
              />
            </div>

            <div class="field-row">
              <div class="field field-grow">
                <mf-input
                  label="Título de la pregunta"
                  placeholder="Ej: ¿Qué es el Virtual DOM en React?"
                  [value]="step1.controls.title.value"
                  [error]="step1.controls.title.touched && step1.controls.title.errors?.['required'] ? 'El título es obligatorio' : ''"
                  [fullWidth]="true"
                  (mfInput)="onTitleInput($event)"
                  (mfBlur)="step1.controls.title.markAsTouched()"
                />
              </div>
              <div class="field field-sm">
                <mf-select
                  label="Dificultad"
                  placeholder="Nivel"
                  [options]="difficultyOptions"
                  [value]="step1.controls.difficulty.value"
                  [error]="step1.controls.difficulty.touched && step1.controls.difficulty.errors?.['required'] ? 'Selecciona una dificultad' : ''"
                  (mfSelectionChange)="onDifficultyChange($event)"
                />
              </div>
            </div>

            <div class="field">
              <label class="field-label">Tags <span class="label-hint">(opcional)</span></label>
              @if (availableTags().length > 0) {
                <div class="tags-selector" role="group" aria-label="Selecciona los tags de la pregunta">
                  @for (tag of availableTags(); track tag) {
                    <button type="button"
                            class="tag-chip"
                            [class.tag-chip--selected]="isTagSelected(tag)"
                            [attr.aria-pressed]="isTagSelected(tag)"
                            (click)="toggleTag(tag)">
                      {{ tag }}
                    </button>
                  }
                </div>
              } @else {
                <p class="tags-placeholder">Selecciona una tecnología para ver los tags disponibles</p>
              }
            </div>
          </div>

          <div class="step-actions">
            <button class="step-btn step-btn--primary" matStepperNext
                    [disabled]="step1.invalid">
              Siguiente
              <mf-icon name="arrow_forward" size="sm" color="inherit" />
            </button>
          </div>
        </mat-step>

        <!-- ── Step 2: Escribir y previsualizar ─────────────────────────── -->
        <mat-step [stepControl]="step2">
          <ng-template matStepLabel>Escribir y previsualizar</ng-template>

          <div class="step-content">
            <section class="editor-shell">
              <div class="editor-panel">
                <div class="panel-head">
                  <span class="panel-title">Escribir</span>
                  <span class="char-count">{{ contentValue().length }} / 15.000</span>
                </div>

                <div class="editor-toolbar" role="toolbar" aria-label="Controles de formato markdown">
                  <button type="button" class="tool-btn" (click)="applyInlineWrap('**', '**')" title="Negrita">
                    <mf-icon name="format_bold" color="inherit" />
                  </button>
                  <button type="button" class="tool-btn" (click)="applyInlineWrap('*', '*')" title="Cursiva">
                    <mf-icon name="format_italic" color="inherit" />
                  </button>
                  <button type="button" class="tool-btn" (click)="applyInlineCode()" title="Código inline">
                    <mf-icon name="code" color="inherit" />
                  </button>
                  <button type="button" class="tool-btn" (click)="applyBlockPrefix('## ')" title="Título H2">
                    <mf-icon name="title" color="inherit" />
                  </button>
                  <button type="button" class="tool-btn" (click)="applyBlockPrefix('- ')" title="Lista">
                    <mf-icon name="format_list_bulleted" color="inherit" />
                  </button>
                  <button type="button" class="tool-btn" (click)="applyBlockPrefix('1. ')" title="Lista numerada">
                    <mf-icon name="format_list_numbered" color="inherit" />
                  </button>
                  <button type="button" class="tool-btn" (click)="applyBlockPrefix('> ')" title="Cita">
                    <mf-icon name="format_quote" color="inherit" />
                  </button>
                  <button type="button" class="tool-btn" (click)="insertLink()" title="Enlace">
                    <mf-icon name="link" color="inherit" />
                  </button>
                  <button type="button" class="tool-btn" (click)="insertCodeBlock()" title="Bloque de código">
                    <mf-icon name="data_object" color="inherit" />
                  </button>
                </div>

                <textarea
                  #editorTextarea
                  [formControl]="step2.controls.content"
                  class="content-textarea"
                  placeholder="Escribe tu respuesta en Markdown..."
                  rows="16"
                ></textarea>

                @if (step2.controls.content.touched && step2.controls.content.errors?.['required']) {
                  <span class="field-error field-error--padded">El contenido es obligatorio</span>
                }
              </div>

              <div class="preview-panel">
                <div class="panel-head">
                  <span class="panel-title">Preview</span>
                  <span class="md-hint">Render en tiempo real</span>
                </div>

                <div class="preview-frontmatter">
                  <code>
                    ---<br/>
                    title: {{ step1.controls.title.value || 'Tu título aqui' }}<br/>
                    difficulty: {{ step1.controls.difficulty.value || 'medium' }}<br/>
                    tags: [{{ step1.controls.tags.value || step1.controls.technology.value || 'tag1, tag2' }}]<br/>
                    author: {{ authService.user()!.name }}<br/>
                    authorUrl: "https://github.com/{{ authService.user()!.username }}"<br/>
                    ---
                  </code>
                </div>

                <div class="preview-box">
                  @if (contentValue().trim()) {
                    <div class="markdown-content" [innerHTML]="renderedContent()"></div>
                  } @else {
                    <p class="preview-empty">Empieza a escribir para ver la vista previa</p>
                  }
                </div>
              </div>
            </section>
          </div>

          <div class="step-actions">
            <button class="step-btn step-btn--outline" matStepperPrev>
              <mf-icon name="arrow_back" size="sm" color="inherit" />
              Atrás
            </button>
            <button class="step-btn step-btn--primary" matStepperNext
                    [disabled]="step2.invalid">
              Siguiente
              <mf-icon name="arrow_forward" size="sm" color="inherit" />
            </button>
          </div>
        </mat-step>

        <!-- ── Step 3: Enviar a revisión ─────────────────────────────────── -->
        <mat-step>
          <ng-template matStepLabel>Enviar a revisión</ng-template>

          <div class="step-content">
            <div class="review-card">
              <h3 class="review-title">Resumen de tu contribución</h3>

              <div class="review-grid">
                <div class="review-item">
                  <span class="review-label">Tecnología</span>
                  <span class="review-value">{{ step1.controls.technology.value }}</span>
                </div>
                <div class="review-item">
                  <span class="review-label">Dificultad</span>
                  <span class="review-value review-badge" [class]="'badge-' + step1.controls.difficulty.value">
                    {{ difficultyLabel(step1.controls.difficulty.value) }}
                  </span>
                </div>
                <div class="review-item review-item--full">
                  <span class="review-label">Título</span>
                  <span class="review-value">{{ step1.controls.title.value }}</span>
                </div>
                @if (step1.controls.tags.value) {
                  <div class="review-item review-item--full">
                    <span class="review-label">Tags</span>
                    <div class="review-tags">
                      @for (tag of selectedTags(); track tag) {
                        <span class="tag-chip tag-chip--selected tag-chip--sm">{{ tag }}</span>
                      }
                    </div>
                  </div>
                }
                <div class="review-item review-item--full">
                  <span class="review-label">Contenido</span>
                  <span class="review-value review-value--muted">{{ contentValue().length }} caracteres escritos</span>
                </div>
              </div>
            </div>

            @if (error()) {
              <div class="error-message">
                <mf-icon name="error_outline" color="inherit" />
                <p>{{ error() }}</p>
              </div>
            }
          </div>

          <div class="step-actions step-actions--submit">
            <button class="step-btn step-btn--outline" matStepperPrev [disabled]="submitting()">
              <mf-icon name="arrow_back" size="sm" color="inherit" />
              Atrás
            </button>
            <button type="button" class="submit-btn" (click)="onSubmit()"
                    [disabled]="submitting()">
              @if (submitting()) {
                <mf-progress-spinner mode="indeterminate" [diameter]="20" />
                Enviando...
              } @else {
                <mf-icon name="send" color="inherit" />
                Enviar para revisión
              }
            </button>
          </div>
        </mat-step>

      </mat-stepper>
    }
  `,
  styles: [`
    :host {
      display: block;
      max-width: 1100px;
      margin: 0 auto;
      padding-bottom: 48px;
    }

    .breadcrumb {
      font-size: 0.85rem;
      margin-bottom: 24px;
      color: var(--app-text-muted);
    }
    .breadcrumb a {
      color: var(--app-primary);
      text-decoration: none;
    }
    .breadcrumb a:hover { text-decoration: underline; }

    .page-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 32px;
    }

    .page-header-info h1 {
      margin: 0 0 6px;
      font-size: 1.5rem;
      font-weight: 700;
    }
    .page-desc {
      margin: 0;
      font-size: 0.95rem;
      color: var(--app-text-muted);
      line-height: 1.6;
      max-width: 600px;
    }

    /* Login card */
    .login-card {
      text-align: center;
      padding: 48px 24px;
      border: 1px solid var(--app-border);
      border-radius: 18px;
      background: var(--app-surface);
      box-shadow: var(--app-shadow-sm);
    }
    .login-card h2 { margin: 16px 0 8px; }
    .login-card p { color: var(--app-text-muted); margin: 0 0 24px; line-height: 1.6; }
    .github-logo { opacity: 0.8; }
    .github-login-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 14px 32px;
      background: #24292e;
      color: white;
      border: none;
      border-radius: 12px;
      font-family: inherit;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.15s;
    }
    .github-login-btn:hover { opacity: 0.85; transform: translateY(-1px); }

    /* User bar */
    .user-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      border: 1px solid var(--app-border);
      border-radius: 14px;
      margin-bottom: 24px;
      background: var(--app-surface);
      box-shadow: var(--app-shadow-sm);
    }
    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }
    .user-info { display: flex; flex-direction: column; flex: 1; }
    .user-name { font-weight: 600; font-size: 0.95rem; }
    .user-handle { font-size: 0.82rem; color: var(--app-text-muted); }
    .logout-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border: 1px solid var(--app-border);
      border-radius: 8px;
      background: transparent;
      font-family: inherit;
      font-size: 0.82rem;
      cursor: pointer;
      color: var(--app-text);
      transition: background 0.15s;
    }
    .logout-btn:hover { background: var(--app-surface-raised); }

    /* ── Stepper theming ─────────────────────────────────────────────── */
    .contribute-stepper {
      --mat-stepper-container-color: transparent;
      --mat-stepper-header-hover-state-layer-color: transparent;
      --mat-stepper-header-focus-state-layer-color: color-mix(in srgb, var(--app-primary) 10%, transparent);
      --mat-stepper-line-color: var(--app-border);
      background: transparent;
    }

    :host ::ng-deep .contribute-stepper .mat-stepper-horizontal-line {
      border-top-color: var(--app-border);
    }

    :host ::ng-deep .contribute-stepper .mat-step-header {
      border-radius: 12px;
    }

    :host ::ng-deep .contribute-stepper .mat-step-header .mat-step-icon {
      background-color: var(--app-border);
      color: var(--app-text-muted);
    }

    :host ::ng-deep .contribute-stepper .mat-step-header .mat-step-icon-selected,
    :host ::ng-deep .contribute-stepper .mat-step-header .mat-step-icon-state-edit,
    :host ::ng-deep .contribute-stepper .mat-step-header .mat-step-icon-state-done {
      background-color: var(--app-primary);
      color: var(--app-on-primary);
    }

    :host ::ng-deep .contribute-stepper .mat-step-header .mat-step-label {
      color: var(--app-text-muted);
      font-family: inherit;
    }

    :host ::ng-deep .contribute-stepper .mat-step-header .mat-step-label.mat-step-label-active {
      color: var(--app-text);
      font-weight: 600;
    }

    :host ::ng-deep .contribute-stepper .mat-horizontal-stepper-header-container {
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 14px;
      padding: 8px 16px;
      margin-bottom: 20px;
      box-shadow: var(--app-shadow-sm);
    }

    :host ::ng-deep .contribute-stepper .mat-horizontal-content-container {
      padding: 0;
      overflow: visible;
    }

    /* ── Step content ─────────────────────────────────────────────────── */
    .step-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 4px 0 20px;
    }

    .step-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-top: 8px;
    }
    .step-actions--submit {
      justify-content: space-between;
    }

    /* ── Form fields ──────────────────────────────────────────────────── */
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field-row { display: flex; gap: 16px; align-items: flex-start; }
    .field-grow { flex: 1; }
    .field-sm { min-width: 160px; }
    .mat-fullwidth { width: 100%; }

    .field-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--app-text);
      margin-bottom: 4px;
    }
    .label-hint {
      font-weight: 400;
      font-size: 0.8rem;
      opacity: 0.55;
    }

    .field-error {
      font-size: 0.78rem;
      color: #d32f2f;
      display: block;
    }
    .field-error--padded {
      padding: 4px 16px 8px;
    }

    /* ── Tags ─────────────────────────────────────────────────────────── */
    .tags-selector {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 2px;
    }

    .tag-chip {
      padding: 5px 12px;
      border: 1px solid var(--app-border);
      border-radius: 20px;
      background: var(--app-surface);
      color: var(--app-text);
      font-family: inherit;
      font-size: 0.82rem;
      cursor: pointer;
      transition: all 0.15s ease;
      user-select: none;
    }
    .tag-chip:hover {
      border-color: var(--app-primary);
      color: var(--app-primary);
      background: var(--app-surface-raised);
    }
    .tag-chip--selected {
      background: var(--app-primary);
      color: var(--app-on-primary);
      border-color: var(--app-primary);
    }
    .tag-chip--selected:hover {
      opacity: 0.85;
      color: var(--app-on-primary);
    }
    .tag-chip--sm {
      padding: 3px 10px;
      font-size: 0.78rem;
      cursor: default;
    }
    .tags-placeholder {
      font-size: 0.85rem;
      color: var(--app-text-muted);
      margin: 4px 0 0;
      font-style: italic;
    }

    /* ── Editor shell ─────────────────────────────────────────────────── */
    .editor-shell {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
    }

    .editor-panel,
    .preview-panel {
      border: 1px solid var(--app-border);
      border-radius: 14px;
      background: var(--app-surface);
      box-shadow: var(--app-shadow-sm);
      overflow: hidden;
      min-width: 0;
    }

    .panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--app-border);
      background: var(--app-surface-raised);
    }
    .panel-title {
      font-size: 0.95rem;
      font-weight: 700;
    }

    .editor-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--app-border);
      background: var(--app-surface);
    }

    .tool-btn {
      width: 34px;
      height: 34px;
      border: 1px solid var(--app-border);
      border-radius: 8px;
      background: var(--app-surface);
      color: var(--app-text);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .tool-btn:hover {
      border-color: var(--app-primary);
      color: var(--app-primary);
      background: var(--app-surface-raised);
    }
    .tool-btn mf-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .content-textarea {
      width: 100%;
      min-height: 440px;
      border: none;
      border-radius: 0;
      resize: vertical;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 0.88rem;
      line-height: 1.7;
      padding: 16px;
      background: var(--app-surface);
      color: var(--app-text);
      outline: none;
    }

    .char-count,
    .md-hint {
      font-size: 0.78rem;
      color: var(--app-text-muted);
    }

    .preview-box {
      min-height: 440px;
      max-height: 640px;
      overflow: auto;
      padding: 16px;
      background: var(--app-surface);
    }
    .preview-frontmatter {
      background: #263238;
      color: #b0bec5;
      padding: 12px 14px;
      margin: 12px;
      border-radius: 10px;
      font-size: 0.82rem;
      line-height: 1.8;
    }

    .preview-empty {
      text-align: center;
      color: var(--app-text-muted);
      padding: 120px 0;
    }

    .markdown-content {
      line-height: 1.75;
      font-size: 0.96rem;
    }
    :host ::ng-deep .markdown-content pre {
      background: #1e293b;
      border-radius: 10px;
      padding: 16px;
      overflow-x: auto;
      margin: 14px 0;
      color-scheme: normal;
    }
    :host ::ng-deep .markdown-content pre code.hljs {
      background: transparent;
      padding: 0;
      color-scheme: normal;
    }
    :host ::ng-deep .markdown-content p code {
      background: var(--app-surface-variant);
      color: var(--app-text);
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.88em;
    }
    :host ::ng-deep .markdown-content ul,
    :host ::ng-deep .markdown-content ol {
      padding-left: 20px;
    }
    :host ::ng-deep .markdown-content blockquote {
      border-left: 4px solid var(--app-primary);
      margin: 10px 0;
      padding: 6px 12px;
      background: var(--app-surface-raised);
      color: var(--app-text-muted);
    }

    /* ── Review card (step 3) ─────────────────────────────────────────── */
    .review-card {
      border: 1px solid var(--app-border);
      border-radius: 14px;
      padding: 24px;
      background: var(--app-surface);
      box-shadow: var(--app-shadow-sm);
    }
    .review-title {
      margin: 0 0 20px;
      font-size: 1rem;
      font-weight: 700;
    }
    .review-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .review-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .review-item--full {
      grid-column: 1 / -1;
    }
    .review-label {
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--app-text-muted);
    }
    .review-value {
      font-size: 0.95rem;
      color: var(--app-text);
    }
    .review-value--muted {
      color: var(--app-text-muted);
      font-style: italic;
    }
    .review-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.82rem;
      font-weight: 600;
      width: fit-content;
    }
    .badge-easy   { background: color-mix(in srgb, #4caf50 15%, transparent); color: #2e7d32; }
    .badge-medium { background: color-mix(in srgb, #ff9800 15%, transparent); color: #e65100; }
    .badge-hard   { background: color-mix(in srgb, #f44336 15%, transparent); color: #b71c1c; }

    .review-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 2px;
    }

    /* ── Error ────────────────────────────────────────────────────────── */
    .error-message {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 18px;
      background: color-mix(in srgb, #ffebee 70%, var(--app-surface));
      border: 1px solid #ef9a9a;
      border-radius: 10px;
      color: #c62828;
      font-size: 0.9rem;
    }

    /* ── Submit button ────────────────────────────────────────────────── */
    .submit-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 28px;
      background: linear-gradient(135deg, var(--app-primary), var(--app-primary-hover));
      color: var(--app-on-primary);
      border: none;
      border-radius: 12px;
      font-family: inherit;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.15s;
    }
    .submit-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Success card ─────────────────────────────────────────────────── */
    .success-card {
      text-align: center;
      padding: 48px 24px;
      border: 1px solid var(--app-border);
      border-radius: 18px;
      background: var(--app-surface);
      box-shadow: var(--app-shadow-sm);
    }
    .success-icon { font-size: 56px; width: 56px; height: 56px; color: #43a047; }
    .success-card h2 { margin: 12px 0 8px; }
    .success-card p { opacity: 0.7; margin: 0 0 20px; }
    .pr-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: var(--app-primary);
      color: var(--app-on-primary);
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.95rem;
      margin-bottom: 16px;
    }
    .pr-link:hover { opacity: 0.85; }
    .reset-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 16px auto 0;
      padding: 10px 20px;
      border: 1px solid var(--app-border);
      border-radius: 10px;
      background: transparent;
      font-family: inherit;
      font-size: 0.9rem;
      cursor: pointer;
      color: var(--app-text);
    }

    /* ── Responsive ───────────────────────────────────────────────────── */
    @media (max-width: 980px) {
      .editor-shell { grid-template-columns: 1fr; }
      .preview-box { max-height: unset; }
      .review-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 700px) {
      .field-row { flex-direction: column; gap: 0; }
      .field-sm { min-width: unset; width: 100%; }
      .page-header { flex-direction: column; }
      .step-actions { flex-wrap: wrap; }
      .submit-btn { flex: 1; justify-content: center; }
      .user-bar {
        flex-wrap: wrap;
        justify-content: center;
        text-align: center;
      }
      .user-info { flex: 0 0 100%; }
    }
  `],
})
export class ContributeComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly store = inject(ContentStore);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly markdownParser = inject(MarkdownParserService);

  readonly authService = inject(GitHubAuthService);
  readonly technologies = this.store.technologies;
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly prUrl = signal('');

  readonly selectedTags = signal<string[]>([]);

  @ViewChild('editorTextarea')
  private editorTextarea?: ElementRef<HTMLTextAreaElement>;

  readonly step1 = this.fb.nonNullable.group({
    technology: ['', [Validators.required]],
    title: ['', [Validators.required, Validators.maxLength(200)]],
    difficulty: ['', [Validators.required]],
    tags: [''],
  });

  readonly step2 = this.fb.nonNullable.group({
    content: ['', [Validators.required, Validators.maxLength(15000)]],
  });

  readonly technologyValue = toSignal(this.step1.controls.technology.valueChanges, {
    initialValue: this.step1.controls.technology.value,
  });

  readonly availableTags = computed(() => TECHNOLOGY_TAGS[this.technologyValue()] ?? []);

  readonly contentValue = toSignal(this.step2.controls.content.valueChanges, {
    initialValue: this.step2.controls.content.value,
  });

  readonly renderedContent = computed(() => {
    const content = this.contentValue().trim();
    return content ? this.markdownParser.renderMarkdown(content) : '';
  });

  readonly technologyOptions = computed<MfSelectOption[]>(() =>
    this.technologies().map(t => ({ value: t.slug, label: t.name }))
  );

  readonly difficultyOptions: MfSelectOption[] = [
    { value: 'easy', label: 'Fácil' },
    { value: 'medium', label: 'Media' },
    { value: 'hard', label: 'Difícil' },
  ];

  onTechnologyChange(value: any): void {
    let v: string;
    if (Array.isArray(value)) v = String(value[0]);
    else if (value && typeof value === 'object') v = String((value as any).value ?? (value as any).target?.value ?? value);
    else v = String(value ?? '');
    this.step1.controls.technology.setValue(v);
    this.step1.controls.technology.markAsTouched();
  }

  onDifficultyChange(value: any): void {
    let v: string;
    if (Array.isArray(value)) v = String(value[0]);
    else if (value && typeof value === 'object') v = String((value as any).value ?? (value as any).target?.value ?? value);
    else v = String(value ?? '');
    this.step1.controls.difficulty.setValue(v);
    this.step1.controls.difficulty.markAsTouched();
  }

  onTitleInput(event: any): void {
    const val = typeof event === 'string' ? event : (event?.target?.value ?? (event?.value ?? ''));
    this.step1.controls.title.setValue(val);
  }

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const code = this.route.snapshot.queryParams['code'];
      if (code) {
        this.authService.exchangeCode(code);
      }
    }

    effect(() => {
      this.technologyValue();
      untracked(() => {
        this.selectedTags.set([]);
        this.step1.controls.tags.setValue('');
      });
    });
  }

  difficultyLabel(value: string): string {
    const map: Record<string, string> = { easy: 'Fácil', medium: 'Media', hard: 'Difícil' };
    return map[value] ?? value;
  }

  onSubmit(): void {
    if (this.step1.invalid || this.step2.invalid || this.submitting() || !this.authService.isAuthenticated()) return;

    this.submitting.set(true);
    this.error.set('');

    const value = { ...this.step1.getRawValue(), ...this.step2.getRawValue() };
    const token = this.authService.user()!.token;
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http
      .post<{ prUrl: string }>('/api/submit-question', value, { headers })
      .subscribe({
        next: (res) => {
          this.prUrl.set(res.prUrl);
          this.submitting.set(false);
        },
        error: (err) => {
          const msg =
            err.error?.error ?? 'Error al enviar la pregunta. Inténtalo de nuevo.';
          this.error.set(msg);
          this.submitting.set(false);
        },
      });
  }

  applyInlineWrap(prefix: string, suffix: string): void {
    const textarea = this.editorTextarea?.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = this.step2.controls.content.value;
    const selected = value.slice(start, end) || 'texto';
    const replacement = `${prefix}${selected}${suffix}`;

    this.replaceSelection(value, start, end, replacement, start + prefix.length, start + prefix.length + selected.length);
  }

  applyInlineCode(): void {
    this.applyInlineWrap('`', '`');
  }

  applyBlockPrefix(prefix: string): void {
    const textarea = this.editorTextarea?.nativeElement;
    if (!textarea) return;

    const value = this.step2.controls.content.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const block = value.slice(start, end) || 'texto';
    const withPrefix = block
      .split('\n')
      .map((line) => `${prefix}${line}`)
      .join('\n');

    this.replaceSelection(value, start, end, withPrefix, start, start + withPrefix.length);
  }

  insertCodeBlock(): void {
    const textarea = this.editorTextarea?.nativeElement;
    if (!textarea) return;

    const value = this.step2.controls.content.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || 'const ejemplo = true;';
    const replacement = `\n\`\`\`ts\n${selected}\n\`\`\`\n`;

    this.replaceSelection(value, start, end, replacement, start + 6, start + 6 + selected.length);
  }

  insertLink(): void {
    const textarea = this.editorTextarea?.nativeElement;
    if (!textarea) return;

    const value = this.step2.controls.content.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || 'enlace';
    const replacement = `[${selected}](https://)`;

    this.replaceSelection(value, start, end, replacement, start + selected.length + 3, start + selected.length + 11);
  }

  private replaceSelection(
    value: string,
    start: number,
    end: number,
    replacement: string,
    nextStart: number,
    nextEnd: number,
  ): void {
    const nextValue = value.slice(0, start) + replacement + value.slice(end);
    this.step2.controls.content.setValue(nextValue);

    queueMicrotask(() => {
      const textarea = this.editorTextarea?.nativeElement;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(nextStart, nextEnd);
    });
  }

  toggleTag(tag: string): void {
    this.selectedTags.update(current => {
      const next = current.includes(tag)
        ? current.filter(t => t !== tag)
        : [...current, tag];
      this.step1.controls.tags.setValue(next.join(', '));
      return next;
    });
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags().includes(tag);
  }

  resetForm(): void {
    this.step1.reset({ technology: '', title: '', difficulty: '', tags: '' });
    this.step2.reset({ content: '' });
    this.prUrl.set('');
    this.error.set('');
    this.selectedTags.set([]);
  }
}
