export interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

export type QuizDifficulty = 'mixed' | 'easy' | 'medium' | 'hard';
