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
import { MIN_TOPIC_QUESTIONS } from '../../core/utils/question-taxonomy';

@Component({
  selector: 'app-technology-topic',
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
        <span>{{ topicLabel() }}</span>
      </nav>

      @if (topic()) {
        <section class="hero">
          <p class="kicker">Cluster temático</p>
          <h1>{{ technology()!.name }}: {{ topic()!.label }}</h1>
          <p class="description">{{ topic()!.summary }}</p>
          <div class="hero-meta">{{ topic()!.questionCount }} preguntas relacionadas</div>
        </section>

        <section class="content-section">
          <div class="question-list">
            @for (question of topic()!.questions; track question.slug) {
              <a [routerLink]="['/', question.technology, question.slug]" class="question-link">
                <span>{{ question.title }}</span>
                <span class="question-meta">{{ question.readingTime }} min</span>
              </a>
            }
          </div>
        </section>

        @if (relatedTopics().length > 0) {
          <section class="content-section">
            <div class="section-head">
              <p class="kicker">Siguientes temas</p>
              <h2>Otros clusters de {{ technology()!.name }}</h2>
            </div>

            <div class="topic-grid">
              @for (relatedTopic of relatedTopics(); track relatedTopic.slug) {
                <a
                  [routerLink]="['/', technology()!.slug, 'tema', relatedTopic.slug]"
                  class="topic-link"
                >
                  <mf-card variant="outlined" [interactive]="true" padding="lg">
                    <h3>{{ relatedTopic.label }}</h3>
                    <p>{{ relatedTopic.questionCount }} preguntas</p>
                  </mf-card>
                </a>
              }
            </div>
          </section>
        }
      } @else {
        <mf-card variant="outlined" padding="lg">
          <h2>Topic no disponible</h2>
          <p>
            Este tema aún no tiene masa suficiente para ser una página SEO indexable. Puedes volver
            a la guía o al listado general.
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
      h2,
      h3 {
        margin: 0 0 10px;
      }
      .description,
      .topic-grid p {
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
      .topic-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }
      .topic-link {
        color: inherit;
        text-decoration: none;
      }
      .topic-link mf-card {
        display: block;
        height: 100%;
      }
      @media (max-width: 900px) {
        .topic-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class TechnologyTopicComponent {
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

  readonly topicSlug = computed(() => this.routeParams().get('tag') ?? '');

  readonly topic = computed(() => {
    const tech = this.technology();
    return tech
      ? this.store.getTopicClusterByTechnology(tech.slug, this.topicSlug(), MIN_TOPIC_QUESTIONS) ?? null
      : null;
  });

  readonly topicLabel = computed(() => this.topic()?.label ?? this.topicSlug());

  readonly relatedTopics = computed(() => {
    const tech = this.technology();
    const currentTopic = this.topic();
    if (!tech || !currentTopic) return [];

    return this.store
      .getTopicClustersByTechnology(tech.slug, MIN_TOPIC_QUESTIONS)
      .filter((cluster) => cluster.slug !== currentTopic.slug && cluster.isIndexable)
      .slice(0, 6);
  });

  constructor() {
    effect(() => {
      const tech = this.technology();
      if (!tech) return;

      this.store.loadQuestionsForTechnology(tech.slug);

      const topic = this.topic();
      const url = this.seo.absoluteUrl(`/${tech.slug}/tema/${this.topicSlug()}`);
      const description = topic
        ? `Preguntas de ${tech.name} sobre ${topic.label} para practicar decisiones reales, señales de entrevista y errores frecuentes.`
        : `Cluster temático de ${tech.name} todavía en crecimiento.`;

      this.seo.setPageMeta({
        title: topic ? `${tech.name}: ${topic.label}` : `Tema de ${tech.name}`,
        description,
        canonical: url,
        keywords: topic ? `${tech.name.toLowerCase()}, ${topic.label}, entrevista técnica` : undefined,
        robots: topic?.isIndexable ? 'index,follow' : 'noindex,follow',
        schema: topic
          ? [
              buildBreadcrumbSchema([
                { name: 'Inicio', url: this.seo.absoluteUrl('/') },
                { name: tech.name, url: this.seo.absoluteUrl(`/${tech.slug}`) },
                { name: 'Guía', url: this.seo.absoluteUrl(`/guia/${tech.slug}`) },
                { name: topic.label, url },
              ]),
              buildCollectionPageSchema({
                name: `${tech.name}: ${topic.label}`,
                description,
                url,
              }),
            ]
          : undefined,
      });
    });
  }
}
