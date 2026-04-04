import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MfCardComponent, MfIconComponent, MfProgressSpinnerComponent } from 'ng-comps';
import { ContentStore } from '../../core/stores/content.store';
import { SeoService } from '../../core/services/seo.service';
import { TechnologyResource } from '../../domain/models';

interface ResourceGroup {
  id: string;
  section: string;
  title: string;
  resources: TechnologyResource[];
}

@Component({
  selector: 'app-technology-resources',
  standalone: true,
  imports: [RouterLink, MfCardComponent, MfIconComponent, MfProgressSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (technology()) {
      <nav class="breadcrumb" aria-label="Ruta de navegación">
        <a routerLink="/">Inicio</a>
        <span aria-hidden="true"> &rsaquo; </span>
        <a [routerLink]="['/', technology()!.slug]">{{ technology()!.name }}</a>
        <span aria-hidden="true"> &rsaquo; </span>
        <span>Recursos</span>
      </nav>

      <section class="resources-hero">
        <div class="hero-main">
          <div class="hero-icon" [style.background]="technology()!.color + '15'">
            <i [class]="technology()!.devicon" [style.color]="technology()!.color"></i>
          </div>
          <div class="hero-copy">
            <p class="hero-kicker">Curado desde la guía externa</p>
            <h1>Recursos de {{ technology()!.name }}</h1>
            <p>
              Enlaces específicos para repasar conceptos, patrones y preparación de entrevistas en
              {{ technology()!.name }}.
            </p>
          </div>
        </div>

        <div class="hero-actions">
          <a [routerLink]="['/', technology()!.slug]" class="hero-link">
            <mf-icon name="dashboard" color="inherit" />
            Resumen
          </a>
          <a [routerLink]="['/', technology()!.slug, 'preguntas']" class="hero-link accent">
            <mf-icon name="quiz" color="inherit" />
            Ver preguntas
          </a>
        </div>
      </section>

      @if (store.resourcesLoading() && resources().length === 0) {
        <div class="loading-state">
          <mf-progress-spinner mode="indeterminate" [diameter]="40" label="Cargando recursos..." />
        </div>
      } @else if (groupedResources().length > 0) {
        <div class="resource-summary">
          <span class="summary-pill">
            <mf-icon name="library_books" color="inherit" />
            {{ resources().length }} recursos específicos
          </span>
        </div>

        <div class="resource-sections">
          @for (group of groupedResources(); track group.id) {
            <section class="resource-group" [attr.aria-label]="group.title">
              <div class="group-heading">
                <p class="group-section">{{ group.section }}</p>
                <h2>{{ group.title }}</h2>
              </div>

              <div class="resource-grid">
                @for (resource of group.resources; track resource.id) {
                  <a
                    [href]="resource.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="resource-card-link"
                  >
                    <mf-card
                      variant="outlined"
                      [interactive]="true"
                      padding="lg"
                      class="resource-card"
                    >
                      <div class="resource-card-top">
                        <span class="resource-host">{{ resource.host }}</span>
                        <mf-icon name="open_in_new" color="inherit" />
                      </div>
                      <h3>{{ resource.title }}</h3>
                      <p>{{ resource.subsection }}</p>
                    </mf-card>
                  </a>
                }
              </div>
            </section>
          }
        </div>
      } @else {
        <mf-card variant="outlined" padding="lg" class="empty-card">
          <div class="empty-content">
            <mf-icon name="library_books" color="inherit" />
            <div>
              <h2>Aún no hay recursos específicos para {{ technology()!.name }}</h2>
              <p>
                La landing sigue lista para futuras curaciones. Mientras tanto, puedes practicar las
                preguntas disponibles.
              </p>
            </div>
          </div>
          <a [routerLink]="['/', technology()!.slug, 'preguntas']" class="empty-link"
            >Ir a preguntas</a
          >
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
      .resources-hero {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        padding: 28px;
        border-radius: 24px;
        border: 1px solid var(--app-border);
        background:
          radial-gradient(
            circle at top left,
            color-mix(in srgb, var(--app-primary) 12%, transparent),
            transparent 40%
          ),
          var(--app-surface);
        box-shadow: var(--app-shadow-sm);
        margin-bottom: 24px;
      }
      .hero-main {
        display: flex;
        gap: 18px;
        align-items: center;
        min-width: 0;
      }
      .hero-icon {
        width: 64px;
        height: 64px;
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .hero-icon i {
        font-size: 34px;
      }
      .hero-kicker {
        margin: 0 0 8px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--app-primary);
      }
      .hero-copy h1 {
        margin: 0 0 8px;
        font-size: 1.8rem;
      }
      .hero-copy p {
        margin: 0;
        color: var(--app-text-muted);
        line-height: 1.55;
      }
      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: flex-start;
        justify-content: flex-end;
      }
      .hero-link,
      .empty-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: 12px;
        border: 1px solid var(--app-border);
        background: var(--app-surface);
        color: var(--app-text);
        text-decoration: none;
        font-weight: 600;
        transition:
          border-color 0.2s,
          transform 0.2s,
          box-shadow 0.2s;
      }
      .hero-link:hover,
      .empty-link:hover {
        border-color: var(--app-primary);
        box-shadow: var(--app-shadow-sm);
        transform: translateY(-1px);
      }
      .hero-link.accent,
      .empty-link {
        color: var(--app-primary);
      }
      .loading-state {
        display: flex;
        justify-content: center;
        padding: 56px 0;
      }
      .resource-summary {
        margin-bottom: 20px;
      }
      .summary-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--app-primary) 10%, transparent);
        color: var(--app-primary);
        font-weight: 700;
      }
      .resource-sections {
        display: flex;
        flex-direction: column;
        gap: 28px;
      }
      .group-heading {
        margin-bottom: 14px;
      }
      .group-section {
        margin: 0 0 6px;
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--app-text-muted);
      }
      .group-heading h2 {
        margin: 0;
        font-size: 1.25rem;
      }
      .resource-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 16px;
      }
      .resource-card-link {
        text-decoration: none;
        color: inherit;
      }
      .resource-card {
        display: block;
        height: 100%;
      }
      .resource-card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 12px;
      }
      .resource-host {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 999px;
        background: var(--app-surface-variant);
        border: 1px solid var(--app-border);
        color: var(--app-text-muted);
        font-size: 0.76rem;
        font-weight: 600;
      }
      .resource-card h3 {
        margin: 0 0 8px;
        font-size: 1rem;
        line-height: 1.45;
      }
      .resource-card p {
        margin: 0;
        color: var(--app-text-muted);
        line-height: 1.5;
        font-size: 0.9rem;
      }
      .empty-card {
        display: block;
        margin-top: 16px;
      }
      .empty-content {
        display: flex;
        gap: 14px;
        align-items: flex-start;
        margin-bottom: 16px;
      }
      .empty-content mf-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: var(--app-primary);
        flex-shrink: 0;
      }
      .empty-content h2 {
        margin: 0 0 6px;
        font-size: 1.15rem;
      }
      .empty-content p {
        margin: 0;
        color: var(--app-text-muted);
        line-height: 1.55;
      }
      @media (max-width: 800px) {
        .resources-hero {
          flex-direction: column;
        }
        .hero-main {
          align-items: flex-start;
        }
        .hero-actions {
          justify-content: flex-start;
        }
      }
    `,
  ],
})
export class TechnologyResourcesComponent {
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

  readonly resources = computed(() => {
    const tech = this.technology();
    if (!tech) return [];
    return this.store.getResourcesByTechnology(tech.slug);
  });

  readonly groupedResources = computed<ResourceGroup[]>(() => {
    const groups = new Map<string, ResourceGroup>();

    for (const resource of this.resources()) {
      const title =
        resource.subsection && resource.subsection !== resource.section
          ? resource.subsection
          : resource.section;
      const key = `${resource.section}::${resource.subsection}`;
      const current = groups.get(key) ?? {
        id: key,
        section: resource.section,
        title,
        resources: [],
      };
      current.resources.push(resource);
      groups.set(key, current);
    }

    return Array.from(groups.values());
  });

  constructor() {
    effect(() => {
      const tech = this.technology();
      if (!tech) return;

      this.store.loadResourcesForTechnology(tech.slug);
      this.seo.setPageMeta({
        title: `Recursos para entrevistas de ${tech.name}`,
        description: `Recursos específicos de ${tech.name} para reforzar conceptos, buenas prácticas y preparación de entrevistas técnicas.`,
        keywords: `${tech.name.toLowerCase()}, recursos, entrevistas técnicas, guía, enlaces`,
      });
    });
  }
}
