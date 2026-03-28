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
};

function technologyDisplayName(slug: string): string {
  return TECH_DISPLAY_NAME_OVERRIDES[slug]
    ?? slug
      .split(/[-_]/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
}

export function parseFrontmatter(content: string): { metadata: Frontmatter; body: string } {
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

export async function loadAllQuestionSummaries(questionsDir: string): Promise<QuestionSummary[]> {
  const summaries: QuestionSummary[] = [];
  const candidateTechs = (await readdir(questionsDir, { withFileTypes: true }))
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
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
      filenames.filter((filename) => basename(filename) === filename).map((filename) =>
        readFile(join(questionsDir, tech, filename), 'utf-8').then((raw) => {
          const content = raw.replace(/\r/g, '');
          const { metadata } = parseFrontmatter(content);
          if (!metadata.title) return null;
          return {
            technology: tech,
            title: metadata.title,
            difficulty: metadata.difficulty ?? 'medium',
            tags: metadata.tags ?? [],
          } satisfies QuestionSummary;
        }),
      ),
    );

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        summaries.push(r.value);
      }
    }
  }

  return summaries;
}

export function buildSystemPrompt(summaries: QuestionSummary[]): string {
  const grouped = new Map<string, QuestionSummary[]>();
  for (const s of summaries) {
    const list = grouped.get(s.technology) ?? [];
    list.push(s);
    grouped.set(s.technology, list);
  }

  let catalog = '';
  for (const [tech, questions] of grouped) {
    const displayName = technologyDisplayName(tech);
    catalog += `\n## ${displayName}\n`;
    for (const q of questions) {
      catalog += `- [${q.difficulty}] ${q.title} (tags: ${q.tags.join(', ')})\n`;
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
4. Devuelve SOLAMENTE un JSON válido con el siguiente formato, sin texto adicional, sin markdown code blocks:

{
  "technologies_detected": ["lista de tecnologías detectadas en la oferta"],
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
- Usa los títulos EXACTOS del catálogo.
- Ordena las preguntas de mayor a menor relevancia.
- Selecciona entre 10 y 30 preguntas, dependiendo de lo que cubra la oferta.
- Si la oferta menciona una tecnología que no está en el catálogo, no inventes preguntas para ella. Solo selecciona del catálogo disponible.`;
}

export async function handleAiQuestionsRequest(
  jobDescription: string,
  questionsDir: string,
  config: AiQuestionsConfig,
): Promise<unknown> {
  const summaries = await loadAllQuestionSummaries(questionsDir);
  const systemPrompt = buildSystemPrompt(summaries);

  const apiUrl = `${config.azureOpenAiEndpoint.replace(/\/+$/, '')}/openai/deployments/${encodeURIComponent(config.azureOpenAiDeployment)}/chat/completions?api-version=2024-08-01-preview`;

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
    throw new Error('Error al comunicarse con el servicio de IA.');
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error('No se recibió respuesta del servicio de IA.');
  }

  const cleaned = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Invalid JSON response from AI service');
  }

  return validateAiResponse(parsed, summaries);
}

function validateAiResponse(parsed: unknown, summaries: QuestionSummary[]): {
  technologies_detected: string[];
  questions: Array<{
    technology: string;
    title: string;
    difficulty: string;
    tags: string[];
    relevance: string;
  }>;
} {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid AI response format');
  }

  const obj = parsed as Record<string, unknown>;

  const technologies_detected = Array.isArray(obj['technologies_detected'])
    ? (obj['technologies_detected'] as unknown[]).filter((t): t is string => typeof t === 'string')
    : [];

  if (!Array.isArray(obj['questions'])) {
    throw new Error('AI response missing questions array');
  }

  const knownTitles = new Set(summaries.map((s) => s.title));
  const knownTechnologies = new Set(summaries.map((s) => s.technology));

  const questions = (obj['questions'] as unknown[])
    .filter((q): q is Record<string, unknown> => q !== null && typeof q === 'object')
    .filter((q) => typeof q['title'] === 'string' && knownTitles.has(q['title'] as string))
    .filter((q) => typeof q['technology'] === 'string' && knownTechnologies.has(q['technology'] as string))
    .map((q) => ({
      technology: q['technology'] as string,
      title: q['title'] as string,
      difficulty: ['easy', 'medium', 'hard'].includes(q['difficulty'] as string) ? (q['difficulty'] as string) : 'medium',
      tags: Array.isArray(q['tags']) ? (q['tags'] as unknown[]).filter((t): t is string => typeof t === 'string') : [],
      relevance: typeof q['relevance'] === 'string' ? (q['relevance'] as string) : '',
    }));

  return { technologies_detected, questions };
}
