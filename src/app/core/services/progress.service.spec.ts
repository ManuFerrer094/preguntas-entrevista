import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ProgressService } from './progress.service';

describe('ProgressService', () => {
  let service: ProgressService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        ProgressService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    service = TestBed.inject(ProgressService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return false for a question that has not been read', () => {
    expect(service.isRead('angular-que-es-angular')).toBe(false);
  });

  it('should mark a question as read', () => {
    service.markAsRead('angular-que-es-angular');
    expect(service.isRead('angular-que-es-angular')).toBe(true);
  });

  it('should toggle a question from unread to read', () => {
    expect(service.isRead('react-que-son-hooks')).toBe(false);
    service.toggleRead('react-que-son-hooks');
    expect(service.isRead('react-que-son-hooks')).toBe(true);
  });

  it('should toggle a question from read to unread', () => {
    service.markAsRead('react-que-son-hooks');
    service.toggleRead('react-que-son-hooks');
    expect(service.isRead('react-que-son-hooks')).toBe(false);
  });

  it('should count read questions for a technology', () => {
    const ids = ['q1', 'q2', 'q3'];
    service.markAsRead('q1');
    service.markAsRead('q3');
    expect(service.getReadCountForTechnology(ids)).toBe(2);
  });

  it('should return 0 read count when none are read', () => {
    expect(service.getReadCountForTechnology(['q1', 'q2'])).toBe(0);
  });

  it('should compute progress percentage correctly', () => {
    const ids = ['q1', 'q2', 'q3', 'q4'];
    service.markAsRead('q1');
    service.markAsRead('q2');
    expect(service.getProgressPercentage(ids)).toBe(50);
  });

  it('should return 0% progress when question list is empty', () => {
    expect(service.getProgressPercentage([])).toBe(0);
  });

  it('should return 100% when all questions are read', () => {
    const ids = ['q1', 'q2'];
    service.markAsRead('q1');
    service.markAsRead('q2');
    expect(service.getProgressPercentage(ids)).toBe(100);
  });

  it('should return the total number of read questions', () => {
    service.markAsRead('q1');
    service.markAsRead('q2');
    service.markAsRead('q3');
    expect(service.getTotalRead()).toBe(3);
  });

  it('should persist read questions to localStorage', () => {
    service.markAsRead('ts-generics');
    const stored = JSON.parse(localStorage.getItem('question-progress') ?? '[]') as string[];
    expect(stored).toContain('ts-generics');
  });

  it('should restore read questions from localStorage on init', () => {
    localStorage.setItem('question-progress', JSON.stringify(['node-event-loop']));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ProgressService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    const newService = TestBed.inject(ProgressService);
    expect(newService.isRead('node-event-loop')).toBe(true);
  });
});
