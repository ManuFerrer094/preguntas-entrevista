import { Difficulty } from '../../domain/models/question.model';

/** Returns a human-readable Spanish label for a question difficulty level. */
export function difficultyLabel(difficulty: Difficulty): string {
  const labels: Record<Difficulty, string> = {
    easy: 'Fácil',
    medium: 'Media',
    hard: 'Difícil',
  };
  return labels[difficulty];
}
