import { handleSubmitQuestion, SubmitQuestionError } from '../lib/submit-question.js';

interface HandlerRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: Record<string, unknown>;
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

  const forwarded = req.headers?.['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded) ?? 'unknown';

  try {
    const result = await handleSubmitQuestion(req.body as any, ip);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof SubmitQuestionError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error('Submit question error:', err);
    res.status(500).json({ error: 'Error al crear la contribución. Inténtalo de nuevo más tarde.' });
  }
}
