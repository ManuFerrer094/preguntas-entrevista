import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// createRequire is the standard way to use require() from ESM.
// pdfkit must NOT be bundled because it reads .afm font files via
// fs.readFileSync(__dirname + '/data/...') at runtime.
const _require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PDFDocument = _require('pdfkit') as new (options?: Record<string, unknown>) => any;

export const TECHNOLOGY_NAMES: Record<string, string> = {
  angular: 'Angular',
  react: 'React',
  vue: 'Vue',
  nodejs: 'Node.js',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuestionData {
  title: string;
  difficulty: string;
  tags: string[];
  content: string;
}

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const C = {
  primary:       '#0f766e',
  text:          '#0f172a',
  textMuted:     '#64748b',
  textSubtle:    '#94a3b8',
  border:        '#e2e8f0',
  codeBg:        '#f8f9fa',
  codeBorder:    '#d0d7de',
  codeText:      '#24292f',
  codeLabel:     '#656d76',
  easyText:      '#2e7d32',
  easyBg:        '#e8f5e9',
  mediumText:    '#e65100',
  mediumBg:      '#fff3e0',
  hardText:      '#c62828',
  hardBg:        '#fce4ec',
  tagText:       '#64748b',
  tagBg:         '#f1f5f9',
  tableBorder:   '#d0d7de',
  tableHeaderBg: '#f0f3f6',
  tableStripeBg: '#f8f9fa',
};

const MARGIN = 50;
const CODE_FONT_SIZE = 7.8;
const CODE_PAD_X = 12;
const CODE_PAD_Y = 10;
const CODE_RADIUS = 6;
const BODY_FONT_SIZE = 10;
const BODY_LINE_GAP = 3;

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
};

// ---------------------------------------------------------------------------
// Frontmatter parsing
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Read questions from disk
// ---------------------------------------------------------------------------

export function readQuestions(questionsDir: string): QuestionData[] {
  const indexPath = join(questionsDir, 'index.json');
  if (!existsSync(indexPath)) return [];
  const fileList: string[] = JSON.parse(readFileSync(indexPath, 'utf-8'));
  const questions: QuestionData[] = [];
  for (const file of fileList) {
    if (!/^q\d+\.md$/.test(file)) continue;
    const filePath = join(questionsDir, file);
    if (!existsSync(filePath)) continue;
    const raw = readFileSync(filePath, 'utf-8').replace(/\r/g, '');
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

// ---------------------------------------------------------------------------
// PDF helpers (ported from src/api/pdf.router.ts)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = any;

function contentW(doc: Doc): number {
  return doc.page.width - MARGIN * 2;
}

function bottomY(doc: Doc): number {
  return doc.page.height - doc.page.margins.bottom;
}

function resetCursor(doc: Doc): void {
  doc.x = MARGIN;
  doc.font('Helvetica').fontSize(BODY_FONT_SIZE).fillColor(C.text);
}

function freshPage(doc: Doc): void {
  doc.addPage();
  doc.save().rect(0, 0, doc.page.width, 4).fill(C.primary).restore();
  doc.x = MARGIN;
  doc.y = MARGIN;
  resetCursor(doc);
}

function ensureSpace(doc: Doc, needed: number): boolean {
  if (doc.y + needed > bottomY(doc)) {
    freshPage(doc);
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Inline markdown parsing
// ---------------------------------------------------------------------------

interface Segment { text: string; bold?: boolean; italic?: boolean; code?: boolean }

function parseInline(text: string): Segment[] {
  const segments: Segment[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segments.push({ text: text.slice(last, m.index) });
    const tok = m[0];
    if (tok.startsWith('`')) segments.push({ text: tok.slice(1, -1), code: true });
    else if (tok.startsWith('**') || tok.startsWith('__')) segments.push({ text: tok.slice(2, -2), bold: true });
    else if (tok.startsWith('*') || tok.startsWith('_')) segments.push({ text: tok.slice(1, -1), italic: true });
    else segments.push({ text: tok.match(/^\[([^\]]+)\]/)?.[1] ?? tok });
    last = re.lastIndex;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments.filter((s) => s.text.length > 0);
}

function renderInline(
  doc: Doc,
  text: string,
  opts: { fontSize?: number; color?: string; lineGap?: number; indent?: number } = {},
): void {
  const segments = parseInline(text);
  if (segments.length === 0) return;
  const fs = opts.fontSize ?? BODY_FONT_SIZE;
  const color = opts.color ?? C.text;
  const lg = opts.lineGap ?? BODY_LINE_GAP;
  const w = contentW(doc) - (opts.indent ?? 0);

  ensureSpace(doc, fs + lg + 4);

  const x = MARGIN + (opts.indent ?? 0);

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const continued = i < segments.length - 1;
    const isFirst = i === 0;

    if (seg.code) doc.font('Courier').fontSize(fs * 0.9).fillColor(C.primary);
    else if (seg.bold) doc.font('Helvetica-Bold').fontSize(fs).fillColor(color);
    else if (seg.italic) doc.font('Helvetica-Oblique').fontSize(fs).fillColor(color);
    else doc.font('Helvetica').fontSize(fs).fillColor(color);

    if (isFirst) doc.text(seg.text, x, doc.y, { continued, lineGap: lg, width: w });
    else doc.text(seg.text, { continued, lineGap: lg, width: w });
  }

  doc.x = MARGIN;
  doc.font('Helvetica').fontSize(fs).fillColor(color);
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

function drawBadge(
  doc: Doc,
  x: number, y: number,
  label: string,
  bgColor: string, textColor: string,
  fontSize = 7,
): number {
  doc.font('Helvetica-Bold').fontSize(fontSize);
  const tw = doc.widthOfString(label);
  const pH = 5; const pV = 3;
  const bw = tw + pH * 2; const bh = fontSize + pV * 2 + 2;
  doc.save().roundedRect(x, y, bw, bh, bh / 2).fill(bgColor).restore();
  doc.font('Helvetica-Bold').fontSize(fontSize).fillColor(textColor)
    .text(label, x + pH, y + pV + 0.5, { lineBreak: false });
  return bw;
}

// ---------------------------------------------------------------------------
// Code blocks
// ---------------------------------------------------------------------------

function measureCodeLineHeight(doc: Doc, line: string, textW: number): number {
  doc.font('Courier').fontSize(CODE_FONT_SIZE);
  const lineW = doc.widthOfString(line || ' ');
  const wrappedLines = Math.max(1, Math.ceil(lineW / textW));
  return wrappedLines * (doc.currentLineHeight(true) + 1);
}

function measureCodeBlock(doc: Doc, lines: string[], lang: string): number {
  const langH = lang ? 16 : 0;
  const textW = contentW(doc) - CODE_PAD_X * 2;
  let totalH = CODE_PAD_Y * 2 + langH;
  for (const line of lines) totalH += measureCodeLineHeight(doc, line, textW);
  return totalH;
}

function drawSingleCodeBlock(doc: Doc, lines: string[], lang: string, w: number): void {
  const textW = w - CODE_PAD_X * 2;
  const blockH = measureCodeBlock(doc, lines, lang);
  const x = MARGIN;
  const startY = doc.y;

  doc.save().roundedRect(x, startY, w, blockH, CODE_RADIUS).fill(C.codeBg).restore();
  doc.save().roundedRect(x, startY, w, blockH, CODE_RADIUS)
    .strokeColor(C.codeBorder).lineWidth(0.75).stroke().restore();

  let textY = startY + CODE_PAD_Y;
  if (lang) {
    doc.font('Helvetica-Bold').fontSize(6.5).fillColor(C.codeLabel)
      .text(lang.toUpperCase(), x + CODE_PAD_X, textY, { width: textW, lineBreak: false });
    textY += 16;
  }

  doc.font('Courier').fontSize(CODE_FONT_SIZE).fillColor(C.codeText);
  for (const line of lines) {
    const h = measureCodeLineHeight(doc, line, textW);
    doc.text(line === '' ? ' ' : line, x + CODE_PAD_X, textY, { width: textW });
    textY += h;
  }

  doc.x = MARGIN;
  doc.y = startY + blockH + 4;
}

function renderSplitCodeBlock(doc: Doc, lines: string[], lang: string, w: number): void {
  const textW = w - CODE_PAD_X * 2;
  let lineIdx = 0;
  let isFirstChunk = true;

  while (lineIdx < lines.length) {
    const availH = bottomY(doc) - doc.y - 8;
    const minLine = measureCodeLineHeight(doc, lines[lineIdx], textW);
    if (availH < minLine + CODE_PAD_Y * 2) { freshPage(doc); continue; }

    const langH = isFirstChunk && lang ? 16 : 0;
    let usedH = CODE_PAD_Y + langH;
    const chunkStart = lineIdx;
    while (lineIdx < lines.length) {
      const lh = measureCodeLineHeight(doc, lines[lineIdx], textW);
      if (usedH + lh + CODE_PAD_Y > availH && lineIdx > chunkStart) break;
      usedH += lh;
      lineIdx++;
    }
    usedH += CODE_PAD_Y;
    const chunk = lines.slice(chunkStart, lineIdx);

    const x = MARGIN;
    const startY = doc.y;
    doc.save().roundedRect(x, startY, w, usedH, CODE_RADIUS).fill(C.codeBg).restore();
    doc.save().roundedRect(x, startY, w, usedH, CODE_RADIUS)
      .strokeColor(C.codeBorder).lineWidth(0.75).stroke().restore();

    let textY = startY + CODE_PAD_Y;
    if (isFirstChunk && lang) {
      doc.font('Helvetica-Bold').fontSize(6.5).fillColor(C.codeLabel)
        .text(lang.toUpperCase(), x + CODE_PAD_X, textY, { width: textW, lineBreak: false });
      textY += 16;
    }

    doc.font('Courier').fontSize(CODE_FONT_SIZE).fillColor(C.codeText);
    for (const line of chunk) {
      const h = measureCodeLineHeight(doc, line, textW);
      doc.text(line === '' ? ' ' : line, x + CODE_PAD_X, textY, { width: textW });
      textY += h;
    }

    doc.x = MARGIN;
    doc.y = startY + usedH + 4;
    isFirstChunk = false;
    if (lineIdx < lines.length) freshPage(doc);
  }
}

function renderCodeBlock(doc: Doc, lines: string[], lang: string): void {
  const w = contentW(doc);
  const totalH = measureCodeBlock(doc, lines, lang);
  const maxPageH = bottomY(doc) - MARGIN;

  if (totalH <= maxPageH) {
    ensureSpace(doc, totalH + 8);
    drawSingleCodeBlock(doc, lines, lang, w);
  } else {
    renderSplitCodeBlock(doc, lines, lang, w);
  }

  doc.moveDown(0.5);
  resetCursor(doc);
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

function parseTableRow(line: string): string[] {
  return line.split('|').slice(1, -1).map(cell => cell.trim());
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.every(cell => /^:?-+:?$/.test(cell));
}

function renderTable(doc: Doc, rows: string[][]): void {
  const numCols = rows[0].length;
  const w = contentW(doc);
  const cellPadX = 6;
  const cellPadY = 5;
  const fontSize = 8;
  const colW = w / numCols;

  doc.font('Helvetica').fontSize(fontSize);
  const rowHeights: number[] = rows.map(row => {
    let maxH = fontSize + cellPadY * 2;
    row.forEach(cell => {
      const tw = colW - cellPadX * 2;
      const th = doc.heightOfString(cell, { width: tw }) + cellPadY * 2;
      if (th > maxH) maxH = th;
    });
    return maxH;
  });

  ensureSpace(doc, Math.min(rowHeights.reduce((a, b) => a + b, 0), 100));

  const x0 = MARGIN;

  rows.forEach((row, ri) => {
    const rh = rowHeights[ri];
    if (doc.y + rh > bottomY(doc)) freshPage(doc);

    const rowY = doc.y;
    const isHeader = ri === 0;

    if (isHeader) doc.save().rect(x0, rowY, w, rh).fill(C.tableHeaderBg).restore();
    else if (ri % 2 === 0) doc.save().rect(x0, rowY, w, rh).fill(C.tableStripeBg).restore();

    row.forEach((cell, ci) => {
      const cx = x0 + ci * colW;
      doc.save().rect(cx, rowY, colW, rh)
        .strokeColor(C.tableBorder).lineWidth(0.5).stroke().restore();
      const font = isHeader ? 'Helvetica-Bold' : 'Helvetica';
      doc.font(font).fontSize(fontSize).fillColor(C.text)
        .text(cell, cx + cellPadX, rowY + cellPadY, { width: colW - cellPadX * 2, lineGap: 1 });
    });

    doc.x = MARGIN;
    doc.y = rowY + rh;
  });

  doc.moveDown(0.4);
  doc.x = MARGIN;
  resetCursor(doc);
}

// ---------------------------------------------------------------------------
// Full markdown renderer
// ---------------------------------------------------------------------------

function renderMarkdown(doc: Doc, markdown: string): void {
  const lines = markdown.split('\n');
  let inCode = false;
  let codeLines: string[] = [];
  let codeLang = '';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (inCode) {
        renderCodeBlock(doc, codeLines, codeLang);
        inCode = false; codeLines = []; codeLang = '';
      } else {
        inCode = true;
        codeLang = trimmed.slice(3).trim();
      }
      i++; continue;
    }
    if (inCode) { codeLines.push(line); i++; continue; }
    if (trimmed === '') { doc.moveDown(0.3); i++; continue; }

    // Tables
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableRows: string[][] = [];
      while (i < lines.length) {
        const tl = lines[i].trim();
        if (!tl.startsWith('|') || !tl.endsWith('|')) break;
        const cells = parseTableRow(tl);
        if (!isSeparatorRow(cells)) tableRows.push(cells);
        i++;
      }
      if (tableRows.length > 0) renderTable(doc, tableRows);
      continue;
    }

    // Headings
    const hm = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (hm) {
      const level = hm[1].length;
      const sizes = [14, 12, 11] as const;
      const fs = sizes[level - 1] ?? 11;
      ensureSpace(doc, fs + 10);
      const headText = hm[2].replace(/\*\*([^*]+)\*\*/g, '$1');
      doc.font('Helvetica-Bold').fontSize(fs).fillColor(C.text)
        .text(headText, MARGIN, doc.y, { width: contentW(doc), lineGap: 2 });
      doc.moveDown(0.3);
      doc.x = MARGIN;
      i++; continue;
    }

    // Horizontal rules
    if (/^(---|\*\*\*|___)$/.test(trimmed)) {
      doc.moveDown(0.4);
      doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + contentW(doc), doc.y)
        .strokeColor(C.border).lineWidth(0.5).stroke();
      doc.moveDown(0.5);
      i++; continue;
    }

    // Blockquotes
    if (trimmed.startsWith('> ')) {
      const qText = trimmed.slice(2);
      ensureSpace(doc, 18);
      const beforeY = doc.y;
      doc.font('Helvetica-Oblique').fontSize(BODY_FONT_SIZE).fillColor(C.textMuted)
        .text(qText.replace(/\*\*([^*]+)\*\*/g, '$1'), MARGIN + 14, doc.y, {
          width: contentW(doc) - 14, lineGap: BODY_LINE_GAP,
        });
      const afterY = doc.y;
      doc.save().rect(MARGIN + 2, beforeY - 1, 3, afterY - beforeY + 2).fill(C.primary).restore();
      doc.moveDown(0.3);
      doc.x = MARGIN;
      i++; continue;
    }

    // Unordered lists
    const ul = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (ul) {
      const depth = Math.min(Math.floor(ul[1].length / 2), 3);
      const indent = depth * 14 + 12;
      ensureSpace(doc, 16);
      const dotY = doc.y + 4;
      doc.save().circle(MARGIN + indent - 6, dotY, 1.8).fill(C.textMuted).restore();
      renderInline(doc, ul[2], { indent, lineGap: BODY_LINE_GAP });
      i++; continue;
    }

    // Ordered lists
    const ol = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
    if (ol) {
      const depth = Math.min(Math.floor(ol[1].length / 2), 3);
      const indent = depth * 14 + 12;
      ensureSpace(doc, 16);
      doc.font('Helvetica').fontSize(BODY_FONT_SIZE).fillColor(C.text)
        .text(`${ol[2]}.`, MARGIN + indent - 14, doc.y, { continued: true, width: contentW(doc) - indent + 14 });
      doc.text(' ', { continued: true });
      const segments = parseInline(ol[3]);
      for (let si = 0; si < segments.length; si++) {
        const seg = segments[si];
        const continued = si < segments.length - 1;
        if (seg.code) doc.font('Courier').fontSize(BODY_FONT_SIZE * 0.9).fillColor(C.primary);
        else if (seg.bold) doc.font('Helvetica-Bold').fontSize(BODY_FONT_SIZE).fillColor(C.text);
        else if (seg.italic) doc.font('Helvetica-Oblique').fontSize(BODY_FONT_SIZE).fillColor(C.text);
        else doc.font('Helvetica').fontSize(BODY_FONT_SIZE).fillColor(C.text);
        doc.text(seg.text, { continued, lineGap: BODY_LINE_GAP });
      }
      doc.x = MARGIN;
      i++; continue;
    }

    // Normal paragraph text
    renderInline(doc, trimmed, { lineGap: BODY_LINE_GAP });
    i++;
  }

  if (inCode && codeLines.length > 0) {
    renderCodeBlock(doc, codeLines, codeLang);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateDossierPdf(questionsDir: string, technologyName: string): Promise<Buffer> {
  const questions = readQuestions(questionsDir);

  if (questions.length === 0) {
    throw new Error('No questions found');
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: MARGIN,
      size: 'A4',
      autoFirstPage: false,
      info: {
        Title: `${technologyName} — Preguntas de Entrevista`,
        Author: 'Manuel Ferrer',
        Subject: `${questions.length} preguntas de entrevista de ${technologyName}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ---- Cover page ----
    doc.addPage();
    const pw = doc.page.width;
    doc.save().rect(0, 0, pw, 6).fill(C.primary).restore();

    doc.y = doc.page.height / 2 - 100;

    doc.font('Helvetica').fontSize(11).fillColor(C.textMuted)
      .text('preguntas-entrevista.dev', MARGIN, doc.y, { width: contentW(doc), align: 'center' });
    doc.moveDown(1.2);
    doc.font('Helvetica-Bold').fontSize(42).fillColor(C.primary)
      .text(technologyName, MARGIN, doc.y, { width: contentW(doc), align: 'center' });
    doc.moveDown(0.6);
    doc.font('Helvetica').fontSize(17).fillColor(C.text)
      .text('Preguntas de Entrevista', MARGIN, doc.y, { width: contentW(doc), align: 'center' });
    doc.moveDown(1.8);

    const cx = pw / 2;
    doc.moveTo(cx - 50, doc.y).lineTo(cx + 50, doc.y)
      .strokeColor(C.border).lineWidth(1).stroke();
    doc.moveDown(1.2);

    doc.font('Helvetica-Bold').fontSize(13).fillColor(C.textMuted)
      .text(`${questions.length} preguntas`, MARGIN, doc.y, { width: contentW(doc), align: 'center' });
    doc.moveDown(0.5);
    const date = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.font('Helvetica').fontSize(10).fillColor(C.textSubtle)
      .text(date, MARGIN, doc.y, { width: contentW(doc), align: 'center' });

    doc.save().rect(0, doc.page.height - 6, pw, 6).fill(C.primary).restore();

    // ---- Questions ----
    freshPage(doc);

    const HEADER_SPACE = 80;

    questions.forEach((question, index) => {
      if (index > 0) {
        if (doc.y + HEADER_SPACE > bottomY(doc)) {
          freshPage(doc);
        } else {
          doc.moveDown(1);
          doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + contentW(doc), doc.y)
            .strokeColor(C.border).lineWidth(0.5).stroke();
          doc.moveDown(1);
        }
      }

      const headerY = doc.y;

      // Accent bar next to title
      doc.save().rect(MARGIN - 8, headerY - 2, 3, 22).fill(C.primary).restore();

      doc.font('Helvetica-Bold').fontSize(13).fillColor(C.text)
        .text(`${index + 1}. ${question.title}`, MARGIN, doc.y, { width: contentW(doc), lineGap: 3 });
      doc.moveDown(0.5);

      // Difficulty & tag badges
      const diffLabel = DIFFICULTY_LABELS[question.difficulty] ?? question.difficulty;
      const diffTextColor = question.difficulty === 'easy' ? C.easyText : question.difficulty === 'hard' ? C.hardText : C.mediumText;
      const diffBgColor = question.difficulty === 'easy' ? C.easyBg : question.difficulty === 'hard' ? C.hardBg : C.mediumBg;

      let bx = MARGIN;
      const by = doc.y;
      bx += drawBadge(doc, bx, by, diffLabel, diffBgColor, diffTextColor) + 5;
      for (const tag of question.tags.slice(0, 5)) {
        if (bx > MARGIN + contentW(doc) - 50) break;
        bx += drawBadge(doc, bx, by, tag, C.tagBg, C.tagText) + 4;
      }

      doc.x = MARGIN;
      doc.y = by + 18;
      doc.moveDown(0.5);

      doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + contentW(doc), doc.y)
        .strokeColor(C.border).lineWidth(0.4).stroke();
      doc.moveDown(0.7);

      resetCursor(doc);
      if (question.content) {
        renderMarkdown(doc, question.content);
      }
    });

    doc.end();
  });
}
