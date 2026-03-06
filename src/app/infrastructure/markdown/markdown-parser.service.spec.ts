import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MarkdownParserService } from './markdown-parser.service';
import { generateSlug } from '../../core/utils/slug-generator';

describe('MarkdownParserService', () => {
  let service: MarkdownParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        MarkdownParserService,
      ],
    });
    service = TestBed.inject(MarkdownParserService);
  });

  // ─── parseFrontmatter ──────────────────────────────────────────────────────

  describe('parseFrontmatter', () => {
    it('should return empty metadata for content without frontmatter', () => {
      const content = '# Hello World\nSome content here.';
      const result = service.parseFrontmatter(content);
      expect(result.metadata).toEqual({});
      expect(result.body).toBe(content);
    });

    it('should parse title and difficulty from frontmatter', () => {
      const content = '---\ntitle: What is Angular?\ndifficulty: easy\n---\n# Body';
      const result = service.parseFrontmatter(content);
      expect(result.metadata.title).toBe('What is Angular?');
      expect(result.metadata.difficulty).toBe('easy');
      expect(result.body).toBe('# Body');
    });

    it('should parse tags array from frontmatter', () => {
      const content = '---\ntitle: Hooks\ndifficulty: medium\ntags: [useState, useEffect]\n---\nContent';
      const result = service.parseFrontmatter(content);
      expect(result.metadata.tags).toEqual(['useState', 'useEffect']);
    });

    it('should return empty metadata if closing --- is missing', () => {
      const content = '---\ntitle: Incomplete\n';
      const result = service.parseFrontmatter(content);
      expect(result.metadata).toEqual({});
      expect(result.body).toBe(content);
    });

    it('should handle tags with extra whitespace', () => {
      const content = '---\ntags: [ tag1 , tag2 , tag3 ]\n---\nBody';
      const result = service.parseFrontmatter(content);
      expect(result.metadata.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });
  });

  // ─── parseQuestionFile ────────────────────────────────────────────────────

  describe('parseQuestionFile', () => {
    it('should parse a question with full frontmatter', () => {
      const content = '---\ntitle: ¿Qué es Angular?\ndifficulty: easy\ntags: [Framework, DI]\n---\n# ¿Qué es Angular?\n\nAngular is a framework.';
      const question = service.parseQuestionFile(content, 'angular', 0);
      expect(question).not.toBeNull();
      expect(question!.title).toBe('¿Qué es Angular?');
      expect(question!.technology).toBe('angular');
      expect(question!.difficulty).toBe('easy');
      expect(question!.tags).toEqual(['Framework', 'DI']);
      expect(question!.slug).toBe(generateSlug('¿Qué es Angular?'));
      expect(question!.id).toBe(`angular-${question!.slug}`);
      expect(question!.index).toBe(0);
    });

    it('should fall back to extracting title from body when no frontmatter', () => {
      const content = '# What are Hooks?\n\nHooks are functions.';
      const question = service.parseQuestionFile(content, 'react', 1);
      expect(question).not.toBeNull();
      expect(question!.title).toBe('What are Hooks?');
      expect(question!.technology).toBe('react');
      expect(question!.index).toBe(1);
    });

    it('should return null when content has no title', () => {
      const content = 'Just some content without a title.';
      const question = service.parseQuestionFile(content, 'angular', 0);
      expect(question).toBeNull();
    });

    it('should default difficulty to "medium" for invalid values', () => {
      const content = '---\ntitle: Test Question\ndifficulty: unknown\n---\nContent';
      const question = service.parseQuestionFile(content, 'typescript', 0);
      expect(question!.difficulty).toBe('medium');
    });

    it('should default to empty tags array when tags are absent', () => {
      const content = '---\ntitle: Test\ndifficulty: hard\n---\nContent';
      const question = service.parseQuestionFile(content, 'vue', 0);
      expect(question!.tags).toEqual([]);
    });
  });

  // ─── renderMarkdown ───────────────────────────────────────────────────────

  describe('renderMarkdown', () => {
    it('should convert a markdown heading to HTML', () => {
      const html = service.renderMarkdown('# Hello World');
      expect(html).toContain('<h1>');
      expect(html).toContain('Hello World');
    });

    it('should convert a markdown code block to highlighted HTML', () => {
      const html = service.renderMarkdown('```javascript\nconst x = 1;\n```');
      expect(html).toContain('<pre>');
      expect(html).toContain('const');
    });

    it('should convert markdown bold text', () => {
      const html = service.renderMarkdown('**bold text**');
      expect(html).toContain('<strong>');
      expect(html).toContain('bold text');
    });
  });
});
