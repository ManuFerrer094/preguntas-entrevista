import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { generateSlug } from '../utils/slug-generator';

export interface AiQuestion {
  technology: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  relevance: string;
}

export interface AiQuestionsResponse {
  technologies_detected: string[];
  questions: AiQuestion[];
}

/** Lightweight reference to an AI-selected question for cross-component navigation. */
export interface AiQuestionRef {
  technology: string;
  slug: string;
  title: string;
}

@Injectable({ providedIn: 'root' })
export class AiQuestionsService {
  private http = inject(HttpClient);

  /** The ordered list of AI-selected questions (set after generation). */
  readonly activeList = signal<AiQuestionRef[]>([]);

  generateQuestions(jobDescription: string): Observable<AiQuestionsResponse> {
    return this.http.post<AiQuestionsResponse>('/api/ai-questions', { jobDescription });
  }

  /** Persist the generated list so the question-detail page can navigate through it. */
  setActiveList(questions: AiQuestion[]): void {
    this.activeList.set(
      questions.map(q => ({ technology: q.technology, slug: generateSlug(q.title), title: q.title })),
    );
  }

  clearActiveList(): void {
    this.activeList.set([]);
  }
}
