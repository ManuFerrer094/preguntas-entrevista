import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of, switchMap } from 'rxjs';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import { Question, Difficulty } from '../../domain/models/question.model';
import { generateSlug } from '../../core/utils/slug-generator';

marked.use(markedHighlight({
  emptyLangClass: 'hljs',
  highlight(code: string, lang: string) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  }
}));

interface Frontmatter {
  title?: string;
  difficulty?: Difficulty;
  tags?: string[];
}

@Injectable({ providedIn: 'root' })
export class MarkdownParserService {
  private http = inject(HttpClient);

  parseMarkdownFile(technology: string): Observable<Question[]> {
    return this.http
      .get<string[]>(`/questions/${technology}/index.json`)
      .pipe(
        switchMap(files =>
          files.length === 0
            ? of([])
            : forkJoin(
                files.map((filename, index) =>
                  this.http
                    .get(`/questions/${technology}/${filename}`, { responseType: 'text' })
                    .pipe(
                      map(content => this.parseQuestionFile(content, technology, index)),
                      catchError(() => of(null)),
                    ),
                ),
              ).pipe(map(results => results.filter((q): q is Question => q !== null))),
        ),
        catchError(() => of([])),
      );
  }

  parseQuestionFile(content: string, technology: string, index: number): Question | null {
    const { metadata, body } = this.parseFrontmatter(content);

    const title = metadata.title ?? this.extractTitleFromBody(body);
    if (!title) return null;

    const slug = generateSlug(title);
    const id = `${technology}-${slug}`;
    const difficulty: Difficulty = (['easy', 'medium', 'hard'] as Difficulty[]).includes(
      metadata.difficulty as Difficulty,
    )
      ? (metadata.difficulty as Difficulty)
      : 'medium';
    const tags: string[] = Array.isArray(metadata.tags) ? metadata.tags : [];

    return { id, title, slug, content: body, technology, index, difficulty, tags };
  }

  parseFrontmatter(content: string): { metadata: Frontmatter; body: string } {
    if (!content.startsWith('---')) {
      return { metadata: {}, body: content };
    }
    const end = content.indexOf('\n---', 3);
    if (end === -1) {
      return { metadata: {}, body: content };
    }

    const raw = content.slice(4, end);
    const body = content.slice(end + 4).trim();
    const metadata: Frontmatter = {};

    for (const line of raw.split('\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim() as keyof Frontmatter;
      const value = line.slice(colonIdx + 1).trim();
      if (key === 'tags') {
        const inner = value.replace(/^\[|\]$/g, '');
        (metadata as Record<string, unknown>)[key] = inner
          .split(',')
          .map(v => v.trim())
          .filter(v => v.length > 0);
      } else {
        (metadata as Record<string, unknown>)[key] = value;
      }
    }

    return { metadata, body };
  }

  private extractTitleFromBody(body: string): string | null {
    const lines = body.split(/\r?\n/);
    const titleLine = lines.find(l => l.trim().startsWith('# '));
    return titleLine ? titleLine.replace(/^#\s+/, '').trim() : null;
  }

  renderMarkdown(content: string): string {
    return marked.parse(content, { async: false }) as string;
  }
}
