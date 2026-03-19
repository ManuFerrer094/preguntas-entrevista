import type { AiQuestionsConfig } from './interfaces/ai-questions.interfaces.js';
import type { QuizQuestion, QuizResponse, QuizDifficulty } from './interfaces/quiz.interfaces.js';

export type { QuizQuestion, QuizResponse, QuizDifficulty };

const DIFFICULTY_INSTRUCTIONS: Record<QuizDifficulty, string> = {
  mixed: 'Mezcla preguntas de distintos niveles de dificultad (fácil, media y difícil).',
  easy: 'Todas las preguntas deben ser de nivel fácil: conceptos básicos, definiciones y uso fundamental de las tecnologías.',
  medium: 'Todas las preguntas deben ser de nivel medio: aplicación práctica, patrones comunes y casos de uso reales.',
  hard: 'Todas las preguntas deben ser de nivel difícil: casos avanzados, optimización, edge cases y conocimiento profundo.',
};

function buildQuizSystemPrompt(questionCount: number, difficulty: QuizDifficulty): string {
  return `Eres un asistente experto en entrevistas técnicas de desarrollo de software.
Tu tarea es crear un cuestionario tipo test a partir de una descripción de oferta de empleo.

Debes generar exactamente ${questionCount} preguntas de opción múltiple relacionadas con las tecnologías, frameworks y habilidades mencionadas en la oferta.

Cada pregunta debe tener exactamente 4 opciones de respuesta, donde solo una es correcta.
Las opciones incorrectas deben ser plausibles pero claramente distinguibles para alguien con conocimiento.

Devuelve SOLAMENTE un JSON válido con el siguiente formato, sin texto adicional, sin markdown code blocks:

{
  "questions": [
    {
      "question": "Enunciado de la pregunta",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctIndex": 0,
      "explanation": "Breve explicación de por qué la respuesta correcta es correcta"
    }
  ]
}

REGLAS:
- Genera exactamente ${questionCount} preguntas.
- El campo "correctIndex" debe ser 0, 1, 2 o 3 (índice base 0 del array "options").
- Las preguntas deben cubrir distintos aspectos de las tecnologías de la oferta.
- Varía la posición de la respuesta correcta (no siempre la misma posición).
- Las preguntas deben ser técnicas y relevantes para una entrevista real.
- Escribe las preguntas y opciones en español.
- DIFICULTAD: ${DIFFICULTY_INSTRUCTIONS[difficulty]}`;
}

export async function handleQuizRequest(
  jobDescription: string,
  questionCount: number,
  config: AiQuestionsConfig,
  difficulty: QuizDifficulty = 'mixed',
): Promise<QuizResponse> {
  const systemPrompt = buildQuizSystemPrompt(questionCount, difficulty);

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
          content: `Crea un cuestionario de ${questionCount} preguntas tipo test basado en la siguiente oferta de empleo:\n\n${jobDescription}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 6000,
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
  } catch (err) {
    throw new Error(`Failed to parse JSON response from AI service: ${err instanceof Error ? err.message : String(err)}`);
  }

  return validateQuizResponse(parsed, questionCount);
}

function validateQuizResponse(parsed: unknown, questionCount: number): QuizResponse {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid quiz response format');
  }

  const obj = parsed as Record<string, unknown>;

  if (!Array.isArray(obj['questions'])) {
    throw new Error('Quiz response missing questions array');
  }

  const questions = (obj['questions'] as unknown[])
    .filter((q): q is Record<string, unknown> => q !== null && typeof q === 'object')
    .filter(
      (q) =>
        typeof q['question'] === 'string' &&
        Array.isArray(q['options']) &&
        (q['options'] as unknown[]).length === 4 &&
        (q['options'] as unknown[]).every((o) => typeof o === 'string') &&
        typeof q['correctIndex'] === 'number' &&
        [0, 1, 2, 3].includes(q['correctIndex'] as number),
    )
    .slice(0, questionCount)
    .map((q) => ({
      question: q['question'] as string,
      options: q['options'] as [string, string, string, string],
      correctIndex: q['correctIndex'] as 0 | 1 | 2 | 3,
      explanation: typeof q['explanation'] === 'string' ? (q['explanation'] as string) : '',
    }));

  if (questions.length === 0) {
    throw new Error('No valid questions received from AI service');
  }

  return { questions };
}
