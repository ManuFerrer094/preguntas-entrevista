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
import { MIN_LEVEL_QUESTIONS } from '../../core/utils/question-taxonomy';
import { Seniority } from '../../domain/models/question.model';

@Component({
  selector: 'app-technology-level',
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
        <a [routerLink]="['/guia', technology()!.slug]">Guía</a>
        <span aria-hidden="true"> &rsaquo; </span>
        <span>{{ levelLabel() }}</span>
      </nav>

      @if (levelCluster()) {
        <section class="hero">
          <p class="kicker">Preparación por seniority</p>
          <h1>{{ levelLabel() }} en {{ technology()!.name }}</h1>
          <p class="description">{{ levelCluster()!.description }}</p>
          <div class="hero-meta">{{ levelCluster()!.questionCount }} preguntas</div>
        </section>

        <section class="content-section">
          <div class="question-list">
            @for (question of levelCluster()!.questions; track question.slug) {
              <a [routerLink]="['/', question.technology, question.slug]" class="question-link">
                <span>{{ question.title }}</span>
                <span class="question-meta">{{ question.readingTime }} min</span>
              </a>
            }
          </div>
        </section>

        @if (otherLevels().length > 0) {
          <section class="content-section">
            <div class="level-grid">
              @for (level of otherLevels(); track level.slug) {
                <a [routerLink]="['/', technology()!.slug, 'nivel', level.slug]" class="level-link">
                  <mf-card variant="outlined" [interactive]="true" padding="lg">
                    <h2>{{ level.label }}</h2>
                    <p>{{ level.questionCount }} preguntas</p>
                  </mf-card>
                </a>
              }
            </div>
          </section>
        }
      } @else {
        <mf-card variant="outlined" padding="lg">
          <h2>Nivel no disponible</h2>
          <p>
            Esta combinación aún no tiene suficiente masa para ser una página indexable. Puedes
            volver a la guía o practicar desde el listado general.
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
      .breadcrumb a {
        color: var(--app-primary);
        text-decoration: none;
      }
      .breadcrumb a:hover {
        text-decoration: underline;
      }
      .hero {
        padding: 28px;
        border-radius: 24px;
        border: 1px solid var(--app-border);
        background: var(--app-surface);
        box-shadow: var(--app-shadow-sm);
      }
      .kicker {
        margin: 0 0 8px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--app-primary);
      }
      h1,
      h2 {
        margin: 0 0 10px;
      }
      .description,
      .level-grid p {
        margin: 0;
        color: var(--app-text-muted);
        line-height: 1.6;
      }
      .hero-meta {
        margin-top: 14px;
        color: var(--app-primary);
        font-weight: 700;
      }
      .content-section {
        margin-top: 24px;
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
        text-decoration: none;
        color: inherit;
      }
      .question-link:hover {
        border-color: var(--app-primary);
      }
      .question-meta {
        color: var(--app-text-muted);
        font-size: 0.82rem;
      }
      .level-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }
      .level-link {
        color: inherit;
        text-decoration: none;
      }
      .level-link mf-card {
        display: block;
        height: 100%;
      }
      @media (max-width: 900px) {
        .level-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class TechnologyLevelComponent {
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(ContentStore);
  private readonly seo = inject(SeoService);

  private readonly routeParams = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly technology = computed(() => {
    const slug = this.routeParams().get('technology') ?? '';
    return this.store.getTechnology(slug) ?? null;
  });

  readonly levelSlug = computed(() => (this.routeParams().get('level') ?? 'mid') as Seniority);

  readonly levelCluster = computed(() => {
    const tech = this.technology();
    return tech
      ? this.store
          .getSeniorityClustersByTechnology(tech.slug, MIN_LEVEL_QUESTIONS)
          .find((cluster) => cluster.slug === this.levelSlug()) ?? null
      : null;
  });

  readonly levelLabel = computed(() => this.levelCluster()?.label ?? this.levelSlug());

  readonly otherLevels = computed(() => {
    const tech = this.technology();
    const current = this.levelCluster();
    if (!tech || !current) return [];

    return this.store
      .getSeniorityClustersByTechnology(tech.slug, MIN_LEVEL_QUESTIONS)
      .filter((cluster) => cluster.slug !== current.slug && cluster.isIndexable);
  });

  constructor() {
    effect(() => {
      const tech = this.technology();
      if (!tech) return;

      this.store.loadQuestionsForTechnology(tech.slug);

      const cluster = this.levelCluster();
      const url = this.seo.absoluteUrl(`/${tech.slug}/nivel/${this.levelSlug()}`);
      const description = cluster
        ? `Preguntas de ${tech.name} orientadas a nivel ${cluster.label.toLowerCase()} con foco en señales de entrevista y profundidad técnica.`
        : `Preparación por nivel para ${tech.name}.`;

      this.seo.setPageMeta({
        title: cluster ? `${cluster.label} de ${tech.name}` : `Nivel de ${tech.name}`,
        description,
        canonical: url,
        keywords: cluster ? `${tech.name.toLowerCase()}, ${cluster.label.toLowerCase()}, entrevista técnica` : undefined,
        robots: cluster?.isIndexable ? 'index,follow' : 'noindex,follow',
        schema: cluster
          ? [
              buildBreadcrumbSchema([
                { name: 'Inicio', url: this.seo.absoluteUrl('/') },
                { name: tech.name, url: this.seo.absoluteUrl(`/${tech.slug}`) },
                { name: 'Guía', url: this.seo.absoluteUrl(`/guia/${tech.slug}`) },
                { name: cluster.label, url },
              ]),
              buildCollectionPageSchema({
                name: `${cluster.label} de ${tech.name}`,
                description,
                url,
              }),
            ]
          : undefined,
      });
    });
  }
}
