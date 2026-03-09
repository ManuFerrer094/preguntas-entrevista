import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Question } from '../../../domain/models/question.model';
import { ContentStore } from '../../../core/stores/content.store';
import { ProgressService } from '../../../core/services/progress.service';

@Component({
  selector: 'app-progress-card',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sidebar-card">
      <div class="sidebar-card-header">
        <mat-icon class="sidebar-icon">trending_up</mat-icon>
        <strong>Tu Progreso</strong>
      </div>
      <div class="progress-bar-track">
        <div class="progress-bar-fill" [style.width.%]="progressPct"></div>
      </div>
      <span class="progress-detail">{{ progressPct }}% de "{{ technologyName }}" completado</span>
    </div>
  `,
  styles: [`
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
      height: 8px; border-radius: 4px;
      background: var(--app-surface-variant);
      overflow: hidden; margin-bottom: 8px;
    }
    .progress-bar-fill {
      height: 100%; border-radius: 4px;
      background: var(--app-primary);
      transition: width 0.4s ease;
    }
    .progress-detail { font-size: 0.78rem; opacity: 0.6; }
  `]
})
export class ProgressCardComponent {
  private readonly store = inject(ContentStore);
  private readonly progress = inject(ProgressService);

  @Input({ required: true }) question!: Question;

  get progressPct(): number {
    const q = this.question;
    if (!q) return 0;
    const allQ = this.store.getQuestionsByTechnology(q.technology);
    return this.progress.getProgressPercentage(allQ.map(x => x.id));
  }

  get technologyName(): string {
    const tech = this.question?.technology ?? '';
    return this.store.technologies().find(t => t.slug === tech)?.name ?? tech;
  }
}
