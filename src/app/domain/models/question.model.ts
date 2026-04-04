export type Difficulty = 'easy' | 'medium' | 'hard';
export type Seniority = 'junior' | 'mid' | 'senior';

export interface Question {
  id: string;
  title: string;
  slug: string;
  content: string;
  technology: string;
  index: number;
  difficulty: Difficulty;
  seniority: Seniority;
  tags: string[];
  topicSlug: string;
  summary: string;
  readingTime: number;
  isIndexable: boolean;
  author?: string;
  authorUrl?: string;
  lastReviewed?: string;
}
