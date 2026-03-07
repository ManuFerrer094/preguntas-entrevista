import { Router, Request, Response } from 'express';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const VALID_TECHNOLOGIES = ['angular', 'react', 'vue', 'nodejs', 'typescript', 'javascript'];

const TECH_DISPLAY_NAMES: Record<string, string> = {
  angular: 'Angular',
  react: 'React',
  vue: 'Vue.js',
  nodejs: 'Node.js',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
};

interface QuestionSummary {
  technology: string;
  title: string;
  difficulty: string;
  tags: string[];
}

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

async function loadAllQuestionSummaries(questionsDir: string): Promise<QuestionSummary[]> {
  const summaries: QuestionSummary[] = [];

  for (const tech of VALID_TECHNOLOGIES) {
    const indexPath = join(questionsDir, tech, 'index.json');
    let filenames: string[];
    try {
      const indexContent = await readFile(indexPath, 'utf-8');
      filenames = JSON.parse(indexContent);
    } catch {
      continue;
    }

    const results = await Promise.allSettled(
      filenames.map((filename) =>
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

function buildSystemPrompt(summaries: QuestionSummary[]): string {
  const grouped = new Map<string, QuestionSummary[]>();
  for (const s of summaries) {
    const list = grouped.get(s.technology) ?? [];
    list.push(s);
    grouped.set(s.technology, list);
  }

  let catalog = '';
  for (const [tech, questions] of grouped) {
    const displayName = TECH_DISPLAY_NAMES[tech] ?? tech;
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
      "technology": "slug de la tecnología (angular, react, vue, nodejs, typescript, javascript)",
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

export function createAiQuestionsRouter(questionsDir: string): Router {
  const router = Router();

  const config = {
    azureOpenAiEndpoint: process.env['AZURE_OPENAI_ENDPOINT'] || '',
    azureOpenAiKey: process.env['AZURE_OPENAI_KEY'] || '',
    azureOpenAiDeployment: process.env['AZURE_OPENAI_DEPLOYMENT'] || 'gpt-4o-mini',
  };

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    const { jobDescription } = req.body as { jobDescription?: string };

    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length === 0) {
      res.status(400).json({ error: 'Se requiere una descripción de la oferta de empleo.' });
      return;
    }

    if (jobDescription.length > 10000) {
      res.status(400).json({ error: 'La descripción es demasiado larga. Máximo 10.000 caracteres.' });
      return;
    }

    if (!config.azureOpenAiEndpoint || !config.azureOpenAiKey) {
      res.status(503).json({ error: 'El servicio de IA no está configurado. Configura AZURE_OPENAI_ENDPOINT y AZURE_OPENAI_KEY.' });
      return;
    }

    try {
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
            { role: 'user', content: `Analiza la siguiente oferta de empleo y selecciona las preguntas de entrevista más relevantes de nuestro catálogo:\n\n${jobDescription}` },
          ],
          temperature: 0.3,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Azure OpenAI error:', response.status, errorText);
        res.status(502).json({ error: 'Error al comunicarse con el servicio de IA.' });
        return;
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) {
        res.status(502).json({ error: 'No se recibió respuesta del servicio de IA.' });
        return;
      }

      // Parse the JSON response — strip code fences if the model wraps them
      const cleaned = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
      const parsed = JSON.parse(cleaned);

      res.json(parsed);
    } catch (err) {
      console.error('AI questions error:', err);
      res.status(500).json({ error: 'Error interno al generar las preguntas.' });
    }
  });

  return router;
}
