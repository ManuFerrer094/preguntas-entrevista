import { Difficulty, Question } from '../../domain/models/question.model';
import {
  deriveSeniority,
  deriveSummary,
  estimateReadingTime,
  primaryTopicSlug,
} from '../../core/utils/question-taxonomy';
import { generateSlug } from '../../core/utils/slug-generator';

export interface QuestionFrontmatter {
  title?: string;
  difficulty?: Difficulty;
  tags?: string[];
  author?: string;
  authorUrl?: string;
  summary?: string;
  lastReviewed?: string;
}

export function parseFrontmatter(content: string): {
  metadata: QuestionFrontmatter;
  body: string;
} {
  if (!content.startsWith('---')) {
    return { metadata: {}, body: content };
  }

  const end = content.indexOf('\n---', 3);
  if (end === -1) {
    return { metadata: {}, body: content };
  }

  const raw = content.slice(4, end);
  const body = content.slice(end + 4).trim();
  const metadata: QuestionFrontmatter = {};

  for (const line of raw.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim() as keyof QuestionFrontmatter;
    const value = line.slice(colonIdx + 1).trim();

    if (key === 'tags') {
      const inner = value.replace(/^\[|\]$/g, '');
      metadata[key] = inner
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
      continue;
    }

    (metadata as Record<string, unknown>)[key] = value;
  }

  return { metadata, body };
}

export function extractTitleFromBody(body: string): string | null {
  const lines = body.split(/\r?\n/);
  const titleLine = lines.find((line) => line.trim().startsWith('# '));
  return titleLine ? titleLine.replace(/^#\s+/, '').trim() : null;
}

export function parseQuestionFileContent(
  content: string,
  technology: string,
  index: number,
): Question | null {
  const { metadata, body } = parseFrontmatter(content);

  const title = metadata.title ?? extractTitleFromBody(body);
  if (!title) return null;

  const slug = generateSlug(title);
  const id = `${technology}-${slug}`;
  const difficulty: Difficulty = (['easy', 'medium', 'hard'] as Difficulty[]).includes(
    metadata.difficulty as Difficulty,
  )
    ? (metadata.difficulty as Difficulty)
    : 'medium';
  const tags = Array.isArray(metadata.tags) ? metadata.tags : [];

  const unquote = (value?: unknown) => {
    if (!value || typeof value !== 'string') return undefined;
    return value.replace(/^"|"$/g, '').trim();
  };

  const author = unquote(metadata.author);
  const authorUrl = unquote(metadata.authorUrl);
  const summary = unquote(metadata.summary) ?? deriveSummary(body, title);
  const lastReviewed = unquote(metadata.lastReviewed);

  return {
    id,
    title,
    slug,
    content: body,
    technology,
    index,
    difficulty,
    seniority: deriveSeniority(difficulty),
    tags,
    topicSlug: primaryTopicSlug(tags),
    summary,
    readingTime: estimateReadingTime(body),
    isIndexable: body.trim().length > 0,
    author,
    authorUrl,
    lastReviewed,
  };
}
