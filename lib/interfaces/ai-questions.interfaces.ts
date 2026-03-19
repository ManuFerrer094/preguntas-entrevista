export interface QuestionSummary {
  technology: string;
  title: string;
  difficulty: string;
  tags: string[];
}

export interface AiQuestionsConfig {
  azureOpenAiEndpoint: string;
  azureOpenAiKey: string;
  azureOpenAiDeployment: string;
}
