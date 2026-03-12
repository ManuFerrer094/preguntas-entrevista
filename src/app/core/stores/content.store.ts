import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin, catchError, of } from 'rxjs';
import { MarkdownParserService } from '../../infrastructure/markdown/markdown-parser.service';
import { Question } from '../../domain/models/question.model';
import { Technology } from '../../domain/models/technology.model';

const TECHNOLOGIES: Technology[] = [
  // — Lenguajes principales —
  { id: 'javascript', name: 'JavaScript', slug: 'javascript', description: 'El lenguaje de programación de la web', questionCount: 0, icon: 'javascript', devicon: 'devicon-javascript-plain', color: '#F7DF1E', keywords: 'Closures, Prototypes, Async/Await y ES6+' },
  { id: 'typescript', name: 'TypeScript', slug: 'typescript', description: 'Superconjunto tipado de JavaScript', questionCount: 0, icon: 'data_object', devicon: 'devicon-typescript-plain', color: '#3178C6', keywords: 'Types, Generics, Interfaces y Utility Types' },
  { id: 'python', name: 'Python', slug: 'python', description: 'Lenguaje de propósito general y data science', questionCount: 0, icon: 'code', devicon: 'devicon-python-plain', color: '#3776AB', keywords: 'OOP, Decorators, Async, Django y Data Science' },
  { id: 'java', name: 'Java', slug: 'java', description: 'Lenguaje orientado a objetos multiplataforma', questionCount: 0, icon: 'code', devicon: 'devicon-java-plain', color: '#EA2D2E', keywords: 'OOP, Collections, Spring, JVM y Concurrencia' },
  { id: 'csharp', name: 'C#', slug: 'csharp', description: 'Lenguaje moderno de Microsoft sobre .NET', questionCount: 0, icon: 'code', devicon: 'devicon-csharp-plain', color: '#9B4993', keywords: 'LINQ, async/await, OOP, Delegates y .NET' },
  { id: 'go', name: 'Go', slug: 'go', description: 'Lenguaje compilado y concurrente de Google', questionCount: 0, icon: 'code', devicon: 'devicon-go-plain', color: '#00ACD7', keywords: 'Goroutines, Channels, Interfaces y Concurrencia' },
  { id: 'php', name: 'PHP', slug: 'php', description: 'Lenguaje de scripting para desarrollo web', questionCount: 0, icon: 'code', devicon: 'devicon-php-plain', color: '#787CB4', keywords: 'Laravel, Composer, OOP y Backend web' },
  { id: 'rust', name: 'Rust', slug: 'rust', description: 'Lenguaje de sistemas centrado en seguridad y rendimiento', questionCount: 0, icon: 'code', devicon: 'devicon-rust-original', color: '#CE422B', keywords: 'Ownership, Borrowing, Memory safety y Concurrencia' },
  { id: 'ruby', name: 'Ruby', slug: 'ruby', description: 'Lenguaje dinámico y expresivo', questionCount: 0, icon: 'code', devicon: 'devicon-ruby-plain', color: '#CC342D', keywords: 'Rails, Blocks, Metaprogramming y MVC' },
  { id: 'kotlin', name: 'Kotlin', slug: 'kotlin', description: 'Lenguaje moderno para JVM y Android', questionCount: 0, icon: 'phone_android', devicon: 'devicon-kotlin-plain', color: '#7F52FF', keywords: 'Coroutines, Null safety, Android y Extension functions' },
  { id: 'swift', name: 'Swift', slug: 'swift', description: 'Lenguaje de Apple para iOS y macOS', questionCount: 0, icon: 'phone_iphone', devicon: 'devicon-swift-plain', color: '#FA7343', keywords: 'Optionals, ARC, Protocols, iOS y SwiftUI' },
  // — Frameworks Frontend —
  { id: 'angular', name: 'Angular', slug: 'angular', description: 'Framework para construir aplicaciones web escalables', questionCount: 0, icon: 'code', devicon: 'devicon-angular-plain', color: '#DD0031', keywords: 'Dependency Injection, RxJS, Modules y Lifecycle hooks' },
  { id: 'react', name: 'React', slug: 'react', description: 'Biblioteca para construir interfaces de usuario', questionCount: 0, icon: 'web', devicon: 'devicon-react-original', color: '#61DAFB', keywords: 'Hooks, Virtual DOM, State Management y Performance' },
  { id: 'vue', name: 'Vue', slug: 'vue', description: 'Framework progresivo para interfaces de usuario', questionCount: 0, icon: 'view_quilt', devicon: 'devicon-vuejs-plain', color: '#42B883', keywords: 'Composition API, Vuex, Directives y Reactivity' },
  { id: 'nextjs', name: 'Next.js', slug: 'nextjs', description: 'Framework de React para producción con SSR/SSG', questionCount: 0, icon: 'web', devicon: 'devicon-nextjs-plain', color: '#171717', keywords: 'SSR, SSG, App Router, API Routes y Performance' },
  { id: 'svelte', name: 'Svelte', slug: 'svelte', description: 'Framework UI con compilación en build time', questionCount: 0, icon: 'web', devicon: 'devicon-svelte-plain', color: '#FF3E00', keywords: 'Reactivity, Stores, Transitions y Compiled UI' },
  { id: 'css', name: 'CSS', slug: 'css', description: 'Lenguaje de estilos para la web', questionCount: 0, icon: 'brush', devicon: 'devicon-css3-plain', color: '#1572B6', keywords: 'Flexbox, Grid, Animations, BEM y Responsive design' },
  { id: 'html', name: 'HTML', slug: 'html', description: 'Lenguaje de marcado estándar para la web', questionCount: 0, icon: 'html', devicon: 'devicon-html5-plain', color: '#E34F26', keywords: 'Semántica, Accesibilidad, SEO y Formularios' },
  // — Backend & Runtime —
  { id: 'nodejs', name: 'Node.js', slug: 'nodejs', description: 'Entorno de ejecución JavaScript del lado del servidor', questionCount: 0, icon: 'dns', devicon: 'devicon-nodejs-plain', color: '#339933', keywords: 'Event Loop, Streams, Express.js y Backend patterns' },
  { id: 'nestjs', name: 'NestJS', slug: 'nestjs', description: 'Framework progresivo de Node.js para APIs escalables', questionCount: 0, icon: 'dns', devicon: 'devicon-nestjs-plain', color: '#E0234E', keywords: 'Decorators, Modules, DI, Guards e Interceptors' },
  { id: 'dotnet', name: '.NET / ASP.NET', slug: 'dotnet', description: 'Plataforma de Microsoft para apps web y servicios', questionCount: 0, icon: 'code', devicon: 'devicon-dot-net-plain', color: '#512BD4', keywords: 'ASP.NET Core, CLR, Entity Framework, LINQ y .NET 4.8' },
  { id: 'razor', name: 'Razor', slug: 'razor', description: 'Motor de plantillas de ASP.NET Core para renderizado de vistas en el servidor', questionCount: 0, icon: 'web', devicon: 'devicon-dot-net-plain', color: '#68217A', keywords: 'Tag Helpers, Razor Pages, Layout, Partial Views y Blazor' },
  { id: 'winforms', name: 'WinForms', slug: 'winforms', description: 'Framework de escritorio de .NET para aplicaciones Windows', questionCount: 0, icon: 'desktop_windows', devicon: 'devicon-dot-net-plain', color: '#68217A', keywords: 'Ciclo de vida, Controles, Validación, Async UI y ClickOnce' },
  { id: 'django', name: 'Django', slug: 'django', description: 'Framework web de alto nivel para Python', questionCount: 0, icon: 'dns', devicon: 'devicon-django-plain', color: '#092E20', keywords: 'ORM, Middleware, MVT, REST y Autenticación' },
  { id: 'laravel', name: 'Laravel', slug: 'laravel', description: 'Framework elegante para PHP', questionCount: 0, icon: 'dns', devicon: 'devicon-laravel-plain', color: '#FF2D20', keywords: 'Eloquent, Blade, Artisan, Queue y Autenticación' },
  { id: 'spring', name: 'Spring Boot', slug: 'spring', description: 'Framework de Java para microservicios y APIs REST', questionCount: 0, icon: 'dns', devicon: 'devicon-spring-plain', color: '#6DB33F', keywords: 'IoC, DI, JPA, Security y Microservicios' },
  // — Bases de datos —
  { id: 'sql', name: 'SQL', slug: 'sql', description: 'Lenguaje estándar para bases de datos relacionales', questionCount: 0, icon: 'storage', devicon: 'devicon-postgresql-plain', color: '#336791', keywords: 'Joins, Indexes, Transactions y Query optimization' },
  { id: 'mongodb', name: 'MongoDB', slug: 'mongodb', description: 'Base de datos NoSQL orientada a documentos', questionCount: 0, icon: 'storage', devicon: 'devicon-mongodb-plain', color: '#47A248', keywords: 'Aggregations, Indexes, Schema design y NoSQL' },
  { id: 'redis', name: 'Redis', slug: 'redis', description: 'Almacén en memoria para caché y mensajería', questionCount: 0, icon: 'storage', devicon: 'devicon-redis-plain', color: '#DC382D', keywords: 'Caching, Pub/Sub, Data structures y Persistence' },
  // — APIs & Comunicación —
  { id: 'graphql', name: 'GraphQL', slug: 'graphql', description: 'Lenguaje de consulta para APIs flexible y tipado', questionCount: 0, icon: 'api', devicon: 'devicon-graphql-plain', color: '#E10098', keywords: 'Queries, Mutations, Subscriptions y Schema' },
  // — DevOps & Herramientas —
  { id: 'docker', name: 'Docker', slug: 'docker', description: 'Plataforma de contenedores para aplicaciones', questionCount: 0, icon: 'inventory_2', devicon: 'devicon-docker-plain', color: '#2496ED', keywords: 'Contenedores, Imágenes, Compose y DevOps' },
  { id: 'kubernetes', name: 'Kubernetes', slug: 'kubernetes', description: 'Sistema de orquestación de contenedores', questionCount: 0, icon: 'hub', devicon: 'devicon-kubernetes-plain', color: '#326CE5', keywords: 'Pods, Services, Deployments y Orquestación' },
  { id: 'git', name: 'Git', slug: 'git', description: 'Sistema de control de versiones distribuido', questionCount: 0, icon: 'merge', devicon: 'devicon-git-plain', color: '#F05032', keywords: 'Branching, Merging, Rebase y Workflow' },
  // — Mobile —
  { id: 'flutter', name: 'Flutter', slug: 'flutter', description: 'Framework de Google para apps multiplataforma', questionCount: 0, icon: 'phone_iphone', devicon: 'devicon-flutter-plain', color: '#54C5F8', keywords: 'Widgets, State management, Dart y Cross-platform' },
  { id: 'reactnative', name: 'React Native', slug: 'reactnative', description: 'Framework de React para apps móviles nativas', questionCount: 0, icon: 'phone_android', devicon: 'devicon-react-original', color: '#61DAFB', keywords: 'Native modules, Navigation, Expo y Cross-platform' },
];

@Injectable({ providedIn: 'root' })
export class ContentStore {
  private markdownParser = inject(MarkdownParserService);
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  readonly technologies = signal<Technology[]>(TECHNOLOGIES);
  readonly questions = signal<Question[]>([]);
  readonly loading = signal<boolean>(false);
  readonly darkMode = signal<boolean>(false);

  /** Tracks which technology slugs are currently being fetched to prevent duplicate requests. */
  private readonly loadingTechs = new Set<string>();

  readonly questionsByTechnology = computed(() => {
    const map = new Map<string, Question[]>();
    for (const q of this.questions()) {
      const list = map.get(q.technology) ?? [];
      list.push(q);
      map.set(q.technology, list);
    }
    return map;
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) {
        this.darkMode.set(saved === 'true');
      }
    }
  }

  loadQuestionsForTechnology(technology: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.questionsByTechnology().has(technology) || this.loadingTechs.has(technology)) return;
    this.loadingTechs.add(technology);
    this.loading.set(true);
    this.markdownParser.parseMarkdownFile(technology).subscribe({
      next: questions => {
        this.questions.update(current => [...current, ...questions]);
        this.technologies.update(techs =>
          techs.map(t => t.slug === technology ? { ...t, questionCount: questions.length } : t)
        );
        this.loadingTechs.delete(technology);
        this.loading.set(false);
      },
      error: () => {
        this.loadingTechs.delete(technology);
        this.loading.set(false);
      },
    });
  }

  getQuestionsByTechnology(technology: string): Question[] {
    return this.questionsByTechnology().get(technology) ?? [];
  }

  getQuestion(technology: string, slug: string): Question | undefined {
    return this.questions().find(q => q.technology === technology && q.slug === slug);
  }

  toggleDarkMode(): void {
    this.darkMode.update(v => !v);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('darkMode', String(this.darkMode()));
    }
  }

  loadAllQuestionCounts(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const techs = this.technologies();
    const requests = techs.map(t =>
      this.http
        .get<string[]>(`/questions/${t.slug}/index.json`)
        .pipe(catchError(() => of([] as string[])))
    );
    forkJoin(requests).subscribe(results => {
      this.technologies.update(current =>
        current.map((t, i) => ({ ...t, questionCount: results[i].length }))
      );
    });
  }
}
