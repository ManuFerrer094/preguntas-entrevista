import { handleQuizRequest, QuizDifficulty } from '../lib/quiz.js';

const VALID_QUESTION_COUNTS = [10, 15, 20];
const VALID_DIFFICULTIES: QuizDifficulty[] = ['mixed', 'easy', 'medium', 'hard'];

interface HandlerRequest {
  method?: string;
  body?: { jobDescription?: string; questionCount?: number; difficulty?: string };
}

interface HandlerResponse {
  status(code: number): HandlerResponse;
  json(body: unknown): void;
}

export default async function handler(req: HandlerRequest, res: HandlerResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { jobDescription, questionCount, difficulty } = req.body ?? {};

  if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length === 0) {
    res.status(400).json({ error: 'Se requiere una descripción de la oferta de empleo.' });
    return;
  }

  if (jobDescription.length > 10000) {
    res.status(400).json({ error: 'La descripción es demasiado larga. Máximo 10.000 caracteres.' });
    return;
  }

  const count = typeof questionCount === 'number' ? questionCount : 10;
  if (!VALID_QUESTION_COUNTS.includes(count)) {
    res.status(400).json({ error: 'El número de preguntas debe ser 10, 15 o 20.' });
    return;
  }

  const diff: QuizDifficulty = VALID_DIFFICULTIES.includes(difficulty as QuizDifficulty)
    ? (difficulty as QuizDifficulty)
    : 'mixed';

  const azureOpenAiEndpoint = process.env['AZURE_OPENAI_ENDPOINT'] || '';
  const azureOpenAiKey = process.env['AZURE_OPENAI_KEY'] || '';
  const azureOpenAiDeployment = process.env['AZURE_OPENAI_DEPLOYMENT'] || 'gpt-4o-mini';

  if (!azureOpenAiEndpoint || !azureOpenAiKey) {
    res
      .status(503)
      .json({ error: 'El servicio de IA no está configurado. Configura AZURE_OPENAI_ENDPOINT y AZURE_OPENAI_KEY.' });
    return;
  }

  try {
    const result = await handleQuizRequest(jobDescription, count, {
      azureOpenAiEndpoint,
      azureOpenAiKey,
      azureOpenAiDeployment,
    }, diff);
    res.json(result);
  } catch (err) {
    console.error('Quiz error:', err);
    res.status(500).json({ error: 'Error interno al generar el cuestionario.' });
  }
}
