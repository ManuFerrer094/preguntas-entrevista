import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MfCardComponent, MfIconComponent } from 'ng-comps';
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
  selector: 'app-technology',
  standalone: true,
  imports: [RouterLink, MfCardComponent, MfIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (technology()) {
      <nav class="breadcrumb" aria-label="Ruta de navegación">
        <a routerLink="/">Inicio</a>
        <span aria-hidden="true"> &rsaquo; </span>
        <span>{{ technology()!.name }}</span>
      </nav>

      <section class="landing-hero">
        <div class="landing-hero-main">
          <div class="landing-icon" [style.background]="technology()!.color + '15'">
            <i [class]="technology()!.devicon" [style.color]="technology()!.color"></i>
          </div>
          <div class="landing-copy">
            <p class="landing-kicker">Ruta de preparación</p>
            <h1>{{ technology()!.name }}</h1>
            <p class="landing-desc">{{ technology()!.description }}</p>
            <p class="landing-keywords">{{ technology()!.keywords }}</p>
          </div>
        </div>

        <div class="landing-stats">
          <span class="stat-pill">
            <mf-icon name="quiz" color="inherit" />
            {{ questions().length }} preguntas
          </span>
          <span class="stat-pill subtle">
            <mf-icon name="library_books" color="inherit" />
            {{ technology()!.resourceCount }} recursos
          </span>
        </div>
      </section>

      <section class="entry-grid" aria-label="Explorar {{ technology()!.name }}">
        <a [routerLink]="['/', technology()!.slug, 'preguntas']" class="entry-link">
          <mf-card variant="outlined" [interactive]="true" padding="lg" class="entry-card">
            <div class="entry-top">
              <span class="entry-eyebrow">Practicar</span>
              <mf-icon name="arrow_forward" color="inherit" />
            </div>
            <h2>Preguntas de entrevista</h2>
            <p>
              Accede al listado filtrable, marca progreso y navega por preguntas reales de
              {{ technology()!.name }}.
            </p>
            <div class="entry-footer">
              <span class="entry-count">{{ questions().length }} preguntas</span>
              <span class="entry-cta">Entrar</span>
            </div>
          </mf-card>
        </a>

        <a [routerLink]="['/', technology()!.slug, 'recursos']" class="entry-link">
          <mf-card variant="outlined" [interactive]="true" padding="lg" class="entry-card">
            <div class="entry-top">
              <span class="entry-eyebrow">Reforzar</span>
              <mf-icon name="arrow_forward" color="inherit" />
            </div>
            <h2>Recursos</h2>
            <p>
              Consulta enlaces curados y materiales específicos para repasar conceptos, patrones y
              entrevistas.
            </p>
            <div class="entry-footer">
              <span class="entry-count">{{ technology()!.resourceCount }} recursos</span>
              <span class="entry-cta">Explorar</span>
            </div>
          </mf-card>
        </a>
      </section>

      @if (questions().length >= minGuideQuestions) {
        <section class="clusters-grid" aria-label="Clusters de {{ technology()!.name }}">
          <a [routerLink]="['/guia', technology()!.slug]" class="entry-link">
            <mf-card variant="outlined" [interactive]="true" padding="lg" class="entry-card">
              <div class="entry-top">
                <span class="entry-eyebrow">Evergreen</span>
                <mf-icon name="north_east" color="inherit" />
              </div>
              <h2>Guía de entrevista</h2>
              <p>
                Ruta editorial con temas fuertes, bloques por nivel y preguntas destacadas para
                preparar {{ technology()!.name }} con más intención.
              </p>
            </mf-card>
          </a>

          @if (topTopic()) {
            <a [routerLink]="['/', technology()!.slug, 'tema', topTopic()!.slug]" class="entry-link">
              <mf-card variant="outlined" [interactive]="true" padding="lg" class="entry-card">
                <div class="entry-top">
                  <span class="entry-eyebrow">Tema principal</span>
                  <mf-icon name="north_east" color="inherit" />
                </div>
                <h2>{{ topTopic()!.label }}</h2>
                <p>{{ topTopic()!.questionCount }} preguntas conectadas sobre un mismo patrón.</p>
              </mf-card>
            </a>
          }

          @if (topLevel()) {
            <a [routerLink]="['/', technology()!.slug, 'nivel', topLevel()!.slug]" class="entry-link">
              <mf-card variant="outlined" [interactive]="true" padding="lg" class="entry-card">
                <div class="entry-top">
                  <span class="entry-eyebrow">Nivel activo</span>
                  <mf-icon name="north_east" color="inherit" />
                </div>
                <h2>{{ topLevel()!.label }}</h2>
                <p>{{ topLevel()!.description }}</p>
              </mf-card>
            </a>
          }
        </section>
      }

      <section class="support-grid" aria-label="Qué encontrarás">
        <mf-card variant="outlined" padding="lg">
          <p class="support-kicker">Qué encontrarás</p>
          <h3>Preparación guiada</h3>
          <p>
            Empieza con práctica o refuerza conceptos con recursos específicos sin salir del flujo
            por tecnología.
          </p>
        </mf-card>

        <mf-card variant="outlined" padding="lg">
          <p class="support-kicker">Estado actual</p>
          <h3>Sección viva y ampliable</h3>
          <p>
            Si alguna de las dos áreas está vacía, la vista mostrará el estado correspondiente y
            quedará preparada para futuras aportaciones.
          </p>
        </mf-card>
      </section>
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
      .landing-hero {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
        padding: 32px;
        border: 1px solid var(--app-border);
        border-radius: 28px;
        background:
          linear-gradient(
            135deg,
            color-mix(in srgb, var(--app-primary) 8%, transparent),
            transparent 55%
          ),
          var(--app-surface);
        box-shadow: var(--app-shadow-sm);
        margin-bottom: 24px;
      }
      .landing-hero-main {
        display: flex;
        align-items: center;
        gap: 18px;
        min-width: 0;
      }
      .landing-icon {
        width: 72px;
        height: 72px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .landing-icon i {
        font-size: 38px;
      }
      .landing-copy h1 {
        margin: 0 0 8px;
        font-size: 2rem;
      }
      .landing-kicker,
      .support-kicker {
        margin: 0 0 8px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.72rem;
        font-weight: 600;
        color: var(--app-primary);
      }
      .landing-desc,
      .landing-keywords {
        margin: 0;
        color: var(--app-text-muted);
        line-height: 1.6;
      }
      .landing-keywords {
        margin-top: 8px;
      }
      .landing-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: flex-end;
      }
      .stat-pill,
      .entry-count {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--app-primary) 10%, transparent);
        color: var(--app-primary);
        font-weight: 700;
        font-size: 0.9rem;
      }
      .stat-pill.subtle {
        background: var(--app-surface-variant);
        color: var(--app-text-muted);
      }
      .entry-grid,
      .support-grid,
      .clusters-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
      }
      .entry-grid,
      .clusters-grid {
        margin-bottom: 18px;
      }
      .clusters-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .entry-link {
        text-decoration: none;
        color: inherit;
        display: block;
      }
      .entry-card {
        display: block;
        height: 100%;
        border: 1px solid var(--app-border);
        background: var(--app-surface);
        transition:
          transform 0.2s,
          border-color 0.2s,
          box-shadow 0.2s;
      }
      .entry-link:hover .entry-card {
        transform: translateY(-2px);
        border-color: var(--app-primary);
        box-shadow: var(--app-shadow-sm);
      }
      .entry-top,
      .entry-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .entry-top {
        margin-bottom: 16px;
        color: var(--app-primary);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.75rem;
      }
      .entry-card h2 {
        margin: 0 0 10px;
        font-size: 1.25rem;
      }
      .entry-card p {
        margin: 0 0 18px;
        color: var(--app-text-muted);
        line-height: 1.55;
        min-height: 3.2em;
      }
      .entry-cta {
        color: var(--app-primary);
        font-weight: 700;
      }
      .support-grid mf-card {
        display: block;
      }
      .support-grid h3 {
        margin: 0 0 8px;
        font-size: 1.05rem;
      }
      .support-grid p:last-child {
        margin: 0;
        color: var(--app-text-muted);
        line-height: 1.55;
      }
      @media (max-width: 900px) {
        .landing-hero {
          flex-direction: column;
          align-items: flex-start;
        }
        .landing-stats {
          justify-content: flex-start;
        }
        .entry-grid,
        .support-grid,
        .clusters-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class TechnologyComponent {
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

  readonly topTopic = computed(() => {
    const tech = this.technology();
    return tech
      ? this.store.getTopicClustersByTechnology(tech.slug, MIN_TOPIC_QUESTIONS).find((cluster) => cluster.isIndexable) ??
          null
      : null;
  });

  readonly topLevel = computed(() => {
    const tech = this.technology();
    return tech
      ? this.store
          .getSeniorityClustersByTechnology(tech.slug, MIN_LEVEL_QUESTIONS)
          .find((cluster) => cluster.isIndexable) ?? null
      : null;
  });

  constructor() {
    effect(() => {
      const tech = this.technology();
      if (!tech) return;

      this.store.loadQuestionsForTechnology(tech.slug);
      this.store.loadResourcesForTechnology(tech.slug);

      const url = this.seo.absoluteUrl(`/${tech.slug}`);
      const indexable = this.questions().length > 0;
      const description = `Explora la ruta de preparación para ${tech.name} con preguntas de entrevista, recursos específicos y clusters temáticos en una misma landing.`;

      this.seo.setPageMeta({
        title: `${tech.name} · Preguntas y recursos`,
        description,
        canonical: url,
        keywords: `${tech.name.toLowerCase()}, preguntas, recursos, entrevistas tecnicas`,
        robots: indexable ? 'index,follow' : 'noindex,follow',
        schema: [
          buildBreadcrumbSchema([
            { name: 'Inicio', url: this.seo.absoluteUrl('/') },
            { name: tech.name, url },
          ]),
          buildCollectionPageSchema({
            name: tech.name,
            description,
            url,
          }),
        ],
      });
    });
  }
}
