import { join } from 'node:path';
import { handleAiQuestionsRequest } from '../lib/ai-questions.js';

interface HandlerRequest {
  method?: string;
  body?: { jobDescription?: string };
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

  const { jobDescription } = req.body ?? {};

  if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length === 0) {
    res.status(400).json({ error: 'Se requiere una descripción de la oferta de empleo.' });
    return;
  }

  if (jobDescription.length > 10000) {
    res.status(400).json({ error: 'La descripción es demasiado larga. Máximo 10.000 caracteres.' });
    return;
  }

  const azureOpenAiEndpoint = process.env['AZURE_OPENAI_ENDPOINT'] || '';
  const azureOpenAiKey = process.env['AZURE_OPENAI_KEY'] || '';
  const azureOpenAiDeployment = process.env['AZURE_OPENAI_DEPLOYMENT'] || 'gpt-4o-mini';

  if (!azureOpenAiEndpoint || !azureOpenAiKey) {
    res
      .status(503)
      .json({ error: 'El servicio de IA no está configurado. Configura AZURE_OPENAI_ENDPOINT y AZURE_OPENAI_KEY.' });
    return;
  }

  const questionsDir = join(process.cwd(), 'questions');

  try {
    const result = await handleAiQuestionsRequest(jobDescription, questionsDir, {
      azureOpenAiEndpoint,
      azureOpenAiKey,
      azureOpenAiDeployment,
    });
    res.json(result);
  } catch (err) {
    console.error('AI questions error:', err);
    res.status(500).json({ error: 'Error interno al generar las preguntas.' });
  }
}
