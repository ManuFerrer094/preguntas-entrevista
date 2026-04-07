import { readFile, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { Frontmatter } from './interfaces/frontmatter.interface.js';
import type { QuestionSummary, AiQuestionsConfig } from './interfaces/ai-questions.interfaces.js';

export type { QuestionSummary, AiQuestionsConfig };

const TECH_DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  angular: 'Angular',
  react: 'React',
  vue: 'Vue.js',
  nodejs: 'Node.js',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  dotnet: '.NET / ASP.NET',
  razor: 'Razor',
  winforms: 'WinForms',
  java: 'Java',
  nextjs: 'Next.js',
  reactnative: 'React Native',
  graphql: 'GraphQL',
  csharp: 'C#',
};

const TECHNOLOGY_ALIASES: Record<string, string[]> = {
  angular: ['angular'],
  react: ['react', 'reactjs'],
  vue: ['vue', 'vuejs'],
  nextjs: ['nextjs', 'next js'],
  svelte: ['svelte'],
  javascript: ['javascript', 'java script', 'ecmascript', 'js'],
  typescript: ['typescript', 'type script'],
  nodejs: ['nodejs', 'node js', 'express'],
  nestjs: ['nestjs', 'nest js'],
  dotnet: ['dotnet', 'aspnet', 'asp net', 'net framework', 'net core', 'asp net core'],
  razor: ['razor', 'razor pages'],
  winforms: ['winforms', 'win forms', 'windows forms'],
  python: ['python'],
  django: ['django'],
  php: ['php'],
  laravel: ['laravel'],
  java: ['java'],
  spring: ['spring', 'spring boot'],
  csharp: ['csharp', 'c sharp'],
  go: ['go', 'golang'],
  sql: ['sql', 'postgresql', 'postgres', 'mysql', 'sqlite'],
  mongodb: ['mongodb', 'mongo db'],
  redis: ['redis'],
  graphql: ['graphql'],
  docker: ['docker'],
  kubernetes: ['kubernetes', 'k8s'],
  git: ['git'],
  css: ['css', 'scss', 'sass', 'less'],
  html: ['html'],
  flutter: ['flutter', 'dart'],
  reactnative: ['reactnative', 'react native', 'expo'],
  kotlin: ['kotlin'],
  swift: ['swift', 'swiftui'],
  ruby: ['ruby', 'rails', 'ruby on rails'],
  rust: ['rust'],
};

const STOP_WORDS = new Set([
  'a',
  'al',
  'algo',
  'and',
  'con',
  'de',
  'del',
  'el',
  'en',
  'es',
  'for',
  'frontend',
  'la',
  'las',
  'los',
  'of',
  'para',
  'por',
  'que',
  'se',
  'the',
  'una',
  'un',
  'y',
]);

const MIN_RECOMMENDED_QUESTIONS = 10;
const MAX_RECOMMENDED_QUESTIONS = 20;

interface ValidatedAiQuestion {
  technology: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  relevance: string;
}

interface AiQuestionsResult {
  technologies_detected: string[];
  questions: ValidatedAiQuestion[];
}

interface SelectionSignals {
  detectedTechnologySlugs: string[];
  keywordTokens: string[];
}

interface RankedCandidate {
  summary: QuestionSummary;
  score: number;
  matchedKeywords: string[];
}

function technologyDisplayName(slug: string): string {
  return (
    TECH_DISPLAY_NAME_OVERRIDES[slug] ??
    slug
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  );
}

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/asp\.net/g, ' aspnet ')
    .replace(/\.net/g, ' dotnet ')
    .replace(/c#/g, ' csharp ')
    .replace(/node\.js/g, ' nodejs ')
    .replace(/next\.js/g, ' nextjs ')
    .replace(/vue\.js/g, ' vuejs ')
    .replace(/react\.js/g, ' reactjs ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueStrings(values: string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function tokenize(text: string): string[] {
  return uniqueStrings(
    normalizeText(text)
      .split(' ')
      .filter((token) => token.length >= 2 && !STOP_WORDS.has(token)),
  );
}

function containsWholePhrase(text: string, phrase: string): boolean {
  return ` ${text} `.includes(` ${phrase} `);
}

function difficultyValue(value: unknown, fallback: string): 'easy' | 'medium' | 'hard' {
  if (value === 'easy' || value === 'medium' || value === 'hard') {
    return value;
  }

  if (fallback === 'easy' || fallback === 'medium' || fallback === 'hard') {
    return fallback;
  }

  return 'medium';
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
      metadata.tags = inner
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    } else {
      (metadata as Record<string, unknown>)[key] = value;
    }
  }
  return { metadata, body };
}

function technologyAliasesFor(slug: string): string[] {
  const normalizedDisplayName = normalizeText(technologyDisplayName(slug));
  return uniqueStrings(
    [slug, normalizedDisplayName, ...(TECHNOLOGY_ALIASES[slug] ?? [])]
      .map((alias) => normalizeText(alias))
      .filter((alias) => alias.length >= 2),
  );
}

function resolveTechnologySlug(value: string, knownTechnologies: Set<string>): string | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;

  if (knownTechnologies.has(normalized)) {
    return normalized;
  }

  for (const slug of knownTechnologies) {
    const aliases = technologyAliasesFor(slug);
    if (aliases.some((alias) => normalized === alias || containsWholePhrase(normalized, alias))) {
      return slug;
    }
  }

  return null;
}

function detectTechnologySlugs(text: string, knownTechnologies: Set<string>): string[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const detected: string[] = [];
  for (const slug of knownTechnologies) {
    if (
      technologyAliasesFor(slug).some(
        (alias) => normalized === alias || containsWholePhrase(normalized, alias),
      )
    ) {
      detected.push(slug);
    }
  }

  return uniqueStrings(detected);
}

function buildSelectionSignals(
  jobDescription: string,
  aiTechnologiesDetected: string[],
  knownTechnologies: Set<string>,
): SelectionSignals {
  const detectedTechnologySlugs = uniqueStrings([
    ...detectTechnologySlugs(jobDescription, knownTechnologies),
    ...aiTechnologiesDetected
      .map((technology) => resolveTechnologySlug(technology, knownTechnologies))
      .filter((technology): technology is string => Boolean(technology)),
  ]);

  const keywordTokens = uniqueStrings([
    ...tokenize(jobDescription),
    ...aiTechnologiesDetected.flatMap((technology) => tokenize(technology)),
  ]);

  return { detectedTechnologySlugs, keywordTokens };
}

function buildTitleIndex(summaries: QuestionSummary[]): Map<string, QuestionSummary[]> {
  const index = new Map<string, QuestionSummary[]>();

  for (const summary of summaries) {
    const key = normalizeText(summary.title);
    const bucket = index.get(key) ?? [];
    bucket.push(summary);
    index.set(key, bucket);
  }

  return index;
}

function resolveQuestionSummary(
  title: string,
  technology: string | undefined,
  summaries: QuestionSummary[],
  titleIndex: Map<string, QuestionSummary[]>,
  knownTechnologies: Set<string>,
): QuestionSummary | null {
  const normalizedTitle = normalizeText(title);
  if (!normalizedTitle) return null;

  const technologySlug = technology ? resolveTechnologySlug(technology, knownTechnologies) : null;
  const exactMatches = titleIndex.get(normalizedTitle) ?? [];

  if (technologySlug) {
    const exactTechMatch = exactMatches.find((summary) => summary.technology === technologySlug);
    if (exactTechMatch) return exactTechMatch;
  }

  if (exactMatches.length > 0) {
    return exactMatches[0] ?? null;
  }

  const candidates = technologySlug
    ? summaries.filter((summary) => summary.technology === technologySlug)
    : summaries;

  return (
    candidates.find((summary) => {
      const normalizedCandidate = normalizeText(summary.title);
      return (
        normalizedCandidate.includes(normalizedTitle) || normalizedTitle.includes(normalizedCandidate)
      );
    }) ?? null
  );
}

function scoreQuestionSummary(summary: QuestionSummary, signals: SelectionSignals): RankedCandidate {
  const matchedKeywords: string[] = [];
  const titleTokens = new Set(tokenize(summary.title));
  const tagTokens = new Set(summary.tags.flatMap((tag) => tokenize(tag)));
  const summaryTokens = new Set(tokenize(summary.summary ?? ''));

  let score = 0;

  if (signals.detectedTechnologySlugs.includes(summary.technology)) {
    score += 120;
  }

  for (const keyword of signals.keywordTokens) {
    if (tagTokens.has(keyword)) {
      score += 28;
      matchedKeywords.push(keyword);
      continue;
    }

    if (titleTokens.has(keyword)) {
      score += 14;
      matchedKeywords.push(keyword);
      continue;
    }

    if (summaryTokens.has(keyword)) {
      score += 8;
      matchedKeywords.push(keyword);
    }
  }

  if (score > 0) {
    score +=
      summary.difficulty === 'medium' ? 3 : summary.difficulty === 'hard' ? 2 : 1;
  }

  return {
    summary,
    score,
    matchedKeywords: uniqueStrings(matchedKeywords),
  };
}

function formatList(values: string[]): string {
  if (values.length === 0) return '';
  if (values.length === 1) return values[0] ?? '';
  if (values.length === 2) return `${values[0]} y ${values[1]}`;
  return `${values.slice(0, -1).join(', ')} y ${values[values.length - 1]}`;
}

function buildLocalRelevance(
  summary: QuestionSummary,
  matchedKeywords: string[],
  signals: SelectionSignals,
): string {
  const displayName = technologyDisplayName(summary.technology);
  const topKeywords = matchedKeywords.slice(0, 3);

  if (signals.detectedTechnologySlugs.includes(summary.technology) && topKeywords.length > 0) {
    return `Encaja porque la oferta menciona ${displayName} y además insiste en ${formatList(topKeywords)}.`;
  }

  if (signals.detectedTechnologySlugs.includes(summary.technology)) {
    return `Sirve para comprobar experiencia real en ${displayName}, una de las tecnologías centrales de la oferta.`;
  }

  if (topKeywords.length > 0) {
    return `Gana relevancia por los temas que aparecen en la oferta: ${formatList(topKeywords)}.`;
  }

  return `Complementa bien el stack detectado y ayuda a medir criterio práctico en ${displayName}.`;
}

function calculateQuestionTarget(signals: SelectionSignals): number {
  const byTechnology = signals.detectedTechnologySlugs.length * 5;
  return Math.min(
    MAX_RECOMMENDED_QUESTIONS,
    Math.max(MIN_RECOMMENDED_QUESTIONS, byTechnology || MIN_RECOMMENDED_QUESTIONS),
  );
}

function buildFallbackQuestions(
  jobDescription: string,
  aiTechnologiesDetected: string[],
  summaries: QuestionSummary[],
): ValidatedAiQuestion[] {
  const knownTechnologies = new Set(summaries.map((summary) => summary.technology));
  const signals = buildSelectionSignals(jobDescription, aiTechnologiesDetected, knownTechnologies);
  const target = calculateQuestionTarget(signals);

  const ranked = summaries
    .map((summary) => scoreQuestionSummary(summary, signals))
    .filter((candidate) => candidate.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.summary.technology.localeCompare(right.summary.technology, 'es') ||
        left.summary.title.localeCompare(right.summary.title, 'es'),
    );

  if (ranked.length === 0) {
    return [];
  }

  const selected: RankedCandidate[] = [];
  const seenTitles = new Set<string>();

  const addCandidate = (candidate: RankedCandidate): void => {
    if (selected.length >= target || seenTitles.has(candidate.summary.title)) {
      return;
    }

    seenTitles.add(candidate.summary.title);
    selected.push(candidate);
  };

  if (signals.detectedTechnologySlugs.length > 0) {
    const perTechnologyTarget = Math.max(
      3,
      Math.ceil(target / signals.detectedTechnologySlugs.length),
    );

    for (const technology of signals.detectedTechnologySlugs) {
      for (const candidate of ranked.filter((entry) => entry.summary.technology === technology)) {
        addCandidate(candidate);
        if (
          selected.filter((entry) => entry.summary.technology === technology).length >=
          perTechnologyTarget
        ) {
          break;
        }
      }
    }
  }

  for (const candidate of ranked) {
    addCandidate(candidate);
  }

  return selected.map((candidate) => ({
    technology: candidate.summary.technology,
    title: candidate.summary.title,
    difficulty: difficultyValue(candidate.summary.difficulty, 'medium'),
    tags: candidate.summary.tags,
    relevance: buildLocalRelevance(candidate.summary, candidate.matchedKeywords, signals),
  }));
}

function resolveModelQuestions(
  parsed: unknown,
  jobDescription: string,
  summaries: QuestionSummary[],
): ValidatedAiQuestion[] {
  if (!parsed || typeof parsed !== 'object') {
    return [];
  }

  const knownTechnologies = new Set(summaries.map((summary) => summary.technology));
  const obj = parsed as Record<string, unknown>;
  const rawTechnologies = Array.isArray(obj['technologies_detected'])
    ? (obj['technologies_detected'] as unknown[]).filter(
        (technology): technology is string => typeof technology === 'string',
      )
    : [];

  const signals = buildSelectionSignals(jobDescription, rawTechnologies, knownTechnologies);
  const titleIndex = buildTitleIndex(summaries);
  const seenTitles = new Set<string>();
  const resolved: ValidatedAiQuestion[] = [];

  if (!Array.isArray(obj['questions'])) {
    return resolved;
  }

  for (const entry of obj['questions'] as unknown[]) {
    if (!entry || typeof entry !== 'object') continue;

    const candidate = entry as Record<string, unknown>;
    const rawTitle = typeof candidate['title'] === 'string' ? candidate['title'] : '';
    const rawTechnology =
      typeof candidate['technology'] === 'string' ? candidate['technology'] : undefined;

    const summary = resolveQuestionSummary(
      rawTitle,
      rawTechnology,
      summaries,
      titleIndex,
      knownTechnologies,
    );

    if (!summary || seenTitles.has(summary.title)) {
      continue;
    }

    seenTitles.add(summary.title);
    resolved.push({
      technology: summary.technology,
      title: summary.title,
      difficulty: difficultyValue(candidate['difficulty'], summary.difficulty),
      tags: summary.tags,
      relevance:
        typeof candidate['relevance'] === 'string' && candidate['relevance'].trim().length > 0
          ? candidate['relevance'].trim()
          : buildLocalRelevance(summary, [], signals),
    });
  }

  return resolved;
}

function finalizeAiResponse(
  parsed: unknown,
  summaries: QuestionSummary[],
  jobDescription: string,
): AiQuestionsResult {
  const rawTechnologies =
    parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>)['technologies_detected'])
      ? ((parsed as Record<string, unknown>)['technologies_detected'] as unknown[]).filter(
          (technology): technology is string => typeof technology === 'string',
        )
      : [];

  const knownTechnologies = new Set(summaries.map((summary) => summary.technology));
  const signals = buildSelectionSignals(jobDescription, rawTechnologies, knownTechnologies);
  const target = calculateQuestionTarget(signals);

  const resolvedModelQuestions = resolveModelQuestions(parsed, jobDescription, summaries);
  const fallbackQuestions = buildFallbackQuestions(jobDescription, rawTechnologies, summaries);

  const seenTitles = new Set<string>();
  const mergedQuestions: ValidatedAiQuestion[] = [];

  for (const question of [...resolvedModelQuestions, ...fallbackQuestions]) {
    if (seenTitles.has(question.title)) continue;
    seenTitles.add(question.title);
    mergedQuestions.push(question);
    if (mergedQuestions.length >= target) break;
  }

  const detectedTechnologySlugs = uniqueStrings([
    ...signals.detectedTechnologySlugs,
    ...mergedQuestions.map((question) => question.technology),
  ]);

  return {
    technologies_detected: detectedTechnologySlugs.map((technology) =>
      technologyDisplayName(technology),
    ),
    questions: mergedQuestions,
  };
}

export async function loadAllQuestionSummaries(questionsDir: string): Promise<QuestionSummary[]> {
  const summaries: QuestionSummary[] = [];
  const candidateTechs = (await readdir(questionsDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const tech of candidateTechs) {
    const indexPath = join(questionsDir, tech, 'index.json');
    let filenames: string[];
    try {
      const indexContent = await readFile(indexPath, 'utf-8');
      filenames = JSON.parse(indexContent);
    } catch {
      continue;
    }

    const results = await Promise.allSettled(
      filenames
        .filter((filename) => basename(filename) === filename)
        .map((filename) =>
          readFile(join(questionsDir, tech, filename), 'utf-8').then((raw) => {
            const content = raw.replace(/\r/g, '');
            const { metadata } = parseFrontmatter(content);
            if (!metadata.title) return null;
            return {
              technology: tech,
              title: metadata.title,
              difficulty: metadata.difficulty ?? 'medium',
              tags: metadata.tags ?? [],
              summary: metadata.summary,
            } satisfies QuestionSummary;
          }),
        ),
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        summaries.push(result.value);
      }
    }
  }

  return summaries;
}

export function buildSystemPrompt(summaries: QuestionSummary[]): string {
  const grouped = new Map<string, QuestionSummary[]>();
  for (const summary of summaries) {
    const list = grouped.get(summary.technology) ?? [];
    list.push(summary);
    grouped.set(summary.technology, list);
  }

  let catalog = '';
  for (const [tech, questions] of grouped) {
    const displayName = technologyDisplayName(tech);
    catalog += `\n## ${displayName} (slug: ${tech})\n`;
    for (const question of questions) {
      catalog += `- [${question.difficulty}] ${question.title} (tags: ${question.tags.join(', ')})\n`;
    }
  }

  return `Eres un asistente experto en entrevistas técnicas de desarrollo de software.
Tu tarea es analizar una descripción de oferta de empleo y seleccionar las preguntas más relevantes de nuestro catálogo de preguntas de entrevista.

A continuación tienes el catálogo completo de preguntas disponibles, organizadas por tecnología:

${catalog}

INSTRUCCIONES:
1. Analiza la oferta de empleo proporcionada por el usuario.
2. Identifica las tecnologías, frameworks, herramientas y habilidades mencionadas o implícitas.
3. Selecciona las preguntas más relevantes de nuestro catálogo que ayudarían a preparar al candidato.
4. Devuelve SOLAMENTE un JSON válido con el siguiente formato, sin texto adicional ni bloques markdown:

{
  "technologies_detected": ["nombres de tecnologías reales del catálogo"],
  "questions": [
    {
      "technology": "slug exacto de la tecnología tal como aparece en el catálogo",
      "title": "título exacto de la pregunta del catálogo",
      "difficulty": "easy|medium|hard",
      "tags": ["tags de la pregunta"],
      "relevance": "breve explicación de por qué esta pregunta es relevante para la oferta"
    }
  ]
}

REGLAS:
- Solo selecciona preguntas que EXISTAN en el catálogo. No inventes preguntas nuevas.
- Usa siempre el slug exacto del catálogo en "technology".
- Usa los títulos EXACTOS del catálogo.
- En "technologies_detected" no pongas temas genéricos como "testing"; solo tecnologías o frameworks reales.
- Ordena las preguntas de mayor a menor relevancia.
- Selecciona entre 10 y 20 preguntas, dependiendo de lo que cubra la oferta.
- Si la oferta menciona una tecnología que no está en el catálogo, no inventes preguntas para ella.`;
}

export async function handleAiQuestionsRequest(
  jobDescription: string,
  questionsDir: string,
  config: AiQuestionsConfig,
): Promise<AiQuestionsResult> {
  const summaries = await loadAllQuestionSummaries(questionsDir);
  const systemPrompt = buildSystemPrompt(summaries);
  const fallback = () => finalizeAiResponse(null, summaries, jobDescription);

  const apiUrl = `${config.azureOpenAiEndpoint.replace(/\/+$/, '')}/openai/deployments/${encodeURIComponent(config.azureOpenAiDeployment)}/chat/completions?api-version=2024-08-01-preview`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.azureOpenAiKey,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Analiza la siguiente oferta de empleo y selecciona las preguntas de entrevista más relevantes de nuestro catálogo:\n\n${jobDescription}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI error:', response.status, errorText);
      return fallback();
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return fallback();
    }

    const cleaned = content
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '');

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = null;
    }

    return finalizeAiResponse(parsed, summaries, jobDescription);
  } catch (error) {
    console.error('AI question selection fallback triggered:', error);
    return fallback();
  }
}
