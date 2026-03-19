export interface SubmitQuestionInput {
  technology?: string;
  title?: string;
  difficulty?: string;
  tags?: string;
  content?: string;
}

export interface SubmitQuestionResult {
  prUrl: string;
}
