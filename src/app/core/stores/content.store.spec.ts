import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { ContentStore } from './content.store';

function makeQuestion(
  partial: Partial<{
    id: string;
    title: string;
    slug: string;
    technology: string;
    index: number;
    difficulty: 'easy' | 'medium' | 'hard';
    seniority: 'junior' | 'mid' | 'senior';
    tags: string[];
    topicSlug: string;
    summary: string;
    readingTime: number;
    isIndexable: boolean;
  }> = {},
) {
  return {
    id: partial.id ?? 'angular-q1',
    title: partial.title ?? 'Q1',
    slug: partial.slug ?? 'q1',
    content: '',
    technology: partial.technology ?? 'angular',
    index: partial.index ?? 0,
    difficulty: partial.difficulty ?? 'medium',
    seniority: partial.seniority ?? 'mid',
    tags: partial.tags ?? [],
    topicSlug: partial.topicSlug ?? 'general',
    summary: partial.summary ?? 'Resumen',
    readingTime: partial.readingTime ?? 1,
    isIndexable: partial.isIndexable ?? true,
  };
}

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
    const q1 = makeQuestion({ technology: 'angular', difficulty: 'easy', seniority: 'junior' });
    const q2 = makeQuestion({
      id: 'react-q1',
      title: 'Q2',
      technology: 'react',
      difficulty: 'medium',
      seniority: 'mid',
    });
    store.questions.set([q1, q2]);
    expect(store.getQuestionsByTechnology('angular')).toEqual([q1]);
    expect(store.getQuestionsByTechnology('react')).toEqual([q2]);
  });

  it('getQuestion should find a specific question by technology and slug', () => {
    const q1 = makeQuestion({ difficulty: 'easy', seniority: 'junior' });
    store.questions.set([q1]);
    expect(store.getQuestion('angular', 'q1')).toEqual(q1);
    expect(store.getQuestion('angular', 'nonexistent')).toBeUndefined();
  });

  it('loadAllQuestionCounts should update technology question counts', () => {
    store.loadAllQuestionCounts();

    const techs = store.technologies();
    techs.forEach((t) => {
      const req = httpMock.expectOne(`/questions/${t.slug}/index.json`);
      req.flush(['q1.md', 'q2.md', 'q3.md']);
    });

    const updatedTechs = store.technologies();
    updatedTechs.forEach((t) => {
      expect(t.questionCount).toBe(3);
    });
  });

  it('loadAllQuestionCounts should handle HTTP errors gracefully', () => {
    store.loadAllQuestionCounts();

    const techs = store.technologies();
    techs.forEach((t) => {
      const req = httpMock.expectOne(`/questions/${t.slug}/index.json`);
      req.error(new ProgressEvent('error'));
    });

    // All question counts should remain 0 (initial value)
    store.technologies().forEach((t) => {
      expect(t.questionCount).toBe(0);
    });
  });

  it('loadQuestionsForTechnology should not make a second request when already loaded', () => {
    const q1 = makeQuestion({ difficulty: 'easy', seniority: 'junior' });
    store.questions.set([q1]);

    // Calling load for a technology already in the map should be a no-op
    store.loadQuestionsForTechnology('angular');
    httpMock.expectNone('/questions/angular/index.json');
  });

  it('loadAllResourceCounts should update technology resource counts', () => {
    store.loadAllResourceCounts();

    const req = httpMock.expectOne('/resources/manifest.json');
    req.flush({ angular: 5, vue: 3, mongodb: 1 });

    expect(store.getTechnology('angular')?.resourceCount).toBe(5);
    expect(store.getTechnology('vue')?.resourceCount).toBe(3);
    expect(store.getTechnology('mongodb')?.resourceCount).toBe(1);
    expect(store.getTechnology('csharp')?.resourceCount).toBe(0);
  });

  it('loadResourcesForTechnology should load and cache resources', () => {
    store.loadResourcesForTechnology('vue');

    const req = httpMock.expectOne('/resources/vue.json');
    req.flush([
      {
        id: 'vue-resource-1',
        technology: 'vue',
        title: 'Vue Interview questions',
        url: 'https://example.com/vue',
        section: 'Preguntas más frecuentes',
        subsection: 'Preguntas más frecuentes',
        host: 'example.com',
      },
    ]);

    expect(store.getResourcesByTechnology('vue')).toHaveLength(1);
    expect(store.getTechnology('vue')?.resourceCount).toBe(1);

    store.loadResourcesForTechnology('vue');
    httpMock.expectNone('/resources/vue.json');
  });

  it('loadResourcesForTechnology should cache empty results too', () => {
    store.loadResourcesForTechnology('winforms');

    const req = httpMock.expectOne('/resources/winforms.json');
    req.flush([]);

    expect(store.getResourcesByTechnology('winforms')).toEqual([]);
    expect(store.getTechnology('winforms')?.resourceCount).toBe(0);

    store.loadResourcesForTechnology('winforms');
    httpMock.expectNone('/resources/winforms.json');
  });

  it('should derive topic and seniority clusters from loaded questions', () => {
    store.questions.set([
      makeQuestion({
        id: 'vue-1',
        technology: 'vue',
        slug: 'vue-1',
        tags: ['architecture'],
        topicSlug: 'architecture',
        difficulty: 'hard',
        seniority: 'senior',
      }),
      makeQuestion({
        id: 'vue-2',
        technology: 'vue',
        slug: 'vue-2',
        tags: ['architecture'],
        topicSlug: 'architecture',
        difficulty: 'hard',
        seniority: 'senior',
        index: 1,
      }),
      makeQuestion({
        id: 'vue-3',
        technology: 'vue',
        slug: 'vue-3',
        tags: ['architecture'],
        topicSlug: 'architecture',
        difficulty: 'hard',
        seniority: 'senior',
        index: 2,
      }),
      makeQuestion({
        id: 'vue-4',
        technology: 'vue',
        slug: 'vue-4',
        tags: ['architecture'],
        topicSlug: 'architecture',
        difficulty: 'hard',
        seniority: 'senior',
        index: 3,
      }),
      makeQuestion({
        id: 'vue-5',
        technology: 'vue',
        slug: 'vue-5',
        tags: ['pinia'],
        topicSlug: 'pinia',
        difficulty: 'medium',
        seniority: 'mid',
        index: 4,
      }),
      makeQuestion({
        id: 'vue-6',
        technology: 'vue',
        slug: 'vue-6',
        tags: ['pinia'],
        topicSlug: 'pinia',
        difficulty: 'medium',
        seniority: 'mid',
        index: 5,
      }),
      makeQuestion({
        id: 'vue-7',
        technology: 'vue',
        slug: 'vue-7',
        tags: ['pinia'],
        topicSlug: 'pinia',
        difficulty: 'medium',
        seniority: 'mid',
        index: 6,
      }),
      makeQuestion({
        id: 'vue-8',
        technology: 'vue',
        slug: 'vue-8',
        tags: ['pinia'],
        topicSlug: 'pinia',
        difficulty: 'medium',
        seniority: 'mid',
        index: 7,
      }),
      makeQuestion({
        id: 'vue-9',
        technology: 'vue',
        slug: 'vue-9',
        tags: ['pinia'],
        topicSlug: 'pinia',
        difficulty: 'medium',
        seniority: 'mid',
        index: 8,
      }),
      makeQuestion({
        id: 'vue-10',
        technology: 'vue',
        slug: 'vue-10',
        tags: ['pinia'],
        topicSlug: 'pinia',
        difficulty: 'medium',
        seniority: 'mid',
        index: 9,
      }),
    ]);
    store.technologies.update((techs) =>
      techs.map((tech) => (tech.slug === 'vue' ? { ...tech, questionCount: 10 } : tech)),
    );

    const topics = store.getTopicClustersByTechnology('vue');
    const levels = store.getSeniorityClustersByTechnology('vue');

    expect(topics[0].slug).toBe('pinia');
    expect(topics[0].questionCount).toBe(6);
    expect(levels.find((level) => level.slug === 'senior')?.questionCount).toBe(4);
    expect(levels.find((level) => level.slug === 'mid')?.questionCount).toBe(6);
    expect(store.isGuideIndexable('vue')).toBe(false);
  });
});
