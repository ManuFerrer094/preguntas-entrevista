import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { MfIconComponent, MfCardComponent, MfProgressBarComponent } from 'ng-comps';
import { Question } from '../../../domain/models/question.model';
import { ContentStore } from '../../../core/stores/content.store';
import { ProgressService } from '../../../core/services/progress.service';

@Component({
  selector: 'app-progress-card',
  standalone: true,
  imports: [MfIconComponent, MfCardComponent, MfProgressBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mf-card variant="outlined" padding="md">
      <div class="sidebar-card-header">
        <mf-icon name="trending_up" size="sm" color="brand" class="sidebar-icon" />
        <strong>Tu Progreso</strong>
      </div>
      <mf-progress-bar
        mode="determinate"
        [value]="progressPct"
        color="brand"
        [showValue]="false"
        [height]="8"
      />
      <span class="progress-detail">{{ progressPct }}% de "{{ technologyName }}" completado</span>
    </mf-card>
  `,
  styles: [`
    mf-card { display: block; }
    .sidebar-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      margin-bottom: 14px;
    }
    .sidebar-icon { font-size: 20px; width: 20px; height: 20px; color: var(--app-primary); }
    mf-progress-bar { display: block; margin-bottom: 8px; }
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
