import { readFileSync } from 'node:fs';
import { globSync } from 'glob';
import {
  BANNED_VISIBLE_PATTERNS,
  CODE_HEADING,
  requiredHeadingsFor,
  collectParagraphs,
  findBrokenCharacters,
  hasValidCodeBlock,
  humanizeTag,
  parseFrontmatter,
  requiresCode,
} from './lib/editorial-rules.mjs';

const QUESTION_FILES = globSync('questions/**/*.md', { nodir: true }).sort();
const UI_FILES = [
  'README.md',
  'src/app/features/home/home.component.ts',
  'src/app/features/question/question.component.ts',
  'src/app/features/site-page/site-page.component.ts',
  'src/app/features/technology/technology.component.ts',
  'src/app/features/technology/technology-guide.component.ts',
  'src/app/features/technology/technology-level.component.ts',
  'src/app/features/technology/technology-questions.component.ts',
  'src/app/features/technology/technology-topic.component.ts',
  'src/app/shared/components/footer/footer.component.ts',
];

const failures = [];
const paragraphMap = new Map();

function addFailure(message) {
  failures.push(message);
}

for (const file of QUESTION_FILES) {
  const source = readFileSync(file, 'utf8');
  const { metadata, body } = parseFrontmatter(source);
  const broken = findBrokenCharacters(source);

  if (broken.length > 0) {
    addFailure(`${file}: caracteres rotos detectados (${broken.slice(0, 5).join(', ')})`);
  }

  if (!metadata.title) addFailure(`${file}: falta title en el frontmatter`);
  if (!metadata.difficulty) addFailure(`${file}: falta difficulty en el frontmatter`);
  if (!Array.isArray(metadata.tags) || metadata.tags.length === 0) {
    addFailure(`${file}: faltan tags en el frontmatter`);
  }
  if (!metadata.summary) addFailure(`${file}: falta summary en el frontmatter`);
  if (!metadata.lastReviewed) addFailure(`${file}: falta lastReviewed en el frontmatter`);

  if (typeof metadata.summary === 'string') {
    const summary = metadata.summary.trim();
    if (summary.length < 45) addFailure(`${file}: summary demasiado corto`);
    if (summary.length > 170) addFailure(`${file}: summary demasiado largo`);
  }

  if (metadata.lastReviewed && !/^\d{4}-\d{2}-\d{2}$/.test(metadata.lastReviewed)) {
    addFailure(`${file}: lastReviewed debe tener formato YYYY-MM-DD`);
  }

  for (const heading of requiredHeadingsFor(file)) {
    if (!body.includes(heading)) {
      addFailure(`${file}: falta el heading obligatorio "${heading}"`);
    }
  }

  for (const pattern of BANNED_VISIBLE_PATTERNS) {
    if (pattern.test(body)) {
      addFailure(`${file}: boilerplate o anglicismo visible no permitido (${pattern})`);
    }
  }

  for (const tag of Array.isArray(metadata.tags) ? metadata.tags : []) {
    const label = humanizeTag(tag);
    if (!label || label.includes('-')) {
      addFailure(`${file}: etiqueta sin salida visible válida (${tag})`);
    }
  }

  const needsCode = requiresCode({
    title: typeof metadata.title === 'string' ? metadata.title : '',
    tags: Array.isArray(metadata.tags) ? metadata.tags : [],
  });

  if (needsCode && !body.includes(CODE_HEADING)) {
    addFailure(`${file}: la pregunta requiere "${CODE_HEADING}"`);
  }

  if ((needsCode || body.includes(CODE_HEADING)) && !hasValidCodeBlock(body)) {
    addFailure(`${file}: falta un bloque de código válido con lenguaje y al menos 4 líneas`);
  }

  for (const paragraph of collectParagraphs(body)) {
    const key = paragraph.replace(/\s+/g, ' ').trim();
    const files = paragraphMap.get(key) ?? [];
    files.push(file);
    paragraphMap.set(key, files);
  }
}

for (const [paragraph, files] of paragraphMap.entries()) {
  if (files.length > 2) {
    addFailure(
      `Párrafo reutilizado en ${files.length} preguntas: "${paragraph.slice(0, 120)}..." (${files
        .slice(0, 4)
        .join(', ')})`,
    );
  }
}

for (const file of UI_FILES) {
  const source = readFileSync(file, 'utf8');
  const broken = findBrokenCharacters(source);

  if (broken.length > 0) {
    addFailure(`${file}: copy roto detectado (${broken.slice(0, 5).join(', ')})`);
  }

  for (const pattern of BANNED_VISIBLE_PATTERNS) {
    if (pattern.test(source)) {
      addFailure(`${file}: término visible a revisar (${pattern})`);
    }
  }
}

if (failures.length > 0) {
  console.error('Se han detectado problemas de copy:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Copy verificado correctamente en ${QUESTION_FILES.length} preguntas y ${UI_FILES.length} superficies de UI.`,
);
