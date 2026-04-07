import { Request, Response, Router } from 'express';
import { generateDossierPdf } from '../../lib/generate-dossier.js';
import {
  buildDossierFilename,
  buildDossierSections,
  hasQuestionCatalog,
  normalizeTechnologies,
} from '../../lib/dossier-sections.js';

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

    const sections = buildDossierSections(questionsDir, technologies);
    if (sections.length === 0) {
      res.status(404).json({ error: 'No se encontraron tecnologias validas para el dosier' });
      return;
    }

    try {
      const pdfBuffer = await generateDossierPdf(sections);
      sendPdf(
        res,
        pdfBuffer,
        buildDossierFilename(sections.map((section) => section.slug)),
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

    const sections = buildDossierSections(questionsDir, [technology]);

    try {
      const pdfBuffer = await generateDossierPdf(sections);
      sendPdf(res, pdfBuffer, buildDossierFilename([technology]));
    } catch (err) {
      console.error(`[pdf-router] Failed to generate PDF for "${technology}":`, err);
      res.status(500).json({ error: `Error al generar el PDF para ${technology}` });
    }
  });

  return router;
}
