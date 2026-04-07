import { join } from 'node:path';
import { buildDossierFilename, buildDossierSections, normalizeTechnologies } from '../lib/dossier-sections.js';
import { generateDossierPdf } from '../lib/generate-dossier.js';

interface HandlerRequest {
  method?: string;
  body?: { technologies?: unknown };
}

interface HandlerResponse {
  status(code: number): HandlerResponse;
  json(body: unknown): void;
  send(body: unknown): void;
  setHeader(name: string, value: string | number): HandlerResponse;
}

export default async function handler(req: HandlerRequest, res: HandlerResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const technologies = normalizeTechnologies(req.body?.technologies);
  if (technologies.length === 0) {
    res.status(400).json({ error: 'Debes seleccionar al menos una tecnologia' });
    return;
  }

  const questionsDir = join(process.cwd(), 'questions');
  const sections = buildDossierSections(questionsDir, technologies);

  if (sections.length === 0) {
    res.status(404).json({ error: 'No se encontraron tecnologias validas para el dosier' });
    return;
  }

  try {
    const pdfBuffer = await generateDossierPdf(sections);

    res.status(200);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${buildDossierFilename(sections.map((section) => section.slug))}"`,
    );
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Combined dossier generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF', details: String(err) });
  }
}
