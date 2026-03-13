import { Router, Request, Response } from 'express';
import { handleQuizRequest } from '../../lib/quiz.js';

const VALID_QUESTION_COUNTS = [10, 15, 20];

export function createQuizRouter(): Router {
  const router = Router();

  const config = {
    azureOpenAiEndpoint: process.env['AZURE_OPENAI_ENDPOINT'] || '',
    azureOpenAiKey: process.env['AZURE_OPENAI_KEY'] || '',
    azureOpenAiDeployment: process.env['AZURE_OPENAI_DEPLOYMENT'] || 'gpt-4o-mini',
  };

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    const { jobDescription, questionCount } = req.body as {
      jobDescription?: string;
      questionCount?: number;
    };

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

    if (!config.azureOpenAiEndpoint || !config.azureOpenAiKey) {
      res.status(503).json({ error: 'El servicio de IA no está configurado. Configura AZURE_OPENAI_ENDPOINT y AZURE_OPENAI_KEY.' });
      return;
    }

    try {
      const result = await handleQuizRequest(jobDescription, count, config);
      res.json(result);
    } catch (err) {
      console.error('Quiz error:', err);
      res.status(500).json({ error: 'Error interno al generar el cuestionario.' });
    }
  });

  return router;
}
