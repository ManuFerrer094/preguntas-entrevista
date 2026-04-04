import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of, switchMap } from 'rxjs';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import { Question } from '../../domain/models/question.model';
import {
  parseFrontmatter,
  parseQuestionFileContent,
} from './question-file.parser';

marked.use(markedHighlight({
  emptyLangClass: 'hljs',
  highlight(code: string, lang: string) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  }
}));

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
    return parseQuestionFileContent(content, technology, index);
  }

  parseFrontmatter(content: string) {
    return parseFrontmatter(content);
  }

  renderMarkdown(content: string): string {
    return marked.parse(content, { async: false }) as string;
  }
}
