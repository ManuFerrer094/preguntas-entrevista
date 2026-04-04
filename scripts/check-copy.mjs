import { readFileSync } from 'node:fs';
import { globSync } from 'glob';

const QUESTION_FILES = globSync('questions/**/*.md', { nodir: true });
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

const REQUIRED_HEADINGS = [
  '## Qué evalúa el entrevistador',
  '## Respuesta sólida',
  '## Compromisos y errores comunes',
  '## Ejemplo o caso real',
  '## Frase corta de entrevista',
];

const BANNED_VISIBLE_PATTERNS = [
  /trade-offs/i,
  /\bfallbacks?\b/i,
  /\bownership\b/i,
  /\bevergreen\b/i,
  /\bcluster tem[áa]tico\b/i,
  /\btopic no disponible\b/i,
];

const WORD_LABELS = {
  api: 'API',
  debug: 'depuración',
  feature: 'funcionalidad',
  hooks: 'hooks',
  http: 'HTTP',
  i18n: 'internacionalización',
  query: 'Query',
  router: 'Router',
  ssr: 'SSR',
  ui: 'interfaz',
};

function humanizeTag(tag) {
  return tag
    .split('-')
    .filter(Boolean)
    .map((chunk) => WORD_LABELS[chunk] ?? chunk)
    .join(' ')
    .trim();
}

function collectQuestionTags(source) {
  const match = source.match(/^tags:\s*\[([^\]]*)\]/m);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function findBrokenCharacters(source) {
  const sanitized = source.replace(/https?:\/\/\S+/g, '');
  return (
    sanitized.match(
      /[A-Za-zÁÉÍÓÚáéíóúñÑ]\?[A-Za-zÁÉÍÓÚáéíóúñÑ?]+|\?[A-Za-zÁÉÍÓÚáéíóúñÑ][A-Za-zÁÉÍÓÚáéíóúñÑ?]*/g,
    ) ?? []
  );
}

const failures = [];

for (const file of QUESTION_FILES) {
  const source = readFileSync(file, 'utf8');
  const body = source.replace(/^---[\s\S]*?---\s*/m, '');
  const broken = findBrokenCharacters(source);

  if (broken.length > 0) {
    failures.push(`${file}: caracteres rotos detectados (${broken.slice(0, 5).join(', ')})`);
  }

  for (const heading of REQUIRED_HEADINGS) {
    if (!body.includes(heading)) {
      failures.push(`${file}: falta el heading obligatorio "${heading}"`);
    }
  }

  for (const pattern of BANNED_VISIBLE_PATTERNS) {
    if (pattern.test(body)) {
      failures.push(`${file}: anglicismo visible no permitido (${pattern})`);
    }
  }

  for (const tag of collectQuestionTags(source)) {
    const label = humanizeTag(tag);
    if (!label || label.includes('-')) {
      failures.push(`${file}: etiqueta sin salida visible válida (${tag})`);
    }
  }
}

for (const file of UI_FILES) {
  const source = readFileSync(file, 'utf8');
  const broken = findBrokenCharacters(source);
  if (broken.length > 0) {
    failures.push(`${file}: copy roto detectado (${broken.slice(0, 5).join(', ')})`);
  }

  for (const pattern of BANNED_VISIBLE_PATTERNS) {
    if (pattern.test(source)) {
      failures.push(`${file}: término visible a revisar (${pattern})`);
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
