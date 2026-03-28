import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { ContentStore } from './content.store';

describe('ContentStore', () => {
  let store: ContentStore;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
        ContentStore,
      ],
    });
    store = TestBed.inject(ContentStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should initialise with all configured technologies', () => {
    expect(store.technologies().length).toBe(35);
  });

  it('should initialise with no questions loaded', () => {
    expect(store.questions().length).toBe(0);
  });

  it('should initialise with loading = false', () => {
    expect(store.loading()).toBe(false);
  });

  it('should restore dark mode from localStorage', () => {
    localStorage.setItem('darkMode', 'true');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
        ContentStore,
      ],
    });
    const freshStore = TestBed.inject(ContentStore);
    expect(freshStore.darkMode()).toBe(true);
  });

  it('should toggle dark mode and persist to localStorage', () => {
    expect(store.darkMode()).toBe(false);
    store.toggleDarkMode();
    expect(store.darkMode()).toBe(true);
    expect(localStorage.getItem('darkMode')).toBe('true');
    store.toggleDarkMode();
    expect(store.darkMode()).toBe(false);
    expect(localStorage.getItem('darkMode')).toBe('false');
  });

  it('getQuestionsByTechnology should return empty array when no questions loaded', () => {
    expect(store.getQuestionsByTechnology('angular')).toEqual([]);
  });

  it('getQuestion should return undefined when no questions loaded', () => {
    expect(store.getQuestion('angular', 'que-es-angular')).toBeUndefined();
  });

  it('questionsByTechnology computed should group questions by technology', () => {
    const q1 = { id: 'angular-q1', title: 'Q1', slug: 'q1', content: '', technology: 'angular', index: 0, difficulty: 'easy' as const, tags: [] };
    const q2 = { id: 'react-q1', title: 'Q2', slug: 'q1', content: '', technology: 'react', index: 0, difficulty: 'medium' as const, tags: [] };
    store.questions.set([q1, q2]);
    expect(store.getQuestionsByTechnology('angular')).toEqual([q1]);
    expect(store.getQuestionsByTechnology('react')).toEqual([q2]);
  });

  it('getQuestion should find a specific question by technology and slug', () => {
    const q1 = { id: 'angular-q1', title: 'Q1', slug: 'q1', content: '', technology: 'angular', index: 0, difficulty: 'easy' as const, tags: [] };
    store.questions.set([q1]);
    expect(store.getQuestion('angular', 'q1')).toEqual(q1);
    expect(store.getQuestion('angular', 'nonexistent')).toBeUndefined();
  });

  it('loadAllQuestionCounts should update technology question counts', () => {
    store.loadAllQuestionCounts();

    const techs = store.technologies();
    techs.forEach(t => {
      const req = httpMock.expectOne(`/questions/${t.slug}/index.json`);
      req.flush(['q1.md', 'q2.md', 'q3.md']);
    });

    const updatedTechs = store.technologies();
    updatedTechs.forEach(t => {
      expect(t.questionCount).toBe(3);
    });
  });

  it('loadAllQuestionCounts should handle HTTP errors gracefully', () => {
    store.loadAllQuestionCounts();

    const techs = store.technologies();
    techs.forEach(t => {
      const req = httpMock.expectOne(`/questions/${t.slug}/index.json`);
      req.error(new ProgressEvent('error'));
    });

    // All question counts should remain 0 (initial value)
    store.technologies().forEach(t => {
      expect(t.questionCount).toBe(0);
    });
  });

  it('loadQuestionsForTechnology should not make a second request when already loaded', () => {
    const q1 = { id: 'angular-q1', title: 'Q1', slug: 'q1', content: '', technology: 'angular', index: 0, difficulty: 'easy' as const, tags: [] };
    store.questions.set([q1]);

    // Calling load for a technology already in the map should be a no-op
    store.loadQuestionsForTechnology('angular');
    httpMock.expectNone('/questions/angular/index.json');
  });
});
