import { getClientId, exchangeCodeForUser } from '../../lib/github-auth.js';

interface HandlerRequest {
  method?: string;
  body?: { code?: string };
}

interface HandlerResponse {
  status(code: number): HandlerResponse;
  json(body: unknown): void;
}

export default async function handler(req: HandlerRequest, res: HandlerResponse) {
  if (req.method === 'GET') {
    const clientId = getClientId();
    if (!clientId) {
      res.status(503).json({ error: 'GitHub OAuth no está configurado.' });
      return;
    }
    res.status(200).json({ clientId });
    return;
  }

  if (req.method === 'POST') {
    const { code } = req.body ?? {};
    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'Se requiere el código de autorización.' });
      return;
    }

    try {
      const user = await exchangeCodeForUser(code);
      res.status(200).json(user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de autenticación.';
      console.error('GitHub auth error:', message);
      res.status(401).json({ error: message });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
