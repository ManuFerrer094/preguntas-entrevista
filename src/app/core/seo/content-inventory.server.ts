import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { Question } from '../../domain/models/question.model';
import {
  buildSeniorityClusters,
  buildTopicClusters,
  MIN_GUIDE_QUESTIONS,
  MIN_LEVEL_QUESTIONS,
  MIN_TOPIC_QUESTIONS,
} from '../utils/question-taxonomy';
import { parseQuestionFileContent } from '../../infrastructure/markdown/question-file.parser';

const QUESTIONS_DIR = join(process.cwd(), 'questions');
const RESOURCES_DIR = join(process.cwd(), 'resources');

export interface IndexedQuestionRecord extends Question {
  lastmod?: string;
}

export interface TechnologyInventoryRecord {
  technology: string;
  questionCount: number;
  resourceCount: number;
  questions: IndexedQuestionRecord[];
}

function readJson<T>(path: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function readResourcesManifest(): Record<string, number> {
  return readJson(join(RESOURCES_DIR, 'manifest.json'), {} as Record<string, number>);
}

function loadQuestionsForTechnology(technology: string): IndexedQuestionRecord[] {
  const index = readJson<string[]>(join(QUESTIONS_DIR, technology, 'index.json'), []);

  return index
    .filter((filename) => basename(filename) === filename)
    .map((filename, fileIndex) => {
      const fullPath = join(QUESTIONS_DIR, technology, filename);
      try {
        const content = readFileSync(fullPath, 'utf-8');
        const question = parseQuestionFileContent(content, technology, fileIndex);
        if (!question) return null;
        return {
          ...question,
          lastmod: question.lastReviewed ?? statSync(fullPath).mtime.toISOString(),
        };
      } catch {
        return null;
      }
    })
    .filter((question): question is NonNullable<typeof question> => question !== null);
}

export function getTechnologyInventory(): TechnologyInventoryRecord[] {
  const resourceCounts = readResourcesManifest();

  if (!existsSync(QUESTIONS_DIR)) return [];

  return readdirSync(QUESTIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const questions = loadQuestionsForTechnology(entry.name);
      return {
        technology: entry.name,
        questionCount: questions.length,
        resourceCount: resourceCounts[entry.name] ?? 0,
        questions,
      };
    })
    .sort((a, b) => a.technology.localeCompare(b.technology));
}

export function getTechnologiesWithContent(): string[] {
  return getTechnologyInventory()
    .filter((record) => record.questionCount > 0 || record.resourceCount > 0)
    .map((record) => record.technology);
}

export function getTechnologiesWithQuestions(): string[] {
  return getTechnologyInventory()
    .filter((record) => record.questionCount > 0)
    .map((record) => record.technology);
}

export function getGuideTechnologies(): string[] {
  return getTechnologyInventory()
    .filter((record) => record.questionCount >= MIN_GUIDE_QUESTIONS)
    .map((record) => record.technology);
}

export function getQuestionRouteParams(): Array<{ technology: string; slug: string }> {
  return getTechnologyInventory().flatMap((record) =>
    record.questions.map((question) => ({
      technology: record.technology,
      slug: question.slug,
    })),
  );
}

export function getTopicRouteParams(): Array<{ technology: string; tag: string }> {
  return getTechnologyInventory().flatMap((record) =>
    buildTopicClusters(record.questions, MIN_TOPIC_QUESTIONS)
      .filter((cluster) => cluster.isIndexable)
      .map((cluster) => ({
        technology: record.technology,
        tag: cluster.slug,
      })),
  );
}

export function getLevelRouteParams(): Array<{ technology: string; level: string }> {
  return getTechnologyInventory().flatMap((record) =>
    buildSeniorityClusters(record.questions, record.technology, MIN_LEVEL_QUESTIONS)
      .filter((cluster) => cluster.isIndexable)
      .map((cluster) => ({
        technology: record.technology,
        level: cluster.slug,
      })),
  );
}
