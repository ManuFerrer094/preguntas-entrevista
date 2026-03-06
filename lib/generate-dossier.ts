import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Use createRequire so esbuild does NOT bundle pdfkit inline.
// When pdfkit is bundled by esbuild its internal __dirname points to the
// bundle output directory instead of node_modules/pdfkit/js/, which makes
// the fs.readFileSync(__dirname + '/data/*.afm') calls fail.  Loading it
// via createRequire forces Node.js to resolve and execute it from its real
// location at runtime, keeping __dirname correct.
const nodeRequire = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PDFDocument = nodeRequire('pdfkit') as new (options?: Record<string, unknown>) => any;

export const TECHNOLOGY_NAMES: Record<string, string> = {
  angular: 'Angular',
  react: 'React',
  vue: 'Vue',
  nodejs: 'Node.js',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
};

interface QuestionData {
  title: string;
  difficulty: string;
  tags: string[];
  content: string;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
};

function parseFrontmatter(raw: string): { meta: Record<string, string | string[]>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw };
  const meta: Record<string, string | string[]> = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const rawVal = line.slice(idx + 1).trim();
    if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
      meta[key] = rawVal.slice(1, -1).split(',').map(s => s.trim());
    } else {
      meta[key] = rawVal;
    }
  }
  return { meta, content: match[2].trim() };
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, '');
}

export function readQuestions(questionsDir: string): QuestionData[] {
  const indexPath = join(questionsDir, 'index.json');
  if (!existsSync(indexPath)) return [];
  const fileList: string[] = JSON.parse(readFileSync(indexPath, 'utf-8'));
  const questions: QuestionData[] = [];
  for (const file of fileList) {
    if (!/^q\d+\.md$/.test(file)) continue;
    const filePath = join(questionsDir, file);
    if (!existsSync(filePath)) continue;
    const raw = readFileSync(filePath, 'utf-8');
    const { meta, content } = parseFrontmatter(raw);
    questions.push({
      title: (meta['title'] as string) || file.replace('.md', ''),
      difficulty: (meta['difficulty'] as string) || 'medium',
      tags: Array.isArray(meta['tags']) ? meta['tags'] : [],
      content,
    });
  }
  return questions;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderContent(doc: any, content: string): void {
  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLang = '';

  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLang = line.trim().slice(3).trim();
        codeBuffer = [];
      } else {
        inCodeBlock = false;
        if (codeLang) {
          doc.fontSize(8).font('Helvetica').fillColor('#888888').text(codeLang.toUpperCase());
        }
        doc.fontSize(9).font('Courier').fillColor('#333333')
          .text(codeBuffer.join('\n'), { lineGap: 1.5 });
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').fillColor('#000000');
        codeBuffer = [];
        codeLang = '';
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.trim() === '') {
      doc.moveDown(0.3);
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = stripInlineMarkdown(headingMatch[2]);
      const sizes: Record<number, number> = { 1: 20, 2: 17, 3: 14, 4: 13, 5: 12, 6: 11 };
      doc.fontSize(sizes[level] || 11).font('Helvetica-Bold').text(text);
      doc.moveDown(0.4);
      doc.font('Helvetica');
      continue;
    }

    const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (ulMatch) {
      const indent = Math.min(Math.floor(ulMatch[1].length / 2), 4) * 15;
      doc.fontSize(11).font('Helvetica')
        .text(`•  ${stripInlineMarkdown(ulMatch[2])}`, { indent: indent + 10, lineGap: 2 });
      continue;
    }

    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
    if (olMatch) {
      const indent = Math.min(Math.floor(olMatch[1].length / 2), 4) * 15;
      doc.fontSize(11).font('Helvetica')
        .text(`${olMatch[2]}.  ${stripInlineMarkdown(olMatch[3])}`, { indent: indent + 10, lineGap: 2 });
      continue;
    }

    if (line.startsWith('>')) {
      const text = stripInlineMarkdown(line.replace(/^>\s*/, ''));
      doc.fontSize(11).font('Helvetica-Oblique').fillColor('#555555')
        .text(text, { indent: 15, lineGap: 3 });
      doc.font('Helvetica').fillColor('#000000');
      continue;
    }

    if (/^(---|\*\*\*|___)/.test(line.trim())) {
      doc.moveDown(0.3);
      const x = doc.x;
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      doc.moveTo(x, doc.y).lineTo(x + pageWidth, doc.y)
        .strokeColor('#cccccc').lineWidth(0.5).stroke();
      doc.moveDown(0.5);
      continue;
    }

    doc.fontSize(11).font('Helvetica').fillColor('#000000')
      .text(stripInlineMarkdown(line), { lineGap: 3 });
  }
}

export function generateDossierPdf(questionsDir: string, technologyName: string): Promise<Buffer> {
  const questions = readQuestions(questionsDir);

  if (questions.length === 0) {
    throw new Error('No questions found');
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 60,
      info: {
        Title: `${technologyName} - Dosier de Preguntas de Entrevista`,
        Author: 'Preguntas de Entrevista',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Cover page
    doc.moveDown(8);
    doc.fontSize(36).font('Helvetica-Bold')
      .text(technologyName, { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(18).font('Helvetica')
      .text('Dosier de Preguntas de Entrevista', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(14).fillColor('#666666')
      .text(`${questions.length} preguntas`, { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(10)
      .text(
        `Generado el ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`,
        { align: 'center' },
      );
    doc.fillColor('#000000');

    // Questions
    questions.forEach((question, index) => {
      doc.addPage();

      doc.fontSize(10).font('Helvetica').fillColor('#999999')
        .text(`Pregunta ${index + 1} de ${questions.length}`);
      doc.moveDown(0.3);

      doc.fontSize(20).font('Helvetica-Bold').fillColor('#000000')
        .text(stripInlineMarkdown(question.title));
      doc.moveDown(0.5);

      const diffLabel = DIFFICULTY_LABELS[question.difficulty] || question.difficulty;
      const tagsStr = question.tags.length > 0 ? ` · ${question.tags.join(', ')}` : '';
      doc.fontSize(10).font('Helvetica').fillColor('#666666')
        .text(`Dificultad: ${diffLabel}${tagsStr}`);
      doc.moveDown(0.5);

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      doc.moveTo(doc.x, doc.y).lineTo(doc.x + pageWidth, doc.y)
        .strokeColor('#e0e0e0').lineWidth(1).stroke();
      doc.moveDown(1);
      doc.fillColor('#000000');

      renderContent(doc, question.content);
    });

    doc.end();
  });
}
