import { Router, Request, Response } from 'express';
import { handleAiQuestionsRequest } from '../../lib/ai-questions.js';

export function createAiQuestionsRouter(questionsDir: string): Router {
  const router = Router();

  const config = {
    azureOpenAiEndpoint: process.env['AZURE_OPENAI_ENDPOINT'] || '',
    azureOpenAiKey: process.env['AZURE_OPENAI_KEY'] || '',
    azureOpenAiDeployment: process.env['AZURE_OPENAI_DEPLOYMENT'] || 'gpt-4o-mini',
  };

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    const { jobDescription } = req.body as { jobDescription?: string };

    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length === 0) {
      res.status(400).json({ error: 'Se requiere una descripción de la oferta de empleo.' });
      return;
    }

    if (jobDescription.length > 10000) {
      res.status(400).json({ error: 'La descripción es demasiado larga. Máximo 10.000 caracteres.' });
      return;
    }

    if (!config.azureOpenAiEndpoint || !config.azureOpenAiKey) {
      res.status(503).json({ error: 'El servicio de IA no está configurado. Configura AZURE_OPENAI_ENDPOINT y AZURE_OPENAI_KEY.' });
      return;
    }

    try {
      const result = await handleAiQuestionsRequest(jobDescription, questionsDir, config);
      res.json(result);
    } catch (err) {
      console.error('AI questions error:', err);
      res.status(500).json({ error: 'Error interno al generar las preguntas.' });
    }
  });

  return router;
}
