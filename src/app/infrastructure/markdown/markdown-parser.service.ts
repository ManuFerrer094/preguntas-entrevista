import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { marked } from 'marked';
import { Question } from '../../domain/models/question.model';
import { generateSlug } from '../../core/utils/slug-generator';

@Injectable({ providedIn: 'root' })
export class MarkdownParserService {
  private http = inject(HttpClient);

  parseMarkdownFile(technology: string): Observable<Question[]> {
    return this.http.get(`/questions/${technology}/questions.md`, { responseType: 'text' }).pipe(
      map(content => this.parseQuestions(content, technology)),
      catchError(() => of([]))
    );
  }

  parseQuestions(content: string, technology: string): Question[] {
    const sections = content.split(/\r?\n---\r?\n/);
    return sections
      .map((section, index) => this.parseSection(section.trim(), technology, index))
      .filter((q): q is Question => q !== null);
  }

  private parseSection(section: string, technology: string, index: number): Question | null {
    const lines = section.split(/\r?\n/);
    const titleLine = lines.find(l => l.trim().startsWith('# '));
    if (!titleLine) return null;

    const title = titleLine.replace(/^#\s+/, '').trim();
    const startIdx = lines.indexOf(titleLine);
    const content = lines.slice(startIdx + 1).join('\n').trim();
    const slug = generateSlug(title);
    const id = `${technology}-${slug}`;

    return { id, title, slug, content, technology, index };
  }

  renderMarkdown(content: string): string {
    return marked.parse(content) as string;
  }
}
