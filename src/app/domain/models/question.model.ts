export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  title: string;
  slug: string;
  content: string;
  technology: string;
  index: number;
  difficulty: Difficulty;
  tags: string[];
}
