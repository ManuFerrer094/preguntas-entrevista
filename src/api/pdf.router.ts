import { Router, Request, Response } from 'express';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import PDFDocument from 'pdfkit';

const VALID_TECHNOLOGIES = new Set(['angular', 'react', 'vue', 'nodejs', 'typescript', 'javascript']);

const TECH_DISPLAY_NAMES: Record<string, string> = {
  angular: 'Angular',
  react: 'React',
  vue: 'Vue.js',
  nodejs: 'Node.js',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
};

// Color palette matching the web design tokens (print-friendly)
const C = {
  primary:    '#1565c0',
  text:       '#0f172a',
  textMuted:  '#64748b',
  textSubtle: '#94a3b8',
  border:     '#e2e8f0',
  // Code blocks: print-friendly (white bg, dark text)
  codeBg:     '#f8f9fa',
  codeBorder: '#d0d7de',
  codeText:   '#24292f',
  codeLabel:  '#656d76',
  easyText:   '#2e7d32',
  easyBg:     '#e8f5e9',
  mediumText: '#e65100',
  mediumBg:   '#fff3e0',
  hardText:   '#c62828',
  hardBg:     '#fce4ec',
  tagText:    '#64748b',
  tagBg:      '#f1f5f9',
  tableBorder: '#d0d7de',
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

// ─── Frontmatter parsing ────────────────────────────────────────────────────

interface Frontmatter {
  title?: string;
  difficulty?: string;
  tags?: string[];
}

function parseFrontmatter(content: string): { metadata: Frontmatter; body: string } {
  if (!content.startsWith('---')) return { metadata: {}, body: content };
  const end = content.indexOf('\n---', 3);
  if (end === -1) return { metadata: {}, body: content };
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
      metadata.tags = inner.split(',').map((v) => v.trim()).filter((v) => v.length > 0);
    } else {
      (metadata as Record<string, unknown>)[key] = value;
    }
  }
  return { metadata, body };
}

// ─── Question loading ────────────────────────────────────────────────────────

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
      readFile(join(questionsDir, technology, filename), 'utf-8').then((raw) => {
        const content = raw.replace(/\r/g, '');
        const { metadata, body } = parseFrontmatter(content);
        const title = metadata.title ?? '';
        if (!title) return null;
        return { title, difficulty: metadata.difficulty ?? 'medium', tags: metadata.tags ?? [], body } satisfies Question;
      }),
    ),
  );

  return results
    .filter((r): r is PromiseFulfilledResult<Question> => r.status === 'fulfilled' && r.value !== null)
    .map((r) => r.value);
}

// ─── PDF helpers ─────────────────────────────────────────────────────────────

/** Returns usable content width for the current page. */
function contentW(doc: PDFKit.PDFDocument): number {
  return doc.page.width - MARGIN * 2;
}

/** Returns the Y coordinate of the bottom margin limit. */
function bottomY(doc: PDFKit.PDFDocument): number {
  return doc.page.height - doc.page.margins.bottom;
}

/** Ensures cursor is at left margin and resets font defaults. */
function resetCursor(doc: PDFKit.PDFDocument): void {
  doc.x = MARGIN;
  doc.font('Helvetica').fontSize(BODY_FONT_SIZE).fillColor(C.text);
}

/** Starts a fresh page with the accent bar and resets cursor. */
function freshPage(doc: PDFKit.PDFDocument): void {
  doc.addPage();
  doc.save().rect(0, 0, doc.page.width, 4).fill(C.primary).restore();
  doc.x = MARGIN;
  doc.y = MARGIN;
  resetCursor(doc);
}

/** Adds a new page if remaining space is less than `needed` px. Returns true if page was added. */
function ensureSpace(doc: PDFKit.PDFDocument, needed: number): boolean {
  if (doc.y + needed > bottomY(doc)) {
    freshPage(doc);
    return true;
  }
  return false;
}

// ─── Inline markdown rendering ───────────────────────────────────────────────

interface Segment { text: string; bold?: boolean; italic?: boolean; code?: boolean; }

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

/**
 * Renders a line of markdown-inline text with bold/italic/code formatting.
 * Always renders at MARGIN x with full content width.
 */
function renderInline(
  doc: PDFKit.PDFDocument,
  text: string,
  opts: { fontSize?: number; color?: string; lineGap?: number; indent?: number } = {},
): void {
  const segments = parseInline(text);
  if (segments.length === 0) return;
  const fs = opts.fontSize ?? BODY_FONT_SIZE;
  const color = opts.color ?? C.text;
  const lg = opts.lineGap ?? BODY_LINE_GAP;
  const w = contentW(doc) - (opts.indent ?? 0);

  // Ensure we have at least one line of space
  ensureSpace(doc, fs + lg + 4);

  const x = MARGIN + (opts.indent ?? 0);

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const continued = i < segments.length - 1;
    const isFirst = i === 0;

    if (seg.code) {
      doc.font('Courier').fontSize(fs * 0.9).fillColor(C.primary);
    } else if (seg.bold) {
      doc.font('Helvetica-Bold').fontSize(fs).fillColor(color);
    } else if (seg.italic) {
      doc.font('Helvetica-Oblique').fontSize(fs).fillColor(color);
    } else {
      doc.font('Helvetica').fontSize(fs).fillColor(color);
    }

    if (isFirst) {
      doc.text(seg.text, x, doc.y, { continued, lineGap: lg, width: w });
    } else {
      doc.text(seg.text, { continued, lineGap: lg, width: w });
    }
  }

  // Reset
  doc.x = MARGIN;
  doc.font('Helvetica').fontSize(fs).fillColor(color);
}

// ─── Badge helpers ───────────────────────────────────────────────────────────

function drawBadge(
  doc: PDFKit.PDFDocument,
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

// ─── Code block rendering ────────────────────────────────────────────────────

/**
 * Measures the actual height each code line will occupy when rendered
 * with word-wrap enabled. This prevents lines from overlapping.
 */
function measureCodeLineHeight(doc: PDFKit.PDFDocument, line: string, textW: number): number {
  doc.font('Courier').fontSize(CODE_FONT_SIZE);
  const lineW = doc.widthOfString(line || ' ');
  const wrappedLines = Math.max(1, Math.ceil(lineW / textW));
  return wrappedLines * (doc.currentLineHeight(true) + 1);
}

function measureCodeBlock(doc: PDFKit.PDFDocument, lines: string[], lang: string): number {
  const langH = lang ? 16 : 0;
  const textW = contentW(doc) - CODE_PAD_X * 2;
  let totalH = CODE_PAD_Y * 2 + langH;
  for (const line of lines) {
    totalH += measureCodeLineHeight(doc, line, textW);
  }
  return totalH;
}

function renderCodeBlock(doc: PDFKit.PDFDocument, lines: string[], lang: string): void {
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

function drawSingleCodeBlock(doc: PDFKit.PDFDocument, lines: string[], lang: string, w: number): void {
  const textW = w - CODE_PAD_X * 2;
  const blockH = measureCodeBlock(doc, lines, lang);
  const x = MARGIN;
  const startY = doc.y;

  // Light background with border for print
  doc.save()
    .roundedRect(x, startY, w, blockH, CODE_RADIUS)
    .fill(C.codeBg)
    .restore();
  doc.save()
    .roundedRect(x, startY, w, blockH, CODE_RADIUS)
    .strokeColor(C.codeBorder).lineWidth(0.75).stroke()
    .restore();

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

function renderSplitCodeBlock(doc: PDFKit.PDFDocument, lines: string[], lang: string, w: number): void {
  const textW = w - CODE_PAD_X * 2;
  let lineIdx = 0;
  let isFirstChunk = true;

  while (lineIdx < lines.length) {
    const availH = bottomY(doc) - doc.y - 8;
    const minLine = measureCodeLineHeight(doc, lines[lineIdx], textW);
    if (availH < minLine + CODE_PAD_Y * 2) {
      freshPage(doc);
      continue;
    }

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

    doc.save()
      .roundedRect(x, startY, w, usedH, CODE_RADIUS)
      .fill(C.codeBg)
      .restore();
    doc.save()
      .roundedRect(x, startY, w, usedH, CODE_RADIUS)
      .strokeColor(C.codeBorder).lineWidth(0.75).stroke()
      .restore();

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

// ─── Table rendering ─────────────────────────────────────────────────────────

function parseTableRow(line: string): string[] {
  return line.split('|').slice(1, -1).map(cell => cell.trim());
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.every(cell => /^:?-+:?$/.test(cell));
}

function renderTable(doc: PDFKit.PDFDocument, rows: string[][]): void {
  const numCols = rows[0].length;
  const w = contentW(doc);
  const cellPadX = 6;
  const cellPadY = 5;
  const fontSize = 8;
  const colW = w / numCols;

  // Measure total height
  doc.font('Helvetica').fontSize(fontSize);
  const rowHeights: number[] = rows.map(row => {
    let maxH = fontSize + cellPadY * 2;
    row.forEach((cell, ci) => {
      const tw = colW - cellPadX * 2;
      const th = doc.heightOfString(cell, { width: tw }) + cellPadY * 2;
      if (th > maxH) maxH = th;
    });
    return maxH;
  });
  const totalH = rowHeights.reduce((a, b) => a + b, 0);

  ensureSpace(doc, Math.min(totalH, 100)); // at least room for header + a few rows

  const x0 = MARGIN;

  rows.forEach((row, ri) => {
    const rh = rowHeights[ri];

    // Page break if needed
    if (doc.y + rh > bottomY(doc)) {
      freshPage(doc);
    }

    const rowY = doc.y;
    const isHeader = ri === 0;

    // Row background
    if (isHeader) {
      doc.save().rect(x0, rowY, w, rh).fill(C.tableHeaderBg).restore();
    } else if (ri % 2 === 0) {
      doc.save().rect(x0, rowY, w, rh).fill(C.tableStripeBg).restore();
    }

    // Cell borders and text
    row.forEach((cell, ci) => {
      const cx = x0 + ci * colW;
      // Cell border
      doc.save().rect(cx, rowY, colW, rh)
        .strokeColor(C.tableBorder).lineWidth(0.5).stroke().restore();
      // Cell text
      const font = isHeader ? 'Helvetica-Bold' : 'Helvetica';
      doc.font(font).fontSize(fontSize).fillColor(C.text)
        .text(cell, cx + cellPadX, rowY + cellPadY, {
          width: colW - cellPadX * 2,
          lineGap: 1,
        });
    });

    doc.x = MARGIN;
    doc.y = rowY + rh;
  });

  doc.moveDown(0.4);
  doc.x = MARGIN;
  resetCursor(doc);
}

// ─── Markdown → PDF body renderer ────────────────────────────────────────────

function renderMarkdown(doc: PDFKit.PDFDocument, markdown: string): void {
  const lines = markdown.split('\n');
  let inCode = false;
  let codeLines: string[] = [];
  let codeLang = '';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code fence
    if (trimmed.startsWith('```')) {
      if (inCode) {
        renderCodeBlock(doc, codeLines, codeLang);
        inCode = false;
        codeLines = [];
        codeLang = '';
      } else {
        inCode = true;
        codeLang = trimmed.slice(3).trim();
      }
      i++;
      continue;
    }
    if (inCode) { codeLines.push(line); i++; continue; }

    // Empty line
    if (trimmed === '') { doc.moveDown(0.3); i++; continue; }

    // Table: collect all consecutive | rows, skip separator, render
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableRows: string[][] = [];
      while (i < lines.length) {
        const tl = lines[i].trim();
        if (!tl.startsWith('|') || !tl.endsWith('|')) break;
        const cells = parseTableRow(tl);
        if (!isSeparatorRow(cells)) {
          tableRows.push(cells);
        }
        i++;
      }
      if (tableRows.length > 0) {
        renderTable(doc, tableRows);
      }
      continue;
    }

    // Heading
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
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(---|\*\*\*|___)$/.test(trimmed)) {
      doc.moveDown(0.4);
      doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + contentW(doc), doc.y)
        .strokeColor(C.border).lineWidth(0.5).stroke();
      doc.moveDown(0.5);
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      const qText = trimmed.slice(2);
      ensureSpace(doc, 18);
      const beforeY = doc.y;
      doc.font('Helvetica-Oblique').fontSize(BODY_FONT_SIZE).fillColor(C.textMuted)
        .text(qText.replace(/\*\*([^*]+)\*\*/g, '$1'), MARGIN + 14, doc.y, {
          width: contentW(doc) - 14,
          lineGap: BODY_LINE_GAP,
        });
      const afterY = doc.y;
      doc.save()
        .rect(MARGIN + 2, beforeY - 1, 3, afterY - beforeY + 2)
        .fill(C.primary)
        .restore();
      doc.moveDown(0.3);
      doc.x = MARGIN;
      i++;
      continue;
    }

    // Bullet list
    const ul = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (ul) {
      const depth = Math.min(Math.floor(ul[1].length / 2), 3);
      const indent = depth * 14 + 12;
      ensureSpace(doc, 16);
      const dotY = doc.y + 4;
      doc.save().circle(MARGIN + indent - 6, dotY, 1.8).fill(C.textMuted).restore();
      renderInline(doc, ul[2], { indent, lineGap: BODY_LINE_GAP });
      i++;
      continue;
    }

    // Ordered list
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
      i++;
      continue;
    }

    // Normal paragraph
    renderInline(doc, trimmed, { lineGap: BODY_LINE_GAP });
    i++;
  }

  // Flush any unterminated code block
  if (inCode && codeLines.length > 0) {
    renderCodeBlock(doc, codeLines, codeLang);
  }
}

// ─── PDF builder ─────────────────────────────────────────────────────────────

function buildPdf(technology: string, questions: Question[]): Promise<Buffer> {
  const techName = TECH_DISPLAY_NAMES[technology]
    ?? technology.charAt(0).toUpperCase() + technology.slice(1);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: MARGIN,
      size: 'A4',
      autoFirstPage: false, // we control all pages
      info: {
        Title: `${techName} — Preguntas de Entrevista`,
        Author: 'Manuel Ferrer',
        Subject: `${questions.length} preguntas de entrevista de ${techName}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Cover page ────────────────────────────────────────────────────────
    doc.addPage();
    const pw = doc.page.width;

    // Top accent bar
    doc.save().rect(0, 0, pw, 6).fill(C.primary).restore();

    // Centered content
    doc.y = doc.page.height / 2 - 100;

    doc.font('Helvetica').fontSize(11).fillColor(C.textMuted)
      .text('preguntas-entrevista.dev', MARGIN, doc.y, { width: contentW(doc), align: 'center' });
    doc.moveDown(1.2);
    doc.font('Helvetica-Bold').fontSize(42).fillColor(C.primary)
      .text(techName, MARGIN, doc.y, { width: contentW(doc), align: 'center' });
    doc.moveDown(0.6);
    doc.font('Helvetica').fontSize(17).fillColor(C.text)
      .text('Preguntas de Entrevista', MARGIN, doc.y, { width: contentW(doc), align: 'center' });
    doc.moveDown(1.8);

    // Short divider
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

    // Bottom accent bar
    doc.save().rect(0, doc.page.height - 6, pw, 6).fill(C.primary).restore();

    // ── Questions ──────────────────────────────────────────────────────────
    freshPage(doc);

    const HEADER_SPACE = 80;

    questions.forEach((question, index) => {
      if (index > 0) {
        // Check if there's room for the header, otherwise new page
        if (doc.y + HEADER_SPACE > bottomY(doc)) {
          freshPage(doc);
        } else {
          // Inter-question separator
          doc.moveDown(1);
          doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + contentW(doc), doc.y)
            .strokeColor(C.border).lineWidth(0.5).stroke();
          doc.moveDown(1);
        }
      }

      // ── Question header ──────────────────────────────────────────────────
      const headerY = doc.y;

      // Blue left accent bar
      doc.save().rect(MARGIN - 8, headerY - 2, 3, 22).fill(C.primary).restore();

      // Question number + title
      doc.font('Helvetica-Bold').fontSize(13).fillColor(C.text)
        .text(`${index + 1}. ${question.title}`, MARGIN, doc.y, { width: contentW(doc), lineGap: 3 });
      doc.moveDown(0.5);

      // Difficulty + tag badges
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

      // Thin separator under header
      doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + contentW(doc), doc.y)
        .strokeColor(C.border).lineWidth(0.4).stroke();
      doc.moveDown(0.7);

      // ── Body ──────────────────────────────────────────────────────────────
      resetCursor(doc);
      if (question.body) {
        renderMarkdown(doc, question.body);
      }
    });

    doc.end();
  });
}

// ─── Router ──────────────────────────────────────────────────────────────────

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
