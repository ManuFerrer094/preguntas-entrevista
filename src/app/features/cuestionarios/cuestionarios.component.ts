import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MfIconComponent, MfProgressSpinnerComponent, MfCardComponent, MfProgressBarComponent, MfButtonComponent, MfRadioButtonComponent, MfRadioOption } from 'ng-comps';
import { SeoService } from '../../core/services/seo.service';
import { SavedSessionsService, SavedQuizSession } from '../../core/services/saved-sessions.service';
import { QuizQuestion, QuizDifficulty } from '../../domain/models/quiz.model';

interface QuizResponse {
  questions: QuizQuestion[];
}

type QuizScreen = 'setup' | 'quiz' | 'results';

const PASS_THRESHOLD = 0.6;

@Component({
  selector: 'app-cuestionarios',
  standalone: true,
  imports: [RouterLink, FormsModule, SlicePipe, MfIconComponent, MfProgressSpinnerComponent, MfCardComponent, MfProgressBarComponent, MfButtonComponent, MfRadioButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ==================== LOADING OVERLAY ==================== -->
    @if (loading()) {
      <div class="loading-overlay" role="status" aria-live="polite" aria-label="Generando examen">
        <div class="loading-overlay-card">
          <mf-progress-spinner mode="indeterminate" [diameter]="52" />
          <p class="loading-overlay-title">Generando examen con IA...</p>
          <p class="loading-overlay-desc">Esto puede tardar unos segundos</p>
        </div>
      </div>
    }

    <nav class="breadcrumb" aria-label="Ruta de navegación">
      <a routerLink="/">Inicio</a>
      <span aria-hidden="true"> &rsaquo; </span>
      <span>Cuestionarios</span>
    </nav>

    <header class="page-header">
      <div class="page-header-info">
        <h1>
          <mf-icon name="quiz" color="inherit" class="header-icon" />
          Cuestionarios
        </h1>
        <p class="page-desc">
          La IA generará un examen tipo test personalizado en base a una oferta de empleo.
          Responde las preguntas y descubre si estás preparado para la entrevista.
        </p>
      </div>
    </header>

    <!-- ======================== SETUP SCREEN ======================== -->
    @if (screen() === 'setup') {
      <div class="setup-section">
        <mf-card variant="outlined" padding="lg" class="setup-card">
          <div class="setup-field">
            <label for="quiz-job-desc" class="input-label">
              <mf-icon name="work_outline" color="inherit" />
              Descripción de la oferta de empleo
            </label>
            <textarea
              id="quiz-job-desc"
              class="job-textarea"
              [(ngModel)]="jobDescription"
              placeholder="Pega aquí la descripción de la oferta de empleo...&#10;&#10;Ejemplo: Buscamos un desarrollador Frontend con experiencia en Angular, TypeScript y RxJS..."
              rows="10"
              [disabled]="loading()"
              maxlength="10000"
            ></textarea>
            <div class="char-count-row">
              <span class="char-count">{{ jobDescription().length }} / 10.000 caracteres</span>
            </div>
          </div>

          <div class="setup-field">
            <p class="input-label">
              <mf-icon name="format_list_numbered" color="inherit" />
              Número de preguntas
            </p>
            <div class="count-options">
              @for (count of questionCounts; track count) {
                <button
                  class="count-btn"
                  [class.count-btn--active]="questionCount() === count"
                  (click)="questionCount.set(count)"
                  [disabled]="loading()"
                >
                  {{ count }}
                </button>
              }
            </div>
          </div>

          <div class="setup-field">
            <p class="input-label">
              <mf-icon name="signal_cellular_alt" color="inherit" />
              Dificultad
            </p>
            <mf-radio-button
              [options]="difficultyRadioOptions"
              [value]="difficulty()"
              direction="horizontal"
              ariaLabel="Selecciona dificultad"
              (mfChange)="onDifficultyChange($event)"
            />
          </div>

          @if (error()) {
            <div class="error-message">
              <mf-icon name="error_outline" color="inherit" />
              <p>{{ error() }}</p>
            </div>
          }

          <mf-button
            [label]="loading() ? 'Generando examen...' : 'Generar Examen'"
            variant="filled"
            [leadingIcon]="loading() ? '' : 'auto_awesome'"
            [disabled]="loading() || jobDescription().trim().length === 0"
            (mfClick)="generateQuiz()"
          />
        </mf-card>
      </div>

      <!-- ===================== SAVED QUIZZES ===================== -->
      @if (savedSessions.savedQuizSessions().length > 0) {
        <div class="saved-section">
          <h2 class="saved-title">
            <mf-icon name="bookmark" color="inherit" />
            Cuestionarios guardados
          </h2>
          <div class="saved-list">
            @for (session of savedSessions.savedQuizSessions(); track session.id) {
              <mf-card variant="outlined" padding="md" class="saved-card">
                <div class="saved-card-info">
                  <p class="saved-card-date">{{ formatDate(session.savedAt) }}</p>
                  <p class="saved-card-desc">{{ session.jobDescription | slice:0:120 }}{{ session.jobDescription.length > 120 ? '…' : '' }}</p>
                  <div class="saved-card-meta">
                    <span class="saved-meta-chip">{{ session.questionCount }} preguntas</span>
                    <span class="saved-meta-chip">{{ difficultyLabel(session.difficulty) }}</span>
                  </div>
                </div>
                <div class="saved-card-actions">
                  <mf-button label="Repetir" variant="outlined" size="sm" leadingIcon="replay" (mfClick)="loadSavedQuiz(session)" />
                  <mf-button label="" variant="text" size="sm" leadingIcon="delete_outline" (mfClick)="savedSessions.deleteQuizSession(session.id)" />
                </div>
              </mf-card>
            }
          </div>
        </div>
      }
    }
    @if (screen() === 'quiz') {
      <div class="quiz-section">
        <!-- Progress bar -->
        <div class="quiz-progress">
          <div class="quiz-progress-info">
            <span class="quiz-progress-text">
              Pregunta {{ currentIndex() + 1 }} de {{ questions().length }}
            </span>
            <span class="quiz-score-live">
              ✓ {{ correctCount() }} correctas
            </span>
          </div>
          <mf-progress-bar mode="determinate" [value]="progressPercent()" color="brand" [showValue]="false" [height]="6" />
        </div>

        <!-- Question card -->
        <mf-card variant="outlined" padding="lg" class="question-card">
          <p class="question-number">Pregunta {{ currentIndex() + 1 }}</p>
          <h2 class="question-text">{{ currentQuestion()?.question }}</h2>

          <div class="options-list">
            @for (option of currentQuestion()?.options; track $index) {
              <button
                class="option-btn"
                [class.option-btn--selected]="selectedIndex() === $index"
                [class.option-btn--correct]="answered() && $index === currentQuestion()?.correctIndex"
                [class.option-btn--wrong]="answered() && selectedIndex() === $index && $index !== currentQuestion()?.correctIndex"
                [disabled]="answered()"
                (click)="selectOption($index)"
              >
                <span class="option-letter">{{ optionLetters[$index] }}</span>
                <span class="option-text">{{ option }}</span>
                @if (answered()) {
                  @if ($index === currentQuestion()?.correctIndex) {
                    <mf-icon name="check_circle" color="inherit" class="option-icon option-icon--correct" />
                  } @else if (selectedIndex() === $index) {
                    <mf-icon name="cancel" color="inherit" class="option-icon option-icon--wrong" />
                  }
                }
              </button>
            }
          </div>

          <!-- Feedback after answering -->
          @if (answered()) {
            <div class="answer-feedback" [class.answer-feedback--correct]="lastAnswerCorrect()" [class.answer-feedback--wrong]="!lastAnswerCorrect()">
              <mf-icon [name]="lastAnswerCorrect() ? 'check_circle' : 'cancel'" color="inherit" />
              <div>
                <p class="feedback-title">{{ lastAnswerCorrect() ? '¡Correcto!' : 'Incorrecto' }}</p>
                @if (currentQuestion()?.explanation) {
                  <p class="feedback-explanation">{{ currentQuestion()?.explanation }}</p>
                }
              </div>
            </div>

            <div class="quiz-actions">
              @if (isLastQuestion()) {
                <mf-button label="Ver resultados" variant="filled" trailingIcon="flag" (mfClick)="finishQuiz()" />
              } @else {
                <mf-button label="Siguiente pregunta" variant="filled" trailingIcon="arrow_forward" (mfClick)="nextQuestion()" />
              }
            </div>
          }
        </mf-card>
      </div>
    }

    <!-- ======================== RESULTS SCREEN ======================== -->
    @if (screen() === 'results') {
      <div class="results-section">
        <!-- Verdict banner -->
        <div class="verdict-banner" [class.verdict-banner--passed]="passed()" [class.verdict-banner--failed]="!passed()">
          <mf-icon [name]="passed() ? 'emoji_events' : 'sentiment_dissatisfied'" color="inherit" class="verdict-icon" />
          <div class="verdict-info">
            <h2 class="verdict-title">{{ passed() ? '¡Aprobado!' : 'Suspenso' }}</h2>
            <p class="verdict-subtitle">
              {{ correctCount() }} de {{ questions().length }} respuestas correctas
              ({{ scorePercent() }}%)
            </p>
          </div>
        </div>

        <!-- Score summary -->
        <div class="score-summary">
          <mf-card variant="outlined" padding="md" class="score-card score-card--correct">
            <mf-icon name="check_circle" color="inherit" />
            <span class="score-num">{{ correctCount() }}</span>
            <span class="score-label">Correctas</span>
          </mf-card>
          <mf-card variant="outlined" padding="md" class="score-card score-card--wrong">
            <mf-icon name="cancel" color="inherit" />
            <span class="score-num">{{ questions().length - correctCount() }}</span>
            <span class="score-label">Incorrectas</span>
          </mf-card>
          <mf-card variant="outlined" padding="md" class="score-card score-card--percent">
            <mf-icon name="percent" color="inherit" />
            <span class="score-num">{{ scorePercent() }}</span>
            <span class="score-label">Puntuación</span>
          </mf-card>
        </div>

        <!-- Detailed answers review -->
        <div class="answers-review">
          <h3 class="answers-review-title">Revisión de respuestas</h3>
          @for (q of questions(); track $index) {
            <div
              class="answer-item"
              [class.answer-item--correct]="userAnswers()[$index] === q.correctIndex"
              [class.answer-item--wrong]="userAnswers()[$index] !== null && userAnswers()[$index] !== q.correctIndex"
            >
              <div class="answer-item-header">
                <span class="answer-num">{{ $index + 1 }}</span>
                <mf-icon [name]="userAnswers()[$index] === q.correctIndex ? 'check_circle' : 'cancel'" color="inherit" class="answer-status-icon" />
                <p class="answer-question">{{ q.question }}</p>
              </div>
              <div class="answer-item-detail">
                @if (userAnswers()[$index] !== null && userAnswers()[$index] !== q.correctIndex) {
                  <p class="your-answer">
                    Tu respuesta:
                    <span class="answer-wrong-text">{{ optionLetters[userAnswers()[$index]!] }}) {{ q.options[userAnswers()[$index]!] }}</span>
                  </p>
                }
                <p class="correct-answer">
                  Respuesta correcta:
                  <span class="answer-correct-text">{{ optionLetters[q.correctIndex] }}) {{ q.options[q.correctIndex] }}</span>
                </p>
                @if (q.explanation) {
                  <p class="answer-explanation">{{ q.explanation }}</p>
                }
              </div>
            </div>
          }
        </div>

        <!-- Action buttons -->
        <div class="results-actions">
          <mf-button label="Repetir examen" variant="outlined" leadingIcon="replay" (mfClick)="repeatQuiz()" />
          <mf-button
            [label]="quizAlreadySaved() ? 'Guardado' : 'Guardar'"
            variant="outlined"
            [leadingIcon]="quizAlreadySaved() ? 'bookmark' : 'bookmark_border'"
            [disabled]="quizAlreadySaved()"
            (mfClick)="saveCurrentQuiz()"
          />
          <mf-button label="Crear nuevo examen" variant="filled" leadingIcon="add_circle_outline" (mfClick)="newQuiz()" />
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      max-width: 860px;
      margin: 0 auto;
      padding: 24px 16px 64px;
    }

    /* Breadcrumb */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.85rem;
      color: var(--app-text-muted);
      margin-bottom: 20px;
    }
    .breadcrumb a {
      color: var(--app-primary);
      text-decoration: none;
    }
    .breadcrumb a:hover { text-decoration: underline; }

    /* Page Header */
    .page-header {
      margin-bottom: 32px;
    }
    .page-header h1 {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 2rem;
      font-weight: 700;
      color: var(--app-text);
      margin: 0 0 10px;
    }
    .header-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      color: var(--app-primary);
    }
    .page-desc {
      color: var(--app-text-muted);
      font-size: 1rem;
      line-height: 1.6;
      margin: 0;
    }

    /* ===== SETUP ===== */
    .setup-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .setup-card {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .setup-field { display: flex; flex-direction: column; gap: 10px; }
    .input-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--app-text);
    }
    .input-label mf-icon { font-size: 18px; width: 18px; height: 18px; color: var(--app-primary); }
    .job-textarea {
      width: 100%;
      padding: 14px;
      border: 1px solid var(--app-border);
      border-radius: 10px;
      background: var(--app-surface-raised);
      color: var(--app-text);
      font-size: 0.95rem;
      font-family: inherit;
      resize: vertical;
      line-height: 1.6;
      box-sizing: border-box;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .job-textarea:focus {
      outline: none;
      border-color: var(--app-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--app-primary) 15%, transparent);
    }
    .char-count-row { display: flex; justify-content: flex-end; }
    .char-count { font-size: 0.78rem; color: var(--app-text-subtle); }

    /* Count selector */
    .count-options { display: flex; gap: 12px; flex-wrap: wrap; }
    .count-btn {
      padding: 10px 24px;
      border-radius: 10px;
      border: 2px solid var(--app-border);
      background: var(--app-surface-raised);
      color: var(--app-text);
      font-size: 1.05rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .count-btn:hover:not(:disabled) {
      border-color: var(--app-primary);
      color: var(--app-primary);
    }
    .count-btn--active {
      border-color: var(--app-primary);
      background: color-mix(in srgb, var(--app-primary) 12%, transparent);
      color: var(--app-primary);
    }
    .count-btn:disabled { opacity: 0.5; cursor: not-allowed; }


    /* Error */
    .error-message {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 14px 16px;
      background: color-mix(in srgb, #ef4444 10%, transparent);
      border: 1px solid color-mix(in srgb, #ef4444 30%, transparent);
      border-radius: 10px;
      color: #ef4444;
    }
    .error-message p { margin: 0; font-size: 0.9rem; }

    /* ===== QUIZ ===== */
    .quiz-section { display: flex; flex-direction: column; gap: 20px; }

    .quiz-progress {
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 12px;
      padding: 14px 20px;
    }
    .quiz-progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .quiz-progress-text { font-size: 0.88rem; color: var(--app-text-muted); font-weight: 500; }
    .quiz-score-live { font-size: 0.88rem; color: #22c55e; font-weight: 600; }

    .question-number { font-size: 0.8rem; font-weight: 600; color: var(--app-primary); margin: 0 0 10px; text-transform: uppercase; letter-spacing: 0.05em; }
    .question-text { font-size: 1.15rem; font-weight: 600; color: var(--app-text); line-height: 1.5; margin: 0 0 24px; }

    .options-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
    .option-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 10px;
      border: 2px solid var(--app-border);
      background: var(--app-surface-raised);
      color: var(--app-text);
      font-size: 0.95rem;
      text-align: left;
      cursor: pointer;
      transition: all 0.15s;
      width: 100%;
    }
    .option-btn:hover:not(:disabled) {
      border-color: var(--app-primary);
      background: color-mix(in srgb, var(--app-primary) 6%, transparent);
    }
    .option-btn--selected {
      border-color: var(--app-primary);
      background: color-mix(in srgb, var(--app-primary) 10%, transparent);
    }
    .option-btn--correct {
      border-color: #22c55e !important;
      background: color-mix(in srgb, #22c55e 10%, transparent) !important;
    }
    .option-btn--wrong {
      border-color: #ef4444 !important;
      background: color-mix(in srgb, #ef4444 10%, transparent) !important;
    }
    .option-btn:disabled { cursor: not-allowed; }
    .option-letter {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      height: 28px;
      border-radius: 6px;
      background: var(--app-border);
      color: var(--app-text-muted);
      font-size: 0.8rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .option-text { flex: 1; line-height: 1.4; }
    .option-icon { margin-left: auto; font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
    .option-icon--correct { color: #22c55e; }
    .option-icon--wrong { color: #ef4444; }

    /* Answer feedback */
    .answer-feedback {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 10px;
      margin-top: 8px;
      margin-bottom: 16px;
    }
    .answer-feedback--correct {
      background: color-mix(in srgb, #22c55e 12%, transparent);
      border: 1px solid color-mix(in srgb, #22c55e 30%, transparent);
      color: #16a34a;
    }
    .answer-feedback--wrong {
      background: color-mix(in srgb, #ef4444 10%, transparent);
      border: 1px solid color-mix(in srgb, #ef4444 28%, transparent);
      color: #dc2626;
    }
    .answer-feedback mf-icon { font-size: 22px; width: 22px; height: 22px; flex-shrink: 0; margin-top: 1px; }
    .feedback-title { font-weight: 700; font-size: 0.95rem; margin: 0 0 4px; }
    .feedback-explanation { margin: 0; font-size: 0.88rem; line-height: 1.5; }

    /* Quiz nav */
    .quiz-actions { display: flex; justify-content: flex-end; }

    /* ===== RESULTS ===== */
    .results-section { display: flex; flex-direction: column; gap: 24px; }

    .verdict-banner {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 24px;
      border-radius: 16px;
      border: 2px solid;
    }
    .verdict-banner--passed {
      background: color-mix(in srgb, #22c55e 10%, transparent);
      border-color: color-mix(in srgb, #22c55e 35%, transparent);
      color: #15803d;
    }
    .verdict-banner--failed {
      background: color-mix(in srgb, #ef4444 8%, transparent);
      border-color: color-mix(in srgb, #ef4444 28%, transparent);
      color: #dc2626;
    }
    .verdict-icon { font-size: 3rem; width: 3rem; height: 3rem; }
    .verdict-title { font-size: 1.8rem; font-weight: 700; margin: 0 0 4px; }
    .verdict-subtitle { margin: 0; font-size: 1rem; opacity: 0.85; }

    .score-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .score-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .score-card mf-icon { font-size: 28px; width: 28px; height: 28px; }
    .score-card--correct mf-icon { color: #22c55e; }
    .score-card--wrong mf-icon { color: #ef4444; }
    .score-card--percent mf-icon { color: var(--app-primary); }
    .score-num { font-size: 1.8rem; font-weight: 700; color: var(--app-text); line-height: 1; }
    .score-label { font-size: 0.8rem; color: var(--app-text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }

    /* Answers review */
    .answers-review { display: flex; flex-direction: column; gap: 12px; }
    .answers-review-title { font-size: 1.1rem; font-weight: 700; color: var(--app-text); margin: 0 0 4px; }
    .answer-item {
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 12px;
      padding: 16px;
    }
    .answer-item--correct { border-left: 4px solid #22c55e; }
    .answer-item--wrong { border-left: 4px solid #ef4444; }
    .answer-item-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
    .answer-num {
      min-width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: var(--app-border);
      color: var(--app-text-muted);
      font-size: 0.78rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .answer-status-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
    .answer-item--correct .answer-status-icon { color: #22c55e; }
    .answer-item--wrong .answer-status-icon { color: #ef4444; }
    .answer-question { margin: 0; font-size: 0.92rem; font-weight: 600; color: var(--app-text); line-height: 1.4; }
    .answer-item-detail { padding-left: 34px; display: flex; flex-direction: column; gap: 4px; }
    .your-answer, .correct-answer, .answer-explanation { margin: 0; font-size: 0.85rem; line-height: 1.5; }
    .your-answer { color: var(--app-text-muted); }
    .correct-answer { color: var(--app-text-muted); }
    .answer-wrong-text { color: #ef4444; font-weight: 600; }
    .answer-correct-text { color: #22c55e; font-weight: 600; }
    .answer-explanation { color: var(--app-text-subtle); font-style: italic; margin-top: 2px; }

    /* Results action buttons */
    .results-actions { display: flex; gap: 12px; flex-wrap: wrap; }

    /* Component display */
    mf-card { display: block; }
    mf-progress-bar { display: block; }

    /* Responsive */
    @media (max-width: 600px) {
      :host { padding: 16px 12px 48px; }
      .page-header h1 { font-size: 1.5rem; }
      .setup-card { padding: 20px; }
      .question-card { padding: 20px; }
      .score-summary { grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .score-card { padding: 14px 8px; }
      .score-num { font-size: 1.4rem; }
      .verdict-banner { flex-direction: column; text-align: center; padding: 20px; }
      .verdict-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; }
      .results-actions { flex-direction: column; }
    }
  `]
})
export class CuestionariosComponent {
  private http = inject(HttpClient);
  private seo = inject(SeoService);
  readonly savedSessions = inject(SavedSessionsService);

  readonly optionLetters = ['A', 'B', 'C', 'D'];
  readonly questionCounts: (10 | 15 | 20)[] = [10, 15, 20];

  // Form state
  readonly jobDescription = signal('');
  readonly questionCount = signal<10 | 15 | 20>(10);
  readonly difficulty = signal<QuizDifficulty>('mixed');

  readonly difficultyOptions: { value: QuizDifficulty; label: string; icon: string }[] = [
    { value: 'mixed',  label: 'Mixta',   icon: 'shuffle' },
    { value: 'easy',   label: 'Fácil',   icon: 'sentiment_satisfied' },
    { value: 'medium', label: 'Media',   icon: 'sentiment_neutral' },
    { value: 'hard',   label: 'Difícil', icon: 'sentiment_dissatisfied' },
  ];

  readonly difficultyRadioOptions: MfRadioOption[] = [
    { value: 'mixed', label: 'Mixta' },
    { value: 'easy', label: 'Fácil' },
    { value: 'medium', label: 'Media' },
    { value: 'hard', label: 'Difícil' },
  ];

  // App state
  readonly screen = signal<QuizScreen>('setup');
  readonly loading = signal(false);
  readonly error = signal('');

  // Quiz state
  readonly questions = signal<QuizQuestion[]>([]);
  readonly currentIndex = signal(0);
  readonly userAnswers = signal<(number | null)[]>([]);
  readonly selectedIndex = signal<number | null>(null);
  readonly answered = signal(false);

  // Save state
  readonly quizAlreadySaved = signal(false);

  // Computed
  readonly currentQuestion = computed(() => this.questions()[this.currentIndex()]);
  readonly progressPercent = computed(() =>
    this.questions().length > 0
      ? ((this.currentIndex() + 1) / this.questions().length) * 100
      : 0
  );
  readonly isLastQuestion = computed(() => this.currentIndex() === this.questions().length - 1);
  readonly lastAnswerCorrect = computed(() => {
    const sel = this.selectedIndex();
    const q = this.currentQuestion();
    return sel !== null && q !== undefined && sel === q.correctIndex;
  });
  readonly correctCount = computed(() =>
    this.userAnswers().reduce<number>((acc, answer, idx) => {
      const q = this.questions()[idx];
      return q && answer === q.correctIndex ? acc + 1 : acc;
    }, 0)
  );
  readonly scorePercent = computed(() =>
    this.questions().length > 0
      ? Math.round((this.correctCount() / this.questions().length) * 100)
      : 0
  );
  readonly passed = computed(() => this.scorePercent() >= PASS_THRESHOLD * 100);

  constructor() {
    this.seo.setPageMeta({
      title: 'Cuestionarios - Preguntas de Entrevista',
      description: 'Genera un examen tipo test personalizado con IA a partir de una oferta de empleo. Practica para tu entrevista técnica.'
    });
  }

  onDifficultyChange(value: string): void {
    this.difficulty.set(value as QuizDifficulty);
  }

  generateQuiz(): void {
    if (this.loading() || this.jobDescription().trim().length === 0) return;

    this.loading.set(true);
    this.error.set('');

    this.http.post<QuizResponse>('/api/quiz', {
      jobDescription: this.jobDescription(),
      questionCount: this.questionCount(),
      difficulty: this.difficulty(),
    }).subscribe({
      next: (response) => {
        this.questions.set(response.questions);
        this.userAnswers.set(new Array(response.questions.length).fill(null));
        this.currentIndex.set(0);
        this.selectedIndex.set(null);
        this.answered.set(false);
        this.quizAlreadySaved.set(false);
        this.loading.set(false);
        this.screen.set('quiz');
      },
      error: (err) => {
        const msg = err?.error?.error ?? 'Error al generar el cuestionario. Inténtalo de nuevo.';
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }

  selectOption(index: number): void {
    if (this.answered()) return;
    this.selectedIndex.set(index);
    const answers = [...this.userAnswers()];
    answers[this.currentIndex()] = index;
    this.userAnswers.set(answers);
    this.answered.set(true);
  }

  nextQuestion(): void {
    const next = this.currentIndex() + 1;
    if (next < this.questions().length) {
      this.currentIndex.set(next);
      this.selectedIndex.set(null);
      this.answered.set(false);
    }
  }

  finishQuiz(): void {
    this.screen.set('results');
  }

  repeatQuiz(): void {
    this.userAnswers.set(new Array(this.questions().length).fill(null));
    this.currentIndex.set(0);
    this.selectedIndex.set(null);
    this.answered.set(false);
    this.screen.set('quiz');
  }

  newQuiz(): void {
    this.questions.set([]);
    this.userAnswers.set([]);
    this.currentIndex.set(0);
    this.selectedIndex.set(null);
    this.answered.set(false);
    this.quizAlreadySaved.set(false);
    this.error.set('');
    this.screen.set('setup');
  }

  saveCurrentQuiz(): void {
    if (this.quizAlreadySaved()) return;
    this.savedSessions.saveQuizSession(
      this.jobDescription(),
      this.questionCount(),
      this.difficulty(),
      this.questions(),
    );
    this.quizAlreadySaved.set(true);
  }

  loadSavedQuiz(session: SavedQuizSession): void {
    this.jobDescription.set(session.jobDescription);
    this.questionCount.set(session.questionCount as 10 | 15 | 20);
    this.difficulty.set(session.difficulty);
    this.questions.set(session.questions);
    this.userAnswers.set(new Array(session.questions.length).fill(null));
    this.currentIndex.set(0);
    this.selectedIndex.set(null);
    this.answered.set(false);
    this.quizAlreadySaved.set(true);
    this.screen.set('quiz');
  }

  difficultyLabel(d: QuizDifficulty): string {
    const opt = this.difficultyOptions.find(o => o.value === d);
    return opt?.label ?? d;
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
