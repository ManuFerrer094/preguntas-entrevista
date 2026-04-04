import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'glob';
import { findBrokenCharacters, normalizeWhitespace, parseFrontmatter } from './lib/editorial-rules.mjs';

const QUESTION_FILES = globSync('questions/**/*.md', { nodir: true }).sort();

function normalizeFrontmatterValue(value) {
  return typeof value === 'string' ? value.normalize('NFC').trim() : value;
}

function serializeFrontmatter(metadata) {
  const lines = ['---'];

  for (const [key, value] of Object.entries(metadata)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.join(', ')}]`);
      continue;
    }

    lines.push(`${key}: ${String(value)}`);
  }

  return `${lines.join('\n')}\n---`;
}

let normalized = 0;

for (const file of QUESTION_FILES) {
  const source = readFileSync(file, 'utf8');
  const { metadata, body } = parseFrontmatter(source);
  const broken = findBrokenCharacters(source);

  if (broken.includes('mojibake')) {
    throw new Error(`${file}: contiene mojibake; corrígelo con la curación editorial, no con este script.`);
  }

  const cleanedMetadata = Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (Array.isArray(value)) {
        return [key, value.map((entry) => entry.normalize('NFC').trim())];
      }

      return [key, normalizeFrontmatterValue(value)];
    }),
  );

  const output = `${serializeFrontmatter(cleanedMetadata)}\n\n${normalizeWhitespace(
    body.normalize('NFC'),
  )}\n`;

  if (output !== source) {
    writeFileSync(file, output, 'utf8');
    normalized += 1;
  }
}

console.log(`Normalizadas ${normalized} preguntas sin alterar su contenido editorial.`);
