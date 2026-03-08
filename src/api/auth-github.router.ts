import { Router, Request, Response } from 'express';
import { getClientId, exchangeCodeForUser } from '../../lib/github-auth.js';

export function createAuthGitHubRouter(): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response): void => {
    const clientId = getClientId();
    if (!clientId) {
      res.status(503).json({ error: 'GitHub OAuth no está configurado.' });
      return;
    }
    res.json({ clientId });
  });

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    const { code } = req.body as { code?: string };
    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'Se requiere el código de autorización.' });
      return;
    }

    try {
      const user = await exchangeCodeForUser(code);
      res.json(user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de autenticación.';
      console.error('GitHub auth error:', message);
      res.status(401).json({ error: message });
    }
  });

  return router;
}
