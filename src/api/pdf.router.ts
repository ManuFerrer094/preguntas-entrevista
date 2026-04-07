import { Request, Response, Router } from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  generateDossierPdf,
  readQuestions,
  technologyNameFromSlug,
} from '../../lib/generate-dossier.js';

function hasQuestionCatalog(questionsDir: string, technology: string): boolean {
  const techDir = join(questionsDir, technology);
  const indexPath = join(techDir, 'index.json');
  return existsSync(techDir) && existsSync(indexPath);
}

function normalizeTechnologies(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .filter((entry, index, entries) => entries.indexOf(entry) === index);
}

function buildFilename(technologies: string[]): string {
  if (technologies.length === 1) {
    return `preguntas-entrevista-${technologies[0]}.pdf`;
  }

  return `preguntas-entrevista-dossier-${technologies.length}-tecnologias.pdf`;
}

function buildSections(questionsDir: string, technologies: string[]) {
  return technologies
    .filter((technology) => hasQuestionCatalog(questionsDir, technology))
    .map((technology) => ({
      slug: technology,
      technologyName: technologyNameFromSlug(technology),
      questions: readQuestions(join(questionsDir, technology)),
    }))
    .filter((section) => section.questions.length > 0);
}

function sendPdf(res: Response, pdfBuffer: Buffer, filename: string): void {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  res.setHeader('Cache-Control', 'no-cache');
  res.send(pdfBuffer);
}

export function createPdfRouter(questionsDir: string): Router {
  const router = Router();

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    const technologies = normalizeTechnologies(req.body?.technologies);

    if (technologies.length === 0) {
      res.status(400).json({ error: 'Debes seleccionar al menos una tecnologia' });
      return;
    }

    const sections = buildSections(questionsDir, technologies);
    if (sections.length === 0) {
      res.status(404).json({ error: 'No se encontraron tecnologias validas para el dosier' });
      return;
    }

    try {
      const pdfBuffer = await generateDossierPdf(sections);
      sendPdf(
        res,
        pdfBuffer,
        buildFilename(sections.map((section) => section.slug)),
      );
    } catch (err) {
      console.error('[pdf-router] Failed to generate combined dossier:', err);
      res.status(500).json({ error: 'Error al generar el dosier PDF' });
    }
  });

  router.get('/:technology', async (req: Request, res: Response): Promise<void> => {
    const technology = (req.params['technology'] as string).trim().toLowerCase();

    if (!hasQuestionCatalog(questionsDir, technology)) {
      res.status(404).json({ error: 'Tecnologia no encontrada' });
      return;
    }

    const sections = buildSections(questionsDir, [technology]);

    try {
      const pdfBuffer = await generateDossierPdf(sections);
      sendPdf(res, pdfBuffer, buildFilename([technology]));
    } catch (err) {
      console.error(`[pdf-router] Failed to generate PDF for "${technology}":`, err);
      res.status(500).json({ error: `Error al generar el PDF para ${technology}` });
    }
  });

  return router;
}
