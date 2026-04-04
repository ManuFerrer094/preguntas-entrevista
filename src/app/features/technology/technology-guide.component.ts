import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MfCardComponent } from 'ng-comps';
import { ContentStore } from '../../core/stores/content.store';
import { SeoService } from '../../core/services/seo.service';
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
} from '../../core/seo/structured-data';
import {
  MIN_GUIDE_QUESTIONS,
  MIN_LEVEL_QUESTIONS,
  MIN_TOPIC_QUESTIONS,
} from '../../core/utils/question-taxonomy';

@Component({
  selector: 'app-technology-guide',
  standalone: true,
  imports: [RouterLink, MfCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (technology()) {
      <nav class="breadcrumb" aria-label="Ruta de navegación">
        <a routerLink="/">Inicio</a>
        <span aria-hidden="true"> &rsaquo; </span>
        <a [routerLink]="['/', technology()!.slug]">{{ technology()!.name }}</a>
        <span aria-hidden="true"> &rsaquo; </span>
        <span>Guía</span>
      </nav>

      <section class="hero">
        <div class="hero-copy">
          <p class="kicker">Guía evergreen</p>
          <h1>Guía para entrevistas de {{ technology()!.name }}</h1>
          <p class="description">
            Ruta editorial para preparar {{ technology()!.name }} con preguntas reales, temas
            frecuentes y bloques de práctica por nivel.
          </p>
        </div>

        <div class="hero-metrics">
          <span class="pill">{{ questions().length }} preguntas</span>
          <span class="pill subtle">{{ topicClusters().length }} temas potentes</span>
          <span class="pill subtle">{{ levelClusters().length }} niveles activos</span>
        </div>
      </section>

      @if (questions().length >= minGuideQuestions) {
        <section class="route-grid">
          <mf-card variant="outlined" padding="lg">
            <p class="section-kicker">Paso 1</p>
            <h2>Empieza por el mapa general</h2>
            <p>Recorre primero el listado completo para identificar huecos y marcar progreso.</p>
            <a [routerLink]="['/', technology()!.slug, 'preguntas']" class="text-link"
              >Ver todas las preguntas</a
            >
          </mf-card>

          <mf-card variant="outlined" padding="lg">
            <p class="section-kicker">Paso 2</p>
            <h2>Ataca los temas de más peso</h2>
            <p>
              Prioriza los clústeres con más preguntas para cubrir lo que más suele aparecer en
              entrevistas.
            </p>
          </mf-card>

          <mf-card variant="outlined" padding="lg">
            <p class="section-kicker">Paso 3</p>
            <h2>Refuerza con material externo</h2>
            <p>
              Los recursos quedan fuera del índice por ahora, pero sí sirven para profundizar justo
              antes de la entrevista.
            </p>
            <a [routerLink]="['/', technology()!.slug, 'recursos']" class="text-link"
              >Ir a recursos</a
            >
          </mf-card>
        </section>

        @if (topicClusters().length > 0) {
          <section class="content-section">
            <div class="section-head">
              <p class="section-kicker">Temas</p>
              <h2>Temas con más densidad</h2>
            </div>

            <div class="card-grid">
              @for (topic of topicClusters(); track topic.slug) {
                <a [routerLink]="['/', technology()!.slug, 'tema', topic.slug]" class="card-link">
                  <mf-card variant="outlined" [interactive]="true" padding="lg">
                    <p class="topic-name">{{ topic.label }}</p>
                    <h3>{{ topic.questionCount }} preguntas conectadas</h3>
                    <p>{{ topic.summary }}</p>
                  </mf-card>
                </a>
              }
            </div>
          </section>
        }

        @if (levelClusters().length > 0) {
          <section class="content-section">
            <div class="section-head">
              <p class="section-kicker">Niveles</p>
              <h2>Bloques por seniority</h2>
            </div>

            <div class="card-grid levels">
              @for (level of levelClusters(); track level.slug) {
                <a [routerLink]="['/', technology()!.slug, 'nivel', level.slug]" class="card-link">
                  <mf-card variant="outlined" [interactive]="true" padding="lg">
                    <p class="topic-name">{{ level.label }}</p>
                    <h3>{{ level.questionCount }} preguntas</h3>
                    <p>{{ level.description }}</p>
                  </mf-card>
                </a>
              }
            </div>
          </section>
        }

        <section class="content-section">
          <div class="section-head">
            <p class="section-kicker">Selección</p>
            <h2>Preguntas destacadas</h2>
          </div>

          <div class="question-list">
            @for (question of featuredQuestions(); track question.slug) {
              <a [routerLink]="['/', question.technology, question.slug]" class="question-link">
                <span class="question-title">{{ question.title }}</span>
                <span class="question-meta">{{ question.readingTime }} min</span>
              </a>
            }
          </div>
        </section>
      } @else {
        <mf-card variant="outlined" padding="lg">
          <h2>Guía aún no indexable</h2>
          <p>
            Esta tecnología todavía no tiene masa suficiente para una guía evergreen sólida. La
            página se mantiene accesible, pero fuera del índice hasta que haya más contenido.
          </p>
        </mf-card>
      }
    } @else {
      <p>Tecnología no encontrada.</p>
      <a routerLink="/" class="back-link">Volver al inicio</a>
    }
  `,
  styles: [
    `
      .breadcrumb {
        margin-bottom: 24px;
        font-size: 0.85rem;
      }
      .breadcrumb a,
      .text-link {
        color: var(--app-primary);
        text-decoration: none;
      }
      .breadcrumb a:hover,
      .text-link:hover {
        text-decoration: underline;
      }
      .hero {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        padding: 30px;
        border-radius: 26px;
        border: 1px solid var(--app-border);
        background:
          linear-gradient(
            135deg,
            color-mix(in srgb, var(--app-primary) 10%, transparent),
            transparent 55%
          ),
          var(--app-surface);
        box-shadow: var(--app-shadow-sm);
        margin-bottom: 22px;
      }
      .kicker,
      .section-kicker {
        margin: 0 0 8px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--app-primary);
      }
      .hero h1,
      .section-head h2 {
        margin: 0 0 10px;
      }
      .description,
      .card-grid p,
      .route-grid p {
        margin: 0;
        color: var(--app-text-muted);
        line-height: 1.6;
      }
      .hero-metrics {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        padding: 8px 12px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--app-primary) 12%, transparent);
        color: var(--app-primary);
        font-weight: 700;
      }
      .pill.subtle {
        background: var(--app-surface-variant);
        color: var(--app-text-muted);
      }
      .route-grid,
      .card-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }
      .route-grid {
        margin-bottom: 24px;
      }
      .content-section {
        margin-top: 28px;
      }
      .section-head {
        margin-bottom: 14px;
      }
      .card-link {
        color: inherit;
        text-decoration: none;
      }
      .card-link mf-card {
        display: block;
        height: 100%;
      }
      .topic-name {
        margin-bottom: 10px !important;
        color: var(--app-primary) !important;
        font-weight: 700;
      }
      .card-grid h3 {
        margin: 0 0 8px;
      }
      .question-list {
        display: grid;
        gap: 10px;
      }
      .question-link {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 16px;
        border-radius: 16px;
        border: 1px solid var(--app-border);
        background: var(--app-surface);
        color: inherit;
        text-decoration: none;
      }
      .question-link:hover {
        border-color: var(--app-primary);
      }
      .question-meta {
        color: var(--app-text-muted);
        font-size: 0.82rem;
      }
      @media (max-width: 900px) {
        .hero,
        .route-grid,
        .card-grid {
          grid-template-columns: 1fr;
        }
        .hero {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `,
  ],
})
export class TechnologyGuideComponent {
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(ContentStore);
  private readonly seo = inject(SeoService);

  readonly minGuideQuestions = MIN_GUIDE_QUESTIONS;

  private readonly routeParams = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly technology = computed(() => {
    const slug = this.routeParams().get('technology') ?? '';
    return this.store.getTechnology(slug) ?? null;
  });

  readonly questions = computed(() => {
    const tech = this.technology();
    return tech ? this.store.getQuestionsByTechnology(tech.slug) : [];
  });

  readonly topicClusters = computed(() => {
    const tech = this.technology();
    return tech
      ? this.store
          .getTopicClustersByTechnology(tech.slug, MIN_TOPIC_QUESTIONS)
          .filter((cluster) => cluster.isIndexable)
          .slice(0, 6)
      : [];
  });

  readonly levelClusters = computed(() => {
    const tech = this.technology();
    return tech
      ? this.store
          .getSeniorityClustersByTechnology(tech.slug, MIN_LEVEL_QUESTIONS)
          .filter((cluster) => cluster.isIndexable)
      : [];
  });

  readonly featuredQuestions = computed(() => {
    const tech = this.technology();
    return tech ? this.store.getFeaturedQuestions(tech.slug, 6) : [];
  });

  constructor() {
    effect(() => {
      const tech = this.technology();
      if (!tech) return;

      this.store.loadQuestionsForTechnology(tech.slug);
      this.store.loadResourcesForTechnology(tech.slug);

      const url = this.seo.absoluteUrl(`/guia/${tech.slug}`);
      const indexable = this.questions().length >= MIN_GUIDE_QUESTIONS;
      const description = `Guía de preparación para entrevistas de ${tech.name} con preguntas reales, temas frecuentes y rutas por seniority.`;

      this.seo.setPageMeta({
        title: `Guía de entrevista de ${tech.name}`,
        description,
        canonical: url,
        keywords: `${tech.name.toLowerCase()}, guía entrevista, preguntas ${tech.slug}, preparación técnica`,
        robots: indexable ? 'index,follow' : 'noindex,follow',
        schema: [
          buildBreadcrumbSchema([
            { name: 'Inicio', url: this.seo.absoluteUrl('/') },
            { name: tech.name, url: this.seo.absoluteUrl(`/${tech.slug}`) },
            { name: 'Guía', url },
          ]),
          buildCollectionPageSchema({
            name: `Guía de entrevista de ${tech.name}`,
            description,
            url,
          }),
        ],
      });
    });
  }
}
