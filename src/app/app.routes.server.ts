import { RenderMode, ServerRoute } from '@angular/ssr';
import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { generateSlug } from './core/utils/slug-generator';

const QUESTIONS_DIR = join(process.cwd(), 'questions');

function getTechnologiesWithQuestions(): string[] {
  try {
    return readdirSync(QUESTIONS_DIR, { withFileTypes: true })
      .filter(d => {
        if (!d.isDirectory()) return false;
        try {
          const index = JSON.parse(
            readFileSync(join(QUESTIONS_DIR, d.name, 'index.json'), 'utf-8'),
          ) as string[];
          return index.length > 0;
        } catch {
          return false;
        }
      })
      .map(d => d.name);
  } catch {
    return [];
  }
}

// Parses the YAML frontmatter block delimited by '---' lines,
// then falls back to the first '# Heading' in the body.
function extractTitle(content: string): string | null {
  if (content.startsWith('---')) {
    const end = content.indexOf('\n---', 3);
    if (end !== -1) {
      for (const line of content.slice(4, end).split('\n')) {
        if (line.startsWith('title:')) {
          return line.slice('title:'.length).trim();
        }
      }
    }
  }
  const titleLine = content.split(/\r?\n/).find(l => l.trim().startsWith('# '));
  return titleLine ? titleLine.replace(/^#\s+/, '').trim() : null;
}

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'contribuir',
    renderMode: RenderMode.Prerender,
  },
  {
    path: ':technology',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return getTechnologiesWithQuestions().map(technology => ({ technology }));
    },
  },
  {
    path: ':technology/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      const params: { technology: string; slug: string }[] = [];
      for (const technology of getTechnologiesWithQuestions()) {
        try {
          const files = JSON.parse(
            readFileSync(join(QUESTIONS_DIR, technology, 'index.json'), 'utf-8'),
          ) as string[];
          for (const file of files) {
            // Guard against path traversal in entries from index.json
            if (basename(file) !== file) continue;
            try {
              const content = readFileSync(join(QUESTIONS_DIR, technology, file), 'utf-8');
              const title = extractTitle(content);
              if (title) {
                params.push({ technology, slug: generateSlug(title) });
              }
            } catch {
              // skip unreadable files
            }
          }
        } catch {
          // skip technologies without a valid index
        }
      }
      return params;
    },
  },
  {
    path: 'ai-questions',
    renderMode: RenderMode.Prerender,
  },
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
