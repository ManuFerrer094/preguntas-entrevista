import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MfCardComponent, MfIconComponent, MfInputComponent } from 'ng-comps';
import { ContentStore } from '../../core/stores/content.store';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, MfIconComponent, MfInputComponent, MfCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-inner">
        <h1 id="hero-title" class="hero-title">
          Domina tu próxima <span class="hero-accent">entrevista técnica</span>
        </h1>
        <p class="hero-subtitle">
          Preguntas reales, recursos curados y preparación guiada por tecnología.
        </p>

        <div class="hero-actions">
          <div class="hero-search">
            <mf-input
              type="search"
              placeholder="Buscar Angular, React, Node.js, .NET..."
              leadingIcon="search"
              [value]="searchQuery()"
              [fullWidth]="true"
              (mfInput)="searchQuery.set($event)"
            />
          </div>
        </div>
      </div>
    </section>

    <section id="technologies" class="tech-section" aria-label="Explorar por tecnología">
      <h2 class="section-title">Explorar por tecnología</h2>
      <div class="technologies-grid">
        @for (tech of filteredTechnologies(); track tech.id) {
          <a
            [routerLink]="['/', tech.slug]"
            class="tech-card-link"
            [attr.aria-label]="'Explorar ' + tech.name"
          >
            <mf-card variant="outlined" [interactive]="true" padding="lg">
              <div class="tech-card-icon" [style.background]="tech.color + '15'">
                <i [class]="tech.devicon" [style.color]="tech.color"></i>
              </div>
              <h3 class="tech-card-name">{{ tech.name }}</h3>
              <p class="tech-card-keywords">{{ tech.keywords }}</p>

              <div class="tech-card-metrics">
                @if (tech.questionCount > 0) {
                  <span class="tech-card-count">{{ tech.questionCount }} preguntas</span>
                }
                @if (tech.resourceCount > 0) {
                  <span class="tech-card-count secondary">{{ tech.resourceCount }} recursos</span>
                }
              </div>

              <div mfCardFooter class="tech-card-footer">
                <span class="tech-card-link-text"
                  >Explorar
                  <mf-icon name="arrow_forward" size="sm" color="inherit" class="link-arrow"
                /></span>
              </div>
            </mf-card>
          </a>
        } @empty {
          <p class="empty">No se encontraron tecnologías</p>
        }
      </div>
    </section>

    <section class="contribute-section" aria-label="Contribuir">
      <mf-card variant="outlined" padding="lg">
        <div class="contribute-content">
          <div class="contribute-text">
            <h2>¿Tienes preguntas de entrevista?</h2>
            <p>Comparte una pregunta y ayuda a otros a prepararse.</p>
          </div>
          <a routerLink="/contribuir" class="contribute-btn">
            <mf-icon name="edit_note" color="inherit" />
            Contribuir
          </a>
        </div>
      </mf-card>
    </section>

    <section class="why-section" aria-label="Por qué usar esta herramienta">
      <h2>¿Por qué prepararte aquí?</h2>
      <div class="why-cards">
        <mf-card
          title="Contenido Open Source"
          subtitle="Preguntas revisadas por la comunidad."
          variant="outlined"
          padding="lg"
        >
          <p class="card-body" style="margin:0;">
            Preguntas revisadas y actualizadas por la comunidad. Contribuye y mejora el contenido.
          </p>
        </mf-card>

        <mf-card
          title="Seguimiento"
          subtitle="Marca y mide tu progreso."
          variant="outlined"
          padding="lg"
        >
          <p class="card-body" style="margin:0;">
            Lleva el control de las preguntas que practicas y visualiza tu avance a lo largo del
            tiempo.
          </p>
        </mf-card>

        <mf-card
          title="Ruta Completa"
          subtitle="Preguntas y recursos en un mismo flujo."
          variant="outlined"
          padding="lg"
        >
          <p class="card-body" style="margin:0;">
            Entra por tecnología, decide si quieres practicar preguntas o reforzar con recursos, y
            avanza sin perder contexto.
          </p>
        </mf-card>
      </div>
    </section>
  `,
  styles: [
    `
      .hero {
        padding: 40px 16px;
      }
      .hero-inner {
        max-width: 920px;
        margin: 0 auto;
        background: var(--app-surface);
        color: var(--app-text);
        border-radius: 14px;
        padding: 28px;
        box-shadow: var(--app-shadow-md);
        text-align: center;
      }
      .hero-title {
        font-size: 2rem;
        margin: 0 0 8px;
        font-weight: 800;
      }
      .hero-accent {
        color: var(--app-primary);
      }
      .hero-subtitle {
        margin: 0 0 18px;
        color: var(--app-text-muted);
        font-size: 1rem;
      }
      .hero-search {
        max-width: 640px;
        margin: 0 auto;
      }

      .section-title {
        margin: 8px 0 18px;
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--app-text);
      }
      .tech-section {
        padding: 24px 0 36px;
      }
      .technologies-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 18px;
      }
      .tech-card-link {
        text-decoration: none;
        color: inherit;
        display: block;
      }

      .why-section {
        margin-top: 28px;
        padding: 8px 0 20px;
        background: transparent;
        border-radius: 12px;
      }
      .why-section h2 {
        margin: 0 0 14px;
      }
      .why-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
      }
      .card-body {
        color: var(--mf-color-neutral-600);
        font-size: 0.95rem;
        line-height: 1.4;
      }

      .contribute-section {
        margin-top: 28px;
      }
      .contribute-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .contribute-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        border-radius: 10px;
        border: 1px solid var(--app-border);
        background: transparent;
        color: var(--app-primary);
        font-weight: 600;
        text-decoration: none;
        transition:
          background 0.18s ease,
          color 0.18s ease,
          box-shadow 0.18s ease,
          transform 0.08s ease;
      }
      .contribute-btn mf-icon {
        color: currentColor;
        transition: color 0.18s ease;
      }
      .contribute-btn:hover,
      .contribute-btn:focus-visible {
        background: var(--app-primary);
        color: var(--app-on-primary);
        border-color: transparent;
        box-shadow: var(--app-shadow-sm);
        transform: translateY(-2px);
      }
      .contribute-btn:active {
        transform: translateY(0);
      }

      .tech-card-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;
      }
      .tech-card-name {
        font-size: 1.05rem;
        margin: 0 0 6px;
        font-weight: 700;
      }
      .tech-card-keywords {
        font-size: 0.85rem;
        color: var(--app-text-muted);
        margin: 0 0 14px;
      }
      .tech-card-metrics {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 14px;
      }
      .tech-card-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
        padding: 12px 16px;
        border-top: 1px solid var(--app-border);
        box-sizing: border-box;
        margin-top: 12px;
        background: transparent;
      }
      .tech-card-count {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--app-primary) 12%, transparent);
        color: var(--app-primary);
        font-weight: 700;
        font-size: 0.8rem;
      }
      .tech-card-count.secondary {
        background: var(--app-surface-variant);
        color: var(--app-text-muted);
      }
      .tech-card-link-text {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--app-primary);
        font-weight: 700;
        padding-left: 8px;
      }

      @media (max-width: 600px) {
        .hero-inner {
          padding: 20px;
        }
        .hero-title {
          font-size: 1.4rem;
        }
        .technologies-grid {
          grid-template-columns: 1fr;
        }
        .contribute-content {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `,
  ],
})
export class HomeComponent implements OnInit {
  readonly store = inject(ContentStore);
  private readonly seo = inject(SeoService);

  readonly searchQuery = signal('');

  readonly filteredTechnologies = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const techs = this.store
      .technologies()
      .filter((t) => t.questionCount > 0 || t.resourceCount > 0);
    if (!query) return techs;
    return techs.filter(
      (tech) =>
        tech.name.toLowerCase().includes(query) || tech.keywords.toLowerCase().includes(query),
    );
  });

  ngOnInit(): void {
    this.store.loadAllQuestionCounts();
    this.store.loadAllResourceCounts();
    this.seo.setPageMeta({
      title: 'Inicio',
      description:
        'Preguntas reales y recursos curados para preparar entrevistas técnicas por tecnología.',
      keywords:
        'entrevistas técnicas, angular, react, vue, nodejs, javascript, typescript, recursos, preguntas',
    });
  }
}
