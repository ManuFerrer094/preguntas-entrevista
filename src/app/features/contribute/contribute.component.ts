import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ContentStore } from '../../core/stores/content.store';
import { GitHubAuthService } from '../../core/services/github-auth.service';

@Component({
  selector: 'app-contribute',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="breadcrumb" aria-label="Ruta de navegación">
      <a routerLink="/">Inicio</a>
      <span aria-hidden="true"> &rsaquo; </span>
      <span>Contribuir</span>
    </nav>

    <header class="page-header">
      <div class="page-header-icon">
        <mat-icon>edit_note</mat-icon>
      </div>
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
        <mat-icon class="success-icon">check_circle</mat-icon>
        <h2>¡Contribución enviada!</h2>
        <p>Tu pregunta ha sido enviada para revisión. Puedes seguir el estado en GitHub:</p>
        <a [href]="prUrl()" target="_blank" rel="noopener noreferrer" class="pr-link">
          <mat-icon>open_in_new</mat-icon>
          Ver Pull Request
        </a>
        <button class="reset-btn" (click)="resetForm()">
          <mat-icon>add</mat-icon>
          Enviar otra pregunta
        </button>
      </div>
    } @else if (authService.loading()) {
      <div class="login-card">
        <mat-spinner diameter="40"></mat-spinner>
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
            <mat-icon>error_outline</mat-icon>
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
      <!-- Authenticated user bar -->
      <div class="user-bar">
        <img [src]="authService.user()!.avatarUrl" [alt]="authService.user()!.username" class="user-avatar" />
        <div class="user-info">
          <span class="user-name">{{ authService.user()!.name }}</span>
          <span class="user-handle">&#64;{{ authService.user()!.username }}</span>
        </div>
        <button class="logout-btn" (click)="authService.logout()" type="button">
          <mat-icon>logout</mat-icon>
          Cerrar sesión
        </button>
      </div>

      <!-- Form -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="contribute-form" autocomplete="off">
        <div class="form-grid">
          <!-- Question section -->
          <fieldset class="form-section form-section-full">
            <legend>La pregunta</legend>

            <div class="field">
              <label for="technology">Tecnología *</label>
              <select id="technology" formControlName="technology">
                <option value="" disabled>Selecciona una tecnología</option>
                @for (tech of technologies(); track tech.id) {
                  <option [value]="tech.slug">{{ tech.name }}</option>
                }
              </select>
              @if (form.controls.technology.touched && form.controls.technology.errors?.['required']) {
                <span class="field-error">Selecciona una tecnología</span>
              }
            </div>

            <div class="field-row">
              <div class="field field-grow">
                <label for="title">Título de la pregunta *</label>
                <input id="title" type="text" formControlName="title"
                       placeholder="Ej: ¿Qué es el Virtual DOM en React?" maxlength="200" />
                @if (form.controls.title.touched && form.controls.title.errors?.['required']) {
                  <span class="field-error">El título es obligatorio</span>
                }
              </div>
              <div class="field">
                <label for="difficulty">Dificultad *</label>
                <select id="difficulty" formControlName="difficulty">
                  <option value="" disabled>Nivel</option>
                  <option value="easy">Fácil</option>
                  <option value="medium">Media</option>
                  <option value="hard">Difícil</option>
                </select>
              </div>
            </div>

            <div class="field">
              <label for="tags">Tags <span class="label-hint">(separados por coma)</span></label>
              <input id="tags" type="text" formControlName="tags"
                     placeholder="Ej: react, hooks, performance" maxlength="300" />
            </div>
          </fieldset>
        </div>

        <!-- Content -->
        <fieldset class="form-section form-section-full">
          <legend>Contenido de la respuesta *</legend>

          <div class="content-tabs">
            <button type="button" class="tab-btn" [class.active]="activeTab() === 'write'"
                    (click)="activeTab.set('write')">
              <mat-icon>edit</mat-icon> Escribir
            </button>
            <button type="button" class="tab-btn" [class.active]="activeTab() === 'preview'"
                    (click)="activeTab.set('preview')">
              <mat-icon>visibility</mat-icon> Preview
            </button>
          </div>

          @if (activeTab() === 'write') {
            <textarea id="content" formControlName="content" class="content-textarea"
                      placeholder="Escribe tu respuesta en Markdown...&#10;&#10;Puedes usar:&#10;- **Negritas** y *cursivas*&#10;- Bloques de código con \`\`\`&#10;- Listas con - o 1.&#10;- Enlaces [texto](url)"
                      rows="14"></textarea>
            <div class="content-footer">
              <span class="char-count">{{ form.controls.content.value.length }} / 15.000</span>
              <span class="md-hint">Markdown soportado</span>
            </div>
          } @else {
            <div class="preview-box">
              @if (form.controls.content.value.trim()) {
                <div class="preview-frontmatter">
                  <code>
                    ---<br/>
                    title: "{{ form.controls.title.value }}"<br/>
                    difficulty: {{ form.controls.difficulty.value }}<br/>
                    tags: [{{ form.controls.tags.value || form.controls.technology.value }}]<br/>
                    author: "{{ authService.user()!.name }}"<br/>
                    authorUrl: "https://github.com/{{ authService.user()!.username }}"<br/>
                    ---
                  </code>
                </div>
                <div class="preview-content">{{ form.controls.content.value }}</div>
              } @else {
                <p class="preview-empty">Escribe contenido para ver la preview</p>
              }
            </div>
          }

          @if (form.controls.content.touched && form.controls.content.errors?.['required']) {
            <span class="field-error">El contenido es obligatorio</span>
          }
        </fieldset>

        <!-- Error -->
        @if (error()) {
          <div class="error-message">
            <mat-icon>error_outline</mat-icon>
            <p>{{ error() }}</p>
          </div>
        }

        <!-- Submit -->
        <div class="form-actions">
          <button type="submit" class="submit-btn"
                  [disabled]="submitting() || form.invalid">
            @if (submitting()) {
              <mat-spinner diameter="20"></mat-spinner>
              Enviando...
            } @else {
              <mat-icon>send</mat-icon>
              Enviar para revisión
            }
          </button>
        </div>
      </form>
    }
  `,
  styles: [`
    .breadcrumb {
      font-size: 0.85rem;
      margin-bottom: 24px;
      color: var(--app-text-secondary, #666);
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
    .page-header-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: linear-gradient(135deg, #1565c0, #1976d2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }
    .page-header-info h1 {
      margin: 0 0 6px;
      font-size: 1.5rem;
      font-weight: 700;
    }
    .page-desc {
      margin: 0;
      font-size: 0.95rem;
      opacity: 0.7;
      line-height: 1.6;
      max-width: 600px;
    }

    /* Login card */
    .login-card {
      text-align: center;
      padding: 48px 24px;
      border: 1px solid var(--app-border, #e0e0e0);
      border-radius: 18px;
      background: var(--app-surface, #fff);
    }
    .login-card h2 { margin: 16px 0 8px; }
    .login-card p { opacity: 0.7; margin: 0 0 24px; line-height: 1.6; }
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
      border: 1px solid var(--app-border, #e0e0e0);
      border-radius: 14px;
      margin-bottom: 24px;
      background: var(--app-surface, #fff);
    }
    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }
    .user-info { display: flex; flex-direction: column; flex: 1; }
    .user-name { font-weight: 600; font-size: 0.95rem; }
    .user-handle { font-size: 0.82rem; opacity: 0.6; }
    .logout-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border: 1px solid var(--app-border, #ddd);
      border-radius: 8px;
      background: transparent;
      font-family: inherit;
      font-size: 0.82rem;
      cursor: pointer;
      color: var(--app-text, #333);
      transition: background 0.15s;
    }
    .logout-btn:hover { background: rgba(0,0,0,0.04); }

    .contribute-form { display: flex; flex-direction: column; gap: 24px; }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .form-section {
      border: 1px solid var(--app-border, #e0e0e0);
      border-radius: 14px;
      padding: 20px;
      margin: 0;
    }
    .form-section-full { grid-column: 1 / -1; }

    legend {
      font-weight: 700;
      font-size: 1rem;
      padding: 0 8px;
    }
    .legend-hint, .label-hint {
      font-weight: 400;
      font-size: 0.8rem;
      opacity: 0.55;
    }

    .field { display: flex; flex-direction: column; gap: 6px; margin-top: 14px; }
    .field:first-of-type { margin-top: 8px; }
    .field-row { display: flex; gap: 16px; }
    .field-grow { flex: 1; }

    label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--app-text, #333);
    }

    input, select, textarea {
      font-family: inherit;
      font-size: 0.9rem;
      padding: 10px 14px;
      border: 1px solid var(--app-border, #ddd);
      border-radius: 10px;
      background: var(--app-surface, #fff);
      color: var(--app-text, #333);
      transition: border-color 0.2s;
      outline: none;
    }
    input:focus, select:focus, textarea:focus {
      border-color: var(--app-primary, #1976d2);
    }

    .field-error {
      font-size: 0.78rem;
      color: #d32f2f;
    }

    /* Content area */
    .content-tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 12px;
      margin-top: 8px;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: 1px solid var(--app-border, #ddd);
      border-radius: 8px;
      background: transparent;
      font-family: inherit;
      font-size: 0.85rem;
      cursor: pointer;
      color: var(--app-text, #333);
      transition: all 0.15s;
    }
    .tab-btn.active {
      background: var(--app-primary, #1976d2);
      color: white;
      border-color: var(--app-primary, #1976d2);
    }
    .tab-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .content-textarea {
      width: 100%;
      min-height: 280px;
      resize: vertical;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 0.88rem;
      line-height: 1.7;
      box-sizing: border-box;
    }
    .content-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-size: 0.78rem;
      opacity: 0.55;
    }

    .preview-box {
      border: 1px solid var(--app-border, #ddd);
      border-radius: 10px;
      padding: 20px;
      min-height: 280px;
      background: var(--app-surface, #fafafa);
    }
    .preview-frontmatter {
      background: #263238;
      color: #b0bec5;
      padding: 14px 18px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 0.82rem;
      line-height: 1.8;
    }
    .preview-content {
      white-space: pre-wrap;
      line-height: 1.7;
      font-size: 0.92rem;
    }
    .preview-empty {
      text-align: center;
      opacity: 0.45;
      padding: 60px 0;
    }

    /* Error */
    .error-message {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 18px;
      background: #ffebee;
      border: 1px solid #ef9a9a;
      border-radius: 10px;
      color: #c62828;
      font-size: 0.9rem;
    }

    /* Actions */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      padding-bottom: 40px;
    }
    .submit-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 32px;
      background: linear-gradient(135deg, #1565c0, #1976d2);
      color: white;
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

    /* Success */
    .success-card {
      text-align: center;
      padding: 48px 24px;
      border: 1px solid var(--app-border, #e0e0e0);
      border-radius: 18px;
      background: var(--app-surface, #fff);
    }
    .success-icon { font-size: 56px; width: 56px; height: 56px; color: #43a047; }
    .success-card h2 { margin: 12px 0 8px; }
    .success-card p { opacity: 0.7; margin: 0 0 20px; }
    .pr-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: #1565c0;
      color: white;
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
      border: 1px solid var(--app-border, #ddd);
      border-radius: 10px;
      background: transparent;
      font-family: inherit;
      font-size: 0.9rem;
      cursor: pointer;
      color: var(--app-text, #333);
    }

    @media (max-width: 700px) {
      .form-grid { grid-template-columns: 1fr; }
      .field-row { flex-direction: column; gap: 0; }
      .page-header { flex-direction: column; }
    }
  `],
})
export class ContributeComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly store = inject(ContentStore);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);

  readonly authService = inject(GitHubAuthService);
  readonly technologies = this.store.technologies;
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly prUrl = signal('');
  readonly activeTab = signal<'write' | 'preview'>('write');

  readonly form = this.fb.nonNullable.group({
    technology: ['', [Validators.required]],
    title: ['', [Validators.required, Validators.maxLength(200)]],
    difficulty: ['', [Validators.required]],
    tags: [''],
    content: ['', [Validators.required, Validators.maxLength(15000)]],
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const code = this.route.snapshot.queryParams['code'];
      if (code) {
        this.authService.exchangeCode(code);
      }
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting() || !this.authService.isAuthenticated()) return;

    this.submitting.set(true);
    this.error.set('');

    const value = this.form.getRawValue();
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

  resetForm(): void {
    this.form.reset({ technology: '', title: '', difficulty: '', tags: '', content: '' });
    this.prUrl.set('');
    this.error.set('');
    this.activeTab.set('write');
  }
}
