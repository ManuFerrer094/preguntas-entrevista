export interface SubmitQuestionInput {
  authorName?: string;
  authorUrl?: string;
  technology?: string;
  title?: string;
  difficulty?: string;
  tags?: string;
  content?: string;
  honeypot?: string;
}

export interface SubmitQuestionResult {
  prUrl: string;
}

const VALID_TECHNOLOGIES = [
  'javascript','typescript','python','java','csharp','go','php','rust','ruby',
  'kotlin','swift','angular','react','vue','nextjs','svelte','css','html',
  'nodejs','nestjs','dotnet','django','laravel','spring','sql','mongodb',
  'redis','graphql','docker','kubernetes','git','flutter','reactnative',
];

const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];
const LINKEDIN_REGEX = /^https:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/;
const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 15000;
const MAX_TAGS_LENGTH = 300;
const MAX_AUTHOR_NAME_LENGTH = 100;

// Simple in-memory rate limiter (per process)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

function sanitizeFrontmatter(value: string): string {
  return value.replace(/---/g, '- - -').replace(/[\r\n]/g, ' ').trim();
}

function sanitizeContent(value: string): string {
  return value.replace(/^---\s*$/gm, '- - -').trim();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

async function githubApi(path: string, token: string, options: { method?: string; body?: unknown } = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

export class SubmitQuestionError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
  }
}

export async function handleSubmitQuestion(input: SubmitQuestionInput, clientIp: string): Promise<SubmitQuestionResult> {
  // Rate limiting
  if (isRateLimited(clientIp)) {
    throw new SubmitQuestionError(429, 'Demasiadas solicitudes. Inténtalo de nuevo en una hora.');
  }

  const { authorName, authorUrl, technology, title, difficulty, tags, content, honeypot } = input;

  // Honeypot
  if (honeypot) {
    return { prUrl: '#' };
  }

  // Validation
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new SubmitQuestionError(400, 'El título es obligatorio.');
  }
  if (title.length > MAX_TITLE_LENGTH) {
    throw new SubmitQuestionError(400, `El título no puede superar los ${MAX_TITLE_LENGTH} caracteres.`);
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new SubmitQuestionError(400, 'El contenido es obligatorio.');
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    throw new SubmitQuestionError(400, `El contenido no puede superar los ${MAX_CONTENT_LENGTH} caracteres.`);
  }

  if (!technology || !VALID_TECHNOLOGIES.includes(technology)) {
    throw new SubmitQuestionError(400, 'Tecnología no válida.');
  }

  if (!difficulty || !VALID_DIFFICULTIES.includes(difficulty)) {
    throw new SubmitQuestionError(400, 'Dificultad no válida. Debe ser easy, medium o hard.');
  }

  if (tags && typeof tags === 'string' && tags.length > MAX_TAGS_LENGTH) {
    throw new SubmitQuestionError(400, `Los tags no pueden superar los ${MAX_TAGS_LENGTH} caracteres.`);
  }

  if (authorName && typeof authorName === 'string' && authorName.length > MAX_AUTHOR_NAME_LENGTH) {
    throw new SubmitQuestionError(400, `El nombre no puede superar los ${MAX_AUTHOR_NAME_LENGTH} caracteres.`);
  }

  if (authorUrl && typeof authorUrl === 'string' && authorUrl.trim().length > 0) {
    if (!LINKEDIN_REGEX.test(authorUrl.trim())) {
      throw new SubmitQuestionError(400, 'La URL debe ser un perfil de LinkedIn válido (https://linkedin.com/in/...).');
    }
  }

  const githubToken = process.env['GITHUB_TOKEN'] || '';
  if (!githubToken) {
    throw new SubmitQuestionError(503, 'El servicio de contribuciones no está configurado.');
  }

  const REPO_OWNER = process.env['REPO_OWNER'] || 'manuelfcreis';
  const REPO_NAME = process.env['REPO_NAME'] || 'preguntas-entrevista';
  const BASE_BRANCH = process.env['BASE_BRANCH'] || 'main';

  const safeTitle = sanitizeFrontmatter(title.trim());
  const safeDifficulty = difficulty.trim();
  const safeTags = tags
    ? tags.split(',').map((t: string) => sanitizeFrontmatter(t.trim())).filter(Boolean)
    : [technology];
  const safeContent = sanitizeContent(content.trim());
  const safeAuthorName = authorName ? sanitizeFrontmatter(authorName.trim()) : '';
  const safeAuthorUrl = authorUrl?.trim() ?? '';

  // Build frontmatter
  let frontmatter = `---\ntitle: "${safeTitle}"\ndifficulty: ${safeDifficulty}\ntags: [${safeTags.join(', ')}]`;
  if (safeAuthorName) {
    frontmatter += `\nauthor: "${safeAuthorName}"`;
  }
  if (safeAuthorUrl && LINKEDIN_REGEX.test(safeAuthorUrl)) {
    frontmatter += `\nauthorUrl: "${safeAuthorUrl}"`;
  }
  frontmatter += '\n---\n\n';

  const fileContent = frontmatter + safeContent + '\n';
  const slug = slugify(safeTitle);
  const timestamp = Date.now();
  const branchName = `community/question-${slug}-${timestamp}`;

  // 1. Get main branch SHA
  const mainRef = await githubApi(
    `/repos/${REPO_OWNER}/${REPO_NAME}/git/ref/heads/${BASE_BRANCH}`,
    githubToken,
  );
  const baseSha = mainRef.object.sha;

  // 2. Get the current tree of the base commit
  const baseCommit = await githubApi(
    `/repos/${REPO_OWNER}/${REPO_NAME}/git/commits/${baseSha}`,
    githubToken,
  );
  const baseTreeSha = baseCommit.tree.sha;

  // 3. Get current index.json to determine next question number
  let currentIndex: string[] = [];
  try {
    const indexFile = await githubApi(
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/questions/${technology}/index.json?ref=${BASE_BRANCH}`,
      githubToken,
    );
    const decoded = Buffer.from(indexFile.content, 'base64').toString('utf-8');
    currentIndex = JSON.parse(decoded);
  } catch {
    currentIndex = [];
  }

  const nextNum = currentIndex.length + 1;
  const newFileName = `q${nextNum}.md`;
  const newIndex = [...currentIndex, newFileName];

  // 4. Create a new tree with both files
  const newTree = await githubApi(
    `/repos/${REPO_OWNER}/${REPO_NAME}/git/trees`,
    githubToken,
    {
      method: 'POST',
      body: {
        base_tree: baseTreeSha,
        tree: [
          {
            path: `questions/${technology}/${newFileName}`,
            mode: '100644',
            type: 'blob',
            content: fileContent,
          },
          {
            path: `questions/${technology}/index.json`,
            mode: '100644',
            type: 'blob',
            content: JSON.stringify(newIndex, null, 2) + '\n',
          },
        ],
      },
    },
  );

  // 5. Create commit
  const newCommit = await githubApi(
    `/repos/${REPO_OWNER}/${REPO_NAME}/git/commits`,
    githubToken,
    {
      method: 'POST',
      body: {
        message: `feat(community): add question "${safeTitle}" for ${technology}`,
        tree: newTree.sha,
        parents: [baseSha],
      },
    },
  );

  // 6. Create branch
  await githubApi(
    `/repos/${REPO_OWNER}/${REPO_NAME}/git/refs`,
    githubToken,
    {
      method: 'POST',
      body: {
        ref: `refs/heads/${branchName}`,
        sha: newCommit.sha,
      },
    },
  );

  // 7. Create PR
  const authorInfo = safeAuthorName
    ? `\n\n**Autor:** ${safeAuthorUrl ? `[${safeAuthorName}](${safeAuthorUrl})` : safeAuthorName}`
    : '';

  const pr = await githubApi(
    `/repos/${REPO_OWNER}/${REPO_NAME}/pulls`,
    githubToken,
    {
      method: 'POST',
      body: {
        title: `[Community] ${safeTitle} (${technology})`,
        body:
          `## Nueva pregunta de la comunidad\n\n` +
          `- **Tecnología:** ${technology}\n` +
          `- **Dificultad:** ${safeDifficulty}\n` +
          `- **Tags:** ${safeTags.join(', ')}\n` +
          `- **Archivo:** \`questions/${technology}/${newFileName}\`` +
          authorInfo +
          `\n\n---\n\n### Preview del contenido\n\n${safeContent}`,
        head: branchName,
        base: BASE_BRANCH,
      },
    },
  );

  return { prUrl: pr.html_url };
}
