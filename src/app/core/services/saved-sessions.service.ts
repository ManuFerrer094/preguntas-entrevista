import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AiQuestion } from './ai-questions.service';
import { QuizQuestion, QuizDifficulty } from '../../domain/models/quiz.model';

const AI_SESSIONS_KEY = 'saved-ai-sessions';
const QUIZ_SESSIONS_KEY = 'saved-quiz-sessions';

export interface SavedAiSession {
  id: string;
  savedAt: string;
  jobDescription: string;
  technologiesDetected: string[];
  questions: AiQuestion[];
}

export interface SavedQuizSession {
  id: string;
  savedAt: string;
  jobDescription: string;
  questionCount: number;
  difficulty: QuizDifficulty;
  questions: QuizQuestion[];
}

@Injectable({ providedIn: 'root' })
export class SavedSessionsService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly savedAiSessions = signal<SavedAiSession[]>([]);
  readonly savedQuizSessions = signal<SavedQuizSession[]>([]);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.savedAiSessions.set(this.load<SavedAiSession[]>(AI_SESSIONS_KEY) ?? []);
      this.savedQuizSessions.set(this.load<SavedQuizSession[]>(QUIZ_SESSIONS_KEY) ?? []);
    }
  }

  saveAiSession(
    jobDescription: string,
    technologiesDetected: string[],
    questions: AiQuestion[],
  ): void {
    const session: SavedAiSession = {
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
      jobDescription,
      technologiesDetected,
      questions,
    };
    const updated = [session, ...this.savedAiSessions()];
    this.savedAiSessions.set(updated);
    this.persist(AI_SESSIONS_KEY, updated);
  }

  deleteAiSession(id: string): void {
    const updated = this.savedAiSessions().filter(s => s.id !== id);
    this.savedAiSessions.set(updated);
    this.persist(AI_SESSIONS_KEY, updated);
  }

  saveQuizSession(
    jobDescription: string,
    questionCount: number,
    difficulty: QuizDifficulty,
    questions: QuizQuestion[],
  ): void {
    const session: SavedQuizSession = {
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
      jobDescription,
      questionCount,
      difficulty,
      questions,
    };
    const updated = [session, ...this.savedQuizSessions()];
    this.savedQuizSessions.set(updated);
    this.persist(QUIZ_SESSIONS_KEY, updated);
  }

  deleteQuizSession(id: string): void {
    const updated = this.savedQuizSessions().filter(s => s.id !== id);
    this.savedQuizSessions.set(updated);
    this.persist(QUIZ_SESSIONS_KEY, updated);
  }

  private load<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  private persist(key: string, value: unknown): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }
}
