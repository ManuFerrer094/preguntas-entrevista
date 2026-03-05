import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = 'question-progress';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private platformId = inject(PLATFORM_ID);
  private readQuestions = signal<Set<string>>(new Set());

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed: string[] = JSON.parse(saved);
          this.readQuestions.set(new Set(parsed));
        } catch {
          this.readQuestions.set(new Set());
        }
      }
    }
  }

  isRead(questionId: string): boolean {
    return this.readQuestions().has(questionId);
  }

  markAsRead(questionId: string): void {
    this.readQuestions.update(set => {
      const next = new Set(set);
      next.add(questionId);
      return next;
    });
    this.persist();
  }

  toggleRead(questionId: string): void {
    this.readQuestions.update(set => {
      const next = new Set(set);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
    this.persist();
  }

  getReadCountForTechnology(questionIds: string[]): number {
    const read = this.readQuestions();
    return questionIds.filter(id => read.has(id)).length;
  }

  getProgressPercentage(questionIds: string[]): number {
    if (questionIds.length === 0) return 0;
    return Math.round((this.getReadCountForTechnology(questionIds) / questionIds.length) * 100);
  }

  getTotalRead(): number {
    return this.readQuestions().size;
  }

  private persist(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.readQuestions()]));
    }
  }
}
