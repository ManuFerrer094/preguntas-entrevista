import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ContentStore } from '../../core/stores/content.store';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero" aria-labelledby="hero-title">
      <span class="hero-badge">PREPARA TU ENTREVISTA</span>
      <h1 id="hero-title" class="hero-title">
        Domina tu Próxima<br/>
        <span class="hero-highlight">Entrevista Técnica</span>
      </h1>
      <p class="hero-subtitle">
        Preparación completa para ingenieros de software. Accede a preguntas reales
        de entrevistas técnicas organizadas por tecnología.
      </p>

      <div class="hero-explore">
        <p class="hero-explore-title">Explorar por Tecnología</p>
        <p class="hero-explore-subtitle">Selecciona una tecnología para empezar tu preparación</p>
        <div class="search-container">
          <mat-icon class="search-icon">search</mat-icon>
          <input
            type="text"
            class="search-input"
            placeholder="Buscar React, Angular, Node.js..."
            [value]="searchQuery()"
            (input)="onSearchInput($event)"
            aria-label="Buscar tecnología"
          />
        </div>
      </div>
    </section>

    <section id="technologies" class="tech-section" aria-label="Explorar por tecnología">

      <div class="technologies-grid">
        @for (tech of filteredTechnologies(); track tech.id) {
          <a [routerLink]="['/', tech.slug]" class="tech-card" [attr.aria-label]="'Ver preguntas de ' + tech.name">
            <div class="tech-card-icon" [style.background]="tech.color + '15'">
              <i [class]="tech.devicon" [style.color]="tech.color"></i>
            </div>
            <h3 class="tech-card-name">{{ tech.name }}</h3>
            <p class="tech-card-keywords">{{ tech.keywords }}</p>
            <div class="tech-card-footer">
              <span class="tech-card-count">
                {{ tech.questionCount || '—' }} Preguntas
              </span>
              <span class="tech-card-link">
                Empezar <mat-icon class="link-arrow">arrow_forward</mat-icon>
              </span>
            </div>
          </a>
        } @empty {
          <p class="empty">No se encontraron tecnologías</p>
        }
      </div>
    </section>

    <section class="why-section" aria-label="Por qué usar esta herramienta">
      <div class="why-content">
        <h2>¿Por qué prepararte aquí?</h2>
        <div class="why-items">
          <div class="why-item">
            <mat-icon class="why-icon">check_circle</mat-icon>
            <div>
              <strong>Contenido Open Source</strong>
              <p>Preguntas revisadas y actualizadas por la comunidad.</p>
            </div>
          </div>
          <div class="why-item">
            <mat-icon class="why-icon">check_circle</mat-icon>
            <div>
              <strong>Seguimiento de Progreso</strong>
              <p>Marca las preguntas como leídas y ve tu avance.</p>
            </div>
          </div>
          <div class="why-item">
            <mat-icon class="why-icon">check_circle</mat-icon>
            <div>
              <strong>Preguntas Reales</strong>
              <p>Basadas en entrevistas de empresas top de tecnología.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <footer class="footer">
      <p>Creado por <a href="https://manuelferrer.vercel.app/" target="_blank" rel="noopener noreferrer" class="footer-link">Manuel Ferrer</a></p>
    </footer>
  `,
  styles: [`
    .hero {
      text-align: center;
      padding: 64px 16px 48px;
      background: linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%);
      color: white;
      border-radius: 0 0 28px 28px;
      margin: 0 0 32px 0;
      box-sizing: border-box;
      overflow: hidden;
      width: 100%;
    }
    .hero-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 1.5px;
      color: #90caf9;
      margin-bottom: 16px;
    }
    .hero-title {
      font-size: 2.75rem;
      font-weight: 800;
      line-height: 1.15;
      margin: 0 0 20px;
    }
    .hero-highlight {
      background: linear-gradient(90deg, #90caf9, #e3f2fd);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-subtitle {
      font-size: 1.125rem;
      max-width: 560px;
      margin: 0 auto 0;
      line-height: 1.7;
      opacity: 0.92;
    }

    .hero-explore {
      margin-top: 40px;
      padding-top: 32px;
      border-top: 1px solid rgba(255, 255, 255, 0.18);
    }
    .hero-explore-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: white;
      margin: 0 0 6px;
    }
    .hero-explore-subtitle {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.75);
      margin: 0 0 20px;
    }
    .search-container {
      display: flex;
      align-items: center;
      max-width: 480px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      padding: 0 16px;
      border: 1px solid rgba(255, 255, 255, 0.25);
      transition: border-color 0.2s, background 0.2s;
    }
    .search-container:focus-within {
      border-color: rgba(255, 255, 255, 0.6);
      background: rgba(255, 255, 255, 0.18);
    }
    .search-icon { color: rgba(255, 255, 255, 0.65); margin-right: 12px; }
    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      padding: 14px 0;
      font-size: 0.95rem;
      outline: none;
      font-family: inherit;
      color: white;
    }
    .search-input::placeholder { color: rgba(255, 255, 255, 0.5); }

    .tech-section { padding: 0 0 32px; }

    .technologies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
      margin-top: 32px;
    }
    .tech-card {
      display: flex;
      flex-direction: column;
      text-decoration: none;
      color: var(--app-text);
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 16px;
      padding: 24px;
      transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
    }
    .tech-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--app-shadow-lg);
      border-color: var(--app-primary);
    }
    .tech-card-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .tech-card-icon i {
      font-size: 28px;
    }
    .tech-card-name {
      font-size: 1.125rem;
      font-weight: 700;
      margin: 0 0 6px;
    }
    .tech-card-keywords {
      font-size: 0.85rem;
      opacity: 0.65;
      margin: 0 0 20px;
      line-height: 1.5;
      flex: 1;
    }
    .tech-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.8rem;
    }
    .tech-card-count {
      font-weight: 600;
      opacity: 0.7;
    }
    .tech-card-link {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--app-primary);
      font-weight: 600;
    }
    .link-arrow { font-size: 18px; width: 18px; height: 18px; }

    .why-section {
      margin-top: 40px;
      padding: 48px 32px;
      background: linear-gradient(135deg, #0d47a1, #1565c0);
      border-radius: 20px;
      color: white;
    }
    .why-content h2 { margin: 0 0 28px; font-size: 1.5rem; font-weight: 700; }
    .why-items { display: flex; flex-direction: column; gap: 20px; }
    .why-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .why-icon { color: #66bb6a; margin-top: 2px; }
    .why-item strong { display: block; margin-bottom: 4px; }
    .why-item p { margin: 0; opacity: 0.88; font-size: 0.9rem; line-height: 1.5; }

    .footer {
      text-align: center;
      padding: 32px 0 16px;
      font-size: 0.85rem;
      opacity: 0.5;
    }
    .footer-link {
      color: inherit;
      text-decoration: underline;
    }
    .footer-link:hover {
      opacity: 0.8;
    }

    .empty { text-align: center; grid-column: 1 / -1; padding: 32px; opacity: 0.6; }

    @media (max-width: 600px) {
      .hero { padding: 48px 16px 40px; }
      .hero-title { font-size: 1.85rem; }
      .hero-explore { margin-top: 32px; padding-top: 24px; }
      .technologies-grid { grid-template-columns: 1fr; margin-top: 24px; }
      .why-section { padding: 32px 20px; }
    }
  `]
})
export class HomeComponent implements OnInit {
  readonly store = inject(ContentStore);
  private readonly seo = inject(SeoService);

  readonly searchQuery = signal('');

  readonly filteredTechnologies = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const techs = this.store.technologies().filter(t => t.questionCount > 0);
    if (!query) return techs;
    return techs.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.keywords.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.store.loadAllQuestionCounts();
    this.seo.setPageMeta({
      title: 'Inicio',
      description: 'Preguntas típicas de entrevistas técnicas para Angular, React, Vue, Node.js, TypeScript, JavaScript, Testing y System Design.',
      keywords: 'entrevistas técnicas, angular, react, vue, nodejs, typescript, javascript, preguntas'
    });
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }
}
