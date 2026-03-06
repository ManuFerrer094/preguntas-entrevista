import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { generateDossierPdf, TECHNOLOGY_NAMES } from '../../lib/generate-dossier';

interface HandlerRequest {
  method?: string;
  query: Record<string, string | string[]>;
}

interface HandlerResponse {
  status(code: number): HandlerResponse;
  json(body: unknown): void;
  send(body: unknown): void;
  setHeader(name: string, value: string | number): HandlerResponse;
}

export default async function handler(req: HandlerRequest, res: HandlerResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { technology } = req.query;

  if (typeof technology !== 'string' || !TECHNOLOGY_NAMES[technology]) {
    res.status(400).json({ error: 'Invalid technology' });
    return;
  }

  const technologyName = TECHNOLOGY_NAMES[technology];
  const questionsDir = join(process.cwd(), 'questions', technology);

  if (!existsSync(questionsDir)) {
    res.status(404).json({ error: 'Technology not found' });
    return;
  }

  try {
    const pdfBuffer = await generateDossierPdf(questionsDir, technologyName);

    res.status(200);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${technology}-dossier.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch {
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}
