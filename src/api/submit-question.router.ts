import { Router, Request, Response } from 'express';
import { handleSubmitQuestion, SubmitQuestionError } from '../../lib/submit-question.js';

export function createSubmitQuestionRouter(): Router {
  const router = Router();

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip ?? 'unknown';

    try {
      const result = await handleSubmitQuestion(req.body, ip);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof SubmitQuestionError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error('Submit question error:', err);
      res.status(500).json({ error: 'Error al crear la contribución. Inténtalo de nuevo más tarde.' });
    }
  });

  return router;
}
