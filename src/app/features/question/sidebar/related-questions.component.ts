import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MfIconComponent, MfCardComponent } from 'ng-comps';
import { Question } from '../../../domain/models/question.model';
import { ContentStore } from '../../../core/stores/content.store';
import { AiQuestionsService } from '../../../core/services/ai-questions.service';
import { difficultyLabel } from '../../../core/utils/difficulty';

@Component({
  selector: 'app-related-questions',
  standalone: true,
  imports: [RouterLink, MfIconComponent, MfCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mf-card variant="outlined" padding="md">
      <div class="sidebar-card-header">
        <mf-icon name="quiz" size="sm" color="brand" class="sidebar-icon" />
        <strong>Preguntas Relacionadas</strong>
      </div>
      <div class="related-list">
        @for (rq of relatedList; track rq.slug) {
          <a
            [routerLink]="['/', rq.technology, rq.slug]"
            [queryParams]="isAiMode ? { ai: 1 } : {}"
            class="related-item"
          >
            <span class="related-title">{{ rq.title }}</span>
            @if (rq.difficulty) {
              <span class="difficulty-badge sm" [class]="'badge-' + rq.difficulty">
                {{ getDifficultyLabel(rq.difficulty) }}
              </span>
            }
          </a>
        }
      </div>
      <a
        [routerLink]="isAiMode ? ['/ai-questions'] : ['/', technology, 'preguntas']"
        class="view-all-link"
      >
        {{ isAiMode ? 'Volver a Preguntas IA' : 'Ver todas las preguntas de ' + technologyName }}
      </a>
    </mf-card>
  `,
  styles: [
    `
      mf-card {
        display: block;
      }
      .sidebar-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9rem;
        margin-bottom: 14px;
      }
      .sidebar-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: var(--app-primary);
      }
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
      .related-item:hover .related-title {
        color: var(--app-primary);
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
      .view-all-link {
        font-size: 0.82rem;
        color: var(--app-primary);
        text-decoration: none;
        font-weight: 600;
      }
      .view-all-link:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class RelatedQuestionsComponent {
  private readonly store = inject(ContentStore);
  private readonly aiService = inject(AiQuestionsService);

  @Input({ required: true }) question!: Question;
  @Input() isAiMode = false;

  readonly getDifficultyLabel = difficultyLabel;

  get relatedList(): Question[] {
    const q = this.question;
    if (!q) return [];
    if (this.isAiMode) {
      return this.aiService
        .activeList()
        .filter((x) => !(x.slug === q.slug && x.technology === q.technology))
        .slice(0, 3)
        .map((ref) => this.store.getQuestion(ref.technology, ref.slug))
        .filter((x): x is Question => x !== undefined);
    }
    const questions = this.store.getQuestionsByTechnology(q.technology);
    return questions.filter((x) => x.slug !== q.slug).slice(0, 3);
  }

  get technology(): string {
    return this.question?.technology ?? '';
  }

  get technologyName(): string {
    const tech = this.question?.technology ?? '';
    return this.store.technologies().find((t) => t.slug === tech)?.name ?? tech;
  }
}
