import { Router, Request, Response } from 'express';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import PDFDocument from 'pdfkit';

const VALID_TECHNOLOGIES = new Set(['angular', 'react', 'vue', 'nodejs', 'typescript', 'javascript']);

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
};

interface Frontmatter {
  title?: string;
  difficulty?: string;
  tags?: string[];
}

function parseFrontmatter(content: string): { metadata: Frontmatter; body: string } {
  if (!content.startsWith('---')) {
    return { metadata: {}, body: content };
  }
  const end = content.indexOf('\n---', 3);
  if (end === -1) {
    return { metadata: {}, body: content };
  }

  const raw = content.slice(4, end);
  const body = content.slice(end + 4).trim();
  const metadata: Frontmatter = {};

  for (const line of raw.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim() as keyof Frontmatter;
    const value = line.slice(colonIdx + 1).trim();
    if (key === 'tags') {
      const inner = value.replace(/^\[|\]$/g, '');
      metadata.tags = inner
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    } else {
      (metadata as Record<string, unknown>)[key] = value;
    }
  }

  return { metadata, body };
}

interface Question {
  title: string;
  difficulty: string;
  tags: string[];
  body: string;
}

async function loadQuestions(questionsDir: string, technology: string): Promise<Question[]> {
  const indexPath = join(questionsDir, technology, 'index.json');
  const indexContent = await readFile(indexPath, 'utf-8');
  const filenames: string[] = JSON.parse(indexContent);

  const results = await Promise.allSettled(
    filenames.map((filename) =>
      readFile(join(questionsDir, technology, filename), 'utf-8').then((content) => {
        const { metadata, body } = parseFrontmatter(content);
        const title = metadata.title ?? '';
        if (!title) return null;
        return {
          title,
          difficulty: metadata.difficulty ?? 'medium',
          tags: metadata.tags ?? [],
          body,
        } satisfies Question;
      }),
    ),
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<Question> =>
        r.status === 'fulfilled' && r.value !== null,
    )
    .map((r) => r.value);
}

/** Renders plain markdown body text into the PDF document with basic formatting. */
function renderMarkdownToPdf(doc: PDFKit.PDFDocument, markdown: string): void {
  const lines = markdown.split('\n');
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  const flushCodeBlock = () => {
    if (codeBlockLines.length === 0) return;
    const codeText = codeBlockLines.join('\n');
    const blockHeight = (codeBlockLines.length + 1) * 11 + 12;
    // Background box
    doc.save();
    doc
      .rect(doc.x, doc.y, doc.page.width - doc.page.margins.left - doc.page.margins.right, blockHeight)
      .fill('#1e1e1e');
    doc.restore();
    doc.font('Courier').fontSize(8).fillColor('#d4d4d4').text(codeText, {
      lineGap: 2,
    });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10).fillColor('#333333');
    codeBlockLines = [];
  };

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    if (line.trim() === '') {
      doc.moveDown(0.3);
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333').text(line.slice(4), { lineGap: 2 });
      doc.moveDown(0.3);
    } else if (line.startsWith('## ')) {
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#222222').text(line.slice(3), { lineGap: 2 });
      doc.moveDown(0.3);
    } else if (line.startsWith('# ')) {
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#111111').text(line.slice(2), { lineGap: 2 });
      doc.moveDown(0.3);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Bullet list item
      const text = stripInlineMarkdown(line.slice(2));
      doc.font('Helvetica').fontSize(10).fillColor('#333333').text(`• ${text}`, {
        lineGap: 2,
        indent: 10,
      });
    } else if (/^\d+\.\s/.test(line)) {
      // Numbered list item
      const text = stripInlineMarkdown(line.replace(/^\d+\.\s/, ''));
      doc.font('Helvetica').fontSize(10).fillColor('#333333').text(line.replace(/^(\d+\.\s).*/, '$1') + text, {
        lineGap: 2,
        indent: 10,
      });
    } else {
      // Regular paragraph text with inline markdown stripped
      const text = stripInlineMarkdown(line);
      doc.font('Helvetica').fontSize(10).fillColor('#333333').text(text, { lineGap: 2 });
    }
  }

  // Flush any remaining code block
  if (inCodeBlock && codeBlockLines.length > 0) {
    flushCodeBlock();
  }
}

/** Strips basic inline markdown (bold, italic, inline code, links) to plain text. */
function stripInlineMarkdown(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

function buildPdf(technology: string, questions: Question[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Cover page ──────────────────────────────────────────────────────────
    const techName = technology.charAt(0).toUpperCase() + technology.slice(1);
    doc
      .font('Helvetica-Bold')
      .fontSize(28)
      .fillColor('#111111')
      .text(`Preguntas de Entrevista`, { align: 'center' });

    doc.moveDown(0.5);
    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .fillColor('#555555')
      .text(techName, { align: 'center' });

    doc.moveDown(0.5);
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#888888')
      .text(`${questions.length} preguntas`, { align: 'center' });

    doc.moveDown(0.5);
    const date = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.font('Helvetica').fontSize(10).fillColor('#aaaaaa').text(date, { align: 'center' });

    // ── Separator ───────────────────────────────────────────────────────────
    doc.moveDown(1.5);
    doc
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke('#dddddd');
    doc.moveDown(1.5);

    // ── Questions ───────────────────────────────────────────────────────────
    questions.forEach((question, index) => {
      // Add a new page for each question except the first
      if (index > 0) {
        doc.addPage();
      }

      // Question number and title
      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#1a1a1a')
        .text(`${index + 1}. ${question.title}`, { lineGap: 4 });

      doc.moveDown(0.4);

      // Difficulty badge
      const diffLabel = DIFFICULTY_LABELS[question.difficulty] ?? question.difficulty;
      const diffColor =
        question.difficulty === 'easy'
          ? '#2e7d32'
          : question.difficulty === 'hard'
            ? '#c62828'
            : '#e65100';
      doc.font('Helvetica-Bold').fontSize(8).fillColor(diffColor).text(`● ${diffLabel}`, { continued: true });

      // Tags
      if (question.tags.length > 0) {
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#888888')
          .text(`   ${question.tags.join(' · ')}`);
      } else {
        doc.text('');
      }

      // Separator line under the header
      doc.moveDown(0.5);
      doc
        .moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .stroke('#eeeeee');
      doc.moveDown(0.6);

      // Body / answer
      if (question.body) {
        renderMarkdownToPdf(doc, question.body);
      }
    });

    doc.end();
  });
}

export function createPdfRouter(questionsDir: string): Router {
  const router = Router();

  router.get('/:technology', async (req: Request, res: Response): Promise<void> => {
    const technology = req.params['technology'] as string;

    if (!VALID_TECHNOLOGIES.has(technology)) {
      res.status(404).json({ error: 'Tecnología no encontrada' });
      return;
    }

    try {
      const questions = await loadQuestions(questionsDir, technology);
      const pdfBuffer = await buildPdf(technology, questions);

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
