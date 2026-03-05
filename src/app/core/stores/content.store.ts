import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MarkdownParserService } from '../../infrastructure/markdown/markdown-parser.service';
import { Question } from '../../domain/models/question.model';
import { Technology } from '../../domain/models/technology.model';

const TECHNOLOGIES: Technology[] = [
  { id: 'angular', name: 'Angular', slug: 'angular', description: 'Framework para construir aplicaciones web escalables', questionCount: 0, icon: 'code', color: '#DD0031' },
  { id: 'react', name: 'React', slug: 'react', description: 'Biblioteca para construir interfaces de usuario', questionCount: 0, icon: 'web', color: '#61DAFB' },
  { id: 'vue', name: 'Vue', slug: 'vue', description: 'Framework progresivo para interfaces de usuario', questionCount: 0, icon: 'view_quilt', color: '#42B883' },
  { id: 'nodejs', name: 'Node.js', slug: 'nodejs', description: 'Entorno de ejecución JavaScript del lado del servidor', questionCount: 0, icon: 'dns', color: '#339933' },
  { id: 'typescript', name: 'TypeScript', slug: 'typescript', description: 'Superconjunto tipado de JavaScript', questionCount: 0, icon: 'data_object', color: '#3178C6' },
  { id: 'javascript', name: 'JavaScript', slug: 'javascript', description: 'El lenguaje de programación de la web', questionCount: 0, icon: 'javascript', color: '#F7DF1E' },
  { id: 'testing', name: 'Testing', slug: 'testing', description: 'Pruebas de software y calidad del código', questionCount: 0, icon: 'bug_report', color: '#E33332' },
  { id: 'system-design', name: 'System Design', slug: 'system-design', description: 'Diseño de sistemas escalables y distribuidos', questionCount: 0, icon: 'architecture', color: '#7B1FA2' },
];

@Injectable({ providedIn: 'root' })
export class ContentStore {
  private markdownParser = inject(MarkdownParserService);
  private platformId = inject(PLATFORM_ID);

  readonly technologies = signal<Technology[]>(TECHNOLOGIES);
  readonly questions = signal<Question[]>([]);
  readonly loading = signal<boolean>(false);
  readonly darkMode = signal<boolean>(false);

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
    if (this.questionsByTechnology().has(technology)) return;
    this.loading.set(true);
    this.markdownParser.parseMarkdownFile(technology).subscribe(questions => {
      this.questions.update(current => [...current, ...questions]);
      this.technologies.update(techs =>
        techs.map(t => t.slug === technology ? { ...t, questionCount: questions.length } : t)
      );
      this.loading.set(false);
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
}
