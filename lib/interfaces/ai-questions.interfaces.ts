export interface QuestionSummary {
  technology: string;
  title: string;
  difficulty: string;
  tags: string[];
  summary?: string;
}

export interface AiQuestionsConfig {
  azureOpenAiEndpoint: string;
  azureOpenAiKey: string;
  azureOpenAiDeployment: string;
}
