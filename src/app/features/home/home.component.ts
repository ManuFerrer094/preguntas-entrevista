import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ContentStore } from '../../core/stores/content.store';
import { SeoService } from '../../core/services/seo.service';
import { ProgressService } from '../../core/services/progress.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, MatButtonModule, MatIconModule],
  template: `
    <!-- Hero Section -->
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
    </section>

    <!-- Explore by Technology -->
    <section id="technologies" class="tech-section" aria-label="Explorar por tecnología">
      <div class="section-header">
        <h2 class="section-title">Explorar por Tecnología</h2>
        <p class="section-subtitle">Selecciona una tecnología para empezar tu preparación</p>
      </div>

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

    <!-- Why Section -->
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

    <!-- Footer -->
    <footer class="footer">
      <p>&copy; 2026 Preguntas Entrevista. Construido con Angular.</p>
    </footer>
  `,
  styles: [`
    /* Hero */
    .hero {
      text-align: center;
      padding: 64px 16px 80px;
      background: linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%);
      color: white;
      border-radius: 0 0 24px 24px;
      margin: 0 0 24px 0;
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
      margin: 0 auto 32px;
      line-height: 1.7;
      opacity: 0.92;
    }
    .hero-actions { display: flex; justify-content: center; gap: 12px; }
    .hero-btn-primary {
      font-size: 1rem;
      padding: 12px 36px;
      border-radius: 28px;
      font-weight: 600;
    }

    /* Tech Section */
    .tech-section { padding: 56px 0 32px; }
    .section-header { text-align: center; margin-bottom: 32px; }
    .section-title { font-size: 1.75rem; font-weight: 700; margin: 0 0 8px; }
    .section-subtitle { font-size: 1rem; opacity: 0.7; margin: 0; }

    .search-container {
      display: flex;
      align-items: center;
      max-width: 480px;
      margin: 0 auto 40px;
      background: var(--app-surface-variant);
      border-radius: 12px;
      padding: 0 16px;
      border: 1px solid var(--app-border);
      transition: border-color 0.2s;
    }
    .search-container:focus-within {
      border-color: var(--app-primary);
    }
    .search-icon { color: var(--app-text-muted); margin-right: 12px; }
    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      padding: 14px 0;
      font-size: 0.95rem;
      outline: none;
      font-family: inherit;
      color: inherit;
    }

    /* Tech Grid */
    .technologies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
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

    /* Why Section */
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

    /* Footer */
    .footer {
      text-align: center;
      padding: 32px 0 16px;
      font-size: 0.85rem;
      opacity: 0.5;
    }

    .empty { text-align: center; grid-column: 1 / -1; padding: 32px; opacity: 0.6; }

    @media (max-width: 600px) {
      .hero { padding: 48px 16px 56px; }
      .hero-title { font-size: 1.85rem; }
      .technologies-grid { grid-template-columns: 1fr; }
      .why-section { padding: 32px 20px; }
    }
  `]
})
export class HomeComponent implements OnInit {
  store = inject(ContentStore);
  private seo = inject(SeoService);
  progress = inject(ProgressService);

  searchQuery = signal('');

  filteredTechnologies = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const techs = this.store.technologies();
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
