import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Question } from '../../../domain/models/question.model';

@Component({
  selector: 'app-author-card',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sidebar-card author-card">
      <div class="sidebar-card-header">
        <mat-icon class="sidebar-icon">person</mat-icon>
        <strong>Subido por</strong>
      </div>
      <div class="author-sidebar">
        <img class="author-avatar" [src]="avatar" [alt]="name" />
        <div class="author-details">
          <a class="author-link" [href]="url" target="_blank" rel="noopener noreferrer">{{ name }}</a>
          <a class="author-profile" [href]="url" target="_blank" rel="noopener noreferrer">Ver perfil</a>
        </div>
      </div>
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
    .author-sidebar { display: flex; align-items: center; }
    .author-avatar {
      width: 48px; height: 48px; border-radius: 50%; object-fit: cover;
      border: 1px solid var(--app-border); box-shadow: var(--app-shadow-sm);
    }
    .author-details { display: flex; flex-direction: column; margin-left: 12px; }
    .author-link { font-weight: 700; color: var(--app-primary); text-decoration: none; }
    .author-link:hover { text-decoration: underline; }
    .author-profile { font-size: 0.82rem; color: var(--app-text-muted); text-decoration: none; }
    .author-profile:hover { text-decoration: underline; }
  `]
})
export class AuthorCardComponent {
  @Input({ required: true }) question!: Question;

  get name(): string {
    const q = this.question;
    return q?.author && q.author.trim() ? q.author : 'Manu Ferrer';
  }

  get url(): string {
    const q = this.question;
    return q?.authorUrl && q.authorUrl.trim() ? q.authorUrl : 'https://github.com/ManuFerrer094';
  }

  get avatar(): string {
    const url = this.url;
    if (!url) return 'https://avatars.githubusercontent.com/ManuFerrer094';
    const m = url.match(/github\.com\/(?:.+?\/)?([^\/\?\#]+)/i);
    const user = m ? m[1] : null;
    return user ? `https://avatars.githubusercontent.com/${user}` : 'https://avatars.githubusercontent.com/ManuFerrer094';
  }
}
