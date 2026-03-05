import { RenderMode, ServerRoute } from '@angular/ssr';
import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const QUESTIONS_DIR = join(process.cwd(), 'questions');

function getTechnologies(): string[] {
  try {
    return readdirSync(QUESTIONS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
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

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿¡?!.,;:'"()\[\]{}]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender,
  },
  {
    path: ':technology',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return getTechnologies().map(technology => ({ technology }));
    },
  },
  {
    path: ':technology/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      const params: { technology: string; slug: string }[] = [];
      for (const technology of getTechnologies()) {
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
    path: '**',
    renderMode: RenderMode.Server,
  },
];
