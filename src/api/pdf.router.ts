import { Router, Request, Response } from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { generateDossierPdf, technologyNameFromSlug } from '../../lib/generate-dossier.js';

function hasQuestionCatalog(questionsDir: string, technology: string): boolean {
  const techDir = join(questionsDir, technology);
  const indexPath = join(techDir, 'index.json');
  return existsSync(techDir) && existsSync(indexPath);
}

export function createPdfRouter(questionsDir: string): Router {
  const router = Router();

  router.get('/:technology', async (req: Request, res: Response): Promise<void> => {
    const technology = req.params['technology'] as string;

    if (!hasQuestionCatalog(questionsDir, technology)) {
      res.status(404).json({ error: 'Tecnologia no encontrada' });
      return;
    }

    try {
      const pdfBuffer = await generateDossierPdf(join(questionsDir, technology), technologyNameFromSlug(technology));
      const filename = `preguntas-entrevista-${technology}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'no-cache');
      res.send(pdfBuffer);
    } catch (err) {
      console.error(`[pdf-router] Failed to generate PDF for "${technology}":`, err);
      res.status(500).json({ error: `Error al generar el PDF para ${technology}` });
    }
  });

  return router;
}
