import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { SeoService } from '../../core/services/seo.service';
import { buildBreadcrumbSchema, buildWebPageSchema } from '../../core/seo/structured-data';

interface SitePageContent {
  title: string;
  description: string;
  body: string[];
}

const PAGES: Record<string, SitePageContent> = {
  privacy: {
    title: 'Política de privacidad',
    description:
      'Cómo tratamos los datos básicos del proyecto, qué información se recoge y cómo contactar para cualquier gestión relacionada con privacidad.',
    body: [
      'Este proyecto recopila la mínima información necesaria para ofrecer sus funcionalidades. Las secciones públicas pueden consultarse sin registro.',
      'Cuando contribuyes una pregunta o utilizas funciones conectadas con GitHub, se procesan únicamente los datos necesarios para autenticarte y asociar la autoría.',
      'Si en el futuro se activan herramientas de analítica o monetización, esta página se actualizará para reflejar con claridad qué proveedores intervienen y con qué finalidad.',
    ],
  },
  cookies: {
    title: 'Política de cookies',
    description:
      'Resumen del uso de almacenamiento local, cookies técnicas y posibles servicios de medición o monetización en el proyecto.',
    body: [
      'Actualmente el proyecto usa almacenamiento local para recordar preferencias como el tema visual y el progreso de lectura.',
      'Si se incorporan herramientas de analítica, verificación o publicidad, esta página detallará qué cookies intervienen, su duración y cómo gestionarlas.',
      'Puedes controlar o borrar el almacenamiento local desde tu navegador en cualquier momento.',
    ],
  },
  about: {
    title: 'Sobre nosotros',
    description:
      'Qué es Preguntas Entrevista, para quién está pensado y cómo se construye el contenido técnico del proyecto.',
    body: [
      'Preguntas Entrevista es una biblioteca abierta de preparación técnica en español, organizada por tecnologías y enfocada en entrevistas reales de desarrollo de software.',
      'El objetivo es ayudar a practicar mejor: menos listas vacías y más contexto sobre lo que evalúa el entrevistador, los compromisos técnicos y los errores comunes.',
      'La estrategia editorial prioriza contenido útil, actualizado y enlazado con criterio antes que crecer a base de páginas vacías o automatización sin revisión.',
    ],
  },
  contact: {
    title: 'Contacto',
    description:
      'Canales para proponer mejoras, reportar incidencias o hablar sobre colaboraciones relacionadas con el proyecto.',
    body: [
      'Si detectas un problema en una pregunta, quieres proponer una mejora editorial o colaborar con nuevo contenido, puedes usar la sección de contribución o abrir una incidencia en GitHub.',
      'Para temas relacionados con privacidad, colaboración o negocio, utiliza el correo mostrado en esta página.',
      'El proyecto da prioridad a mensajes concretos y accionables para poder responder y mejorar el sitio con rapidez.',
    ],
  },
};

@Component({
  selector: 'app-site-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="breadcrumb" aria-label="Ruta de navegación">
      <a routerLink="/">Inicio</a>
      <span aria-hidden="true"> &rsaquo; </span>
      <span>{{ page().title }}</span>
    </nav>

    <article class="page-shell">
      <header class="page-header">
        <p class="page-kicker">Confianza y transparencia</p>
        <h1>{{ page().title }}</h1>
        <p class="page-description">{{ page().description }}</p>
      </header>

      <div class="page-content">
        @for (paragraph of page().body; track paragraph) {
          <p>{{ paragraph }}</p>
        }

        @if (pageKey() === 'contact') {
          <p class="contact-email">
            Email de contacto:
            <a href="mailto:hola@preguntasentrevista.dev">hola@preguntasentrevista.dev</a>
          </p>
        }
      </div>
    </article>
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
      .page-shell {
        max-width: 860px;
        padding: 28px;
        border-radius: 24px;
        border: 1px solid var(--app-border);
        background: var(--app-surface);
        box-shadow: var(--app-shadow-sm);
      }
      .page-header {
        margin-bottom: 24px;
      }
      .page-kicker {
        margin: 0 0 10px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--app-primary);
      }
      h1 {
        margin: 0 0 10px;
        font-size: 2rem;
      }
      .page-description,
      .page-content p {
        margin: 0 0 16px;
        color: var(--app-text-muted);
        line-height: 1.7;
      }
      .contact-email a {
        color: var(--app-primary);
        font-weight: 600;
        text-decoration: none;
      }
      .contact-email a:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class SitePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  private readonly routeData = toSignal(this.route.data, {
    initialValue: this.route.snapshot.data,
  });

  readonly pageKey = computed(() => this.routeData()['page'] as string);
  readonly page = computed(() => PAGES[this.pageKey()] ?? PAGES['about']);

  constructor() {
    effect(() => {
      const currentPage = this.page();
      const path = this.route.snapshot.routeConfig?.path ?? '';
      const url = this.seo.absoluteUrl(`/${path}`);

      this.seo.setPageMeta({
        title: currentPage.title,
        description: currentPage.description,
        canonical: url,
        schema: [
          buildBreadcrumbSchema([
            { name: 'Inicio', url: this.seo.absoluteUrl('/') },
            { name: currentPage.title, url },
          ]),
          buildWebPageSchema({
            name: currentPage.title,
            description: currentPage.description,
            url,
          }),
        ],
      });
    });
  }
}
