import { Difficulty, Question, Seniority } from '../../domain/models/question.model';
import { generateSlug } from './slug-generator';
import { getTagLabel } from './tag-labels';

export interface TopicCluster {
  slug: string;
  label: string;
  questionCount: number;
  questions: Question[];
  summary: string;
  isIndexable: boolean;
}

export interface SeniorityCluster {
  slug: Seniority;
  label: string;
  questionCount: number;
  questions: Question[];
  description: string;
  isIndexable: boolean;
}

export const MIN_TOPIC_QUESTIONS = 4;
export const MIN_LEVEL_QUESTIONS = 6;
export const MIN_GUIDE_QUESTIONS = 12;

export function stripMarkdown(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/[*_~>#|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function deriveSummary(content: string, fallbackTitle = ''): string {
  const plain = stripMarkdown(content);
  const base = plain || fallbackTitle;
  if (base.length <= 170) return base;
  const slice = base.slice(0, 167).trimEnd();
  return `${slice}...`;
}

export function estimateReadingTime(content: string): number {
  const wordCount = stripMarkdown(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 190));
}

export function deriveSeniority(difficulty: Difficulty): Seniority {
  switch (difficulty) {
    case 'easy':
      return 'junior';
    case 'hard':
      return 'senior';
    default:
      return 'mid';
  }
}

export function labelForSeniority(seniority: Seniority): string {
  switch (seniority) {
    case 'junior':
      return 'Junior';
    case 'senior':
      return 'Senior';
    default:
      return 'Intermedio';
  }
}

export function descriptionForSeniority(seniority: Seniority, technologyName: string): string {
  switch (seniority) {
    case 'junior':
      return `Base esencial de ${technologyName}: fundamentos, conceptos clave y respuestas claras para procesos iniciales.`;
    case 'senior':
      return `Escenarios complejos de ${technologyName}: arquitectura, compromisos técnicos, rendimiento y decisiones de mayor impacto.`;
    default:
      return `Bloque intermedio de ${technologyName}: diseño práctico, depuración y capacidad de llevar una funcionalidad a producción.`;
  }
}

export function primaryTopicSlug(tags: string[]): string {
  return tags.length > 0 ? generateSlug(tags[0]) : 'general';
}

export function buildTopicClusters(
  questions: Question[],
  minQuestions = MIN_TOPIC_QUESTIONS,
): TopicCluster[] {
  const groups = new Map<string, Question[]>();

  for (const question of questions) {
    for (const tag of question.tags) {
      const slug = generateSlug(tag);
      const list = groups.get(slug) ?? [];
      list.push(question);
      groups.set(slug, list);
    }
  }

  return Array.from(groups.entries())
    .map(([slug, topicQuestions]) => {
      const rawLabel =
        topicQuestions
          .flatMap((question) => question.tags)
          .find((tag) => generateSlug(tag) === slug) ?? slug;
      const label = getTagLabel(rawLabel);

      return {
        slug,
        label,
        questionCount: topicQuestions.length,
        questions: topicQuestions.sort((a, b) => a.index - b.index),
        summary: `Selección de preguntas sobre ${label} con foco en decisiones reales, errores habituales y señales que suelen aparecer en entrevista.`,
        isIndexable: topicQuestions.length >= minQuestions,
      };
    })
    .filter((cluster) => cluster.questionCount > 0)
    .sort((a, b) => b.questionCount - a.questionCount || a.label.localeCompare(b.label));
}

export function buildSeniorityClusters(
  questions: Question[],
  technologyName: string,
  minQuestions = MIN_LEVEL_QUESTIONS,
): SeniorityCluster[] {
  const order: Seniority[] = ['junior', 'mid', 'senior'];

  return order
    .map((seniority) => {
      const matches = questions
        .filter((question) => question.seniority === seniority)
        .sort((a, b) => a.index - b.index);

      return {
        slug: seniority,
        label: labelForSeniority(seniority),
        questionCount: matches.length,
        questions: matches,
        description: descriptionForSeniority(seniority, technologyName),
        isIndexable: matches.length >= minQuestions,
      };
    })
    .filter((cluster) => cluster.questionCount > 0);
}

export function getRelatedQuestions(
  current: Question,
  questions: Question[],
  limit = 4,
): Question[] {
  const currentTags = new Set(current.tags);

  return questions
    .filter((question) => question.slug !== current.slug)
    .map((question) => {
      let score = 0;

      for (const tag of question.tags) {
        if (currentTags.has(tag)) score += 3;
      }

      if (question.difficulty === current.difficulty) score += 2;
      if (question.seniority === current.seniority) score += 1;
      score += Math.max(0, 5 - Math.abs(question.index - current.index));

      return { question, score };
    })
    .sort((a, b) => b.score - a.score || a.question.index - b.question.index)
    .slice(0, limit)
    .map(({ question }) => question);
}
