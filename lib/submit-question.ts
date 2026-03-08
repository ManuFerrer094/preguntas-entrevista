export interface SubmitQuestionInput {
  technology?: string;
  title?: string;
  difficulty?: string;
  tags?: string;
  content?: string;
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
const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 15000;
const MAX_TAGS_LENGTH = 300;

// Simple in-memory rate limiter (per process, per GitHub user)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
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

export async function handleSubmitQuestion(input: SubmitQuestionInput, contributorToken: string): Promise<SubmitQuestionResult> {
  if (!contributorToken) {
    throw new SubmitQuestionError(401, 'Se requiere autenticación con GitHub.');
  }

  // Get contributor's GitHub identity
  const contributor = await githubApi('/user', contributorToken);
  const contributorLogin: string = contributor.login;
  const contributorName: string = contributor.name || contributor.login;

  // Rate limiting by GitHub username
  if (isRateLimited(contributorLogin)) {
    throw new SubmitQuestionError(429, 'Demasiadas solicitudes. Inténtalo de nuevo en una hora.');
  }

  const { technology, title, difficulty, tags, content } = input;

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

  const REPO_OWNER = process.env['REPO_OWNER'] || 'manuelfcreis';
  const REPO_NAME = process.env['REPO_NAME'] || 'preguntas-entrevista';
  const BASE_BRANCH = process.env['BASE_BRANCH'] || 'main';

  const safeTitle = sanitizeFrontmatter(title.trim());
  const safeDifficulty = difficulty.trim();
  const safeTags = tags
    ? tags.split(',').map((t: string) => sanitizeFrontmatter(t.trim())).filter(Boolean)
    : [technology];
  const safeContent = sanitizeContent(content.trim());

  // Build frontmatter with GitHub contributor info
  const frontmatter =
    `---\ntitle: "${safeTitle}"\ndifficulty: ${safeDifficulty}\ntags: [${safeTags.join(', ')}]` +
    `\nauthor: "${sanitizeFrontmatter(contributorName)}"` +
    `\nauthorUrl: "https://github.com/${contributorLogin}"` +
    `\n---\n\n`;

  const fileContent = frontmatter + safeContent + '\n';
  const slug = slugify(safeTitle);
  const timestamp = Date.now();
  const branchName = `community/question-${slug}-${timestamp}`;

  // 1. Fork the repo (idempotent — returns existing fork if present)
  const fork = await githubApi(
    `/repos/${REPO_OWNER}/${REPO_NAME}/forks`,
    contributorToken,
    { method: 'POST', body: { default_branch_only: true } },
  );
  const forkOwner: string = fork.owner.login;
  const forkName: string = fork.name;

  // 2. Sync fork with upstream (best effort)
  try {
    await githubApi(
      `/repos/${forkOwner}/${forkName}/merge-upstream`,
      contributorToken,
      { method: 'POST', body: { branch: BASE_BRANCH } },
    );
  } catch {
    // May fail for brand-new forks, safe to ignore
  }

  // 3. Get base branch SHA from the fork (retry once for new forks)
  let baseSha: string;
  try {
    const ref = await githubApi(
      `/repos/${forkOwner}/${forkName}/git/ref/heads/${BASE_BRANCH}`,
      contributorToken,
    );
    baseSha = ref.object.sha;
  } catch {
    await new Promise((r) => setTimeout(r, 3000));
    const ref = await githubApi(
      `/repos/${forkOwner}/${forkName}/git/ref/heads/${BASE_BRANCH}`,
      contributorToken,
    );
    baseSha = ref.object.sha;
  }

  // 4. Get the base tree
  const baseCommit = await githubApi(
    `/repos/${forkOwner}/${forkName}/git/commits/${baseSha}`,
    contributorToken,
  );
  const baseTreeSha = baseCommit.tree.sha;

  // 5. Get current index.json from ORIGINAL repo to determine next question number
  let currentIndex: string[] = [];
  try {
    const indexFile = await githubApi(
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/questions/${technology}/index.json?ref=${BASE_BRANCH}`,
      contributorToken,
    );
    const decoded = Buffer.from(indexFile.content, 'base64').toString('utf-8');
    currentIndex = JSON.parse(decoded);
  } catch {
    currentIndex = [];
  }

  const nextNum = currentIndex.length + 1;
  const newFileName = `q${nextNum}.md`;
  const newIndex = [...currentIndex, newFileName];

  // 6. Create new tree in the fork
  const newTree = await githubApi(
    `/repos/${forkOwner}/${forkName}/git/trees`,
    contributorToken,
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

  // 7. Create commit in the fork
  const newCommit = await githubApi(
    `/repos/${forkOwner}/${forkName}/git/commits`,
    contributorToken,
    {
      method: 'POST',
      body: {
        message: `feat(community): add question "${safeTitle}" for ${technology}`,
        tree: newTree.sha,
        parents: [baseSha],
      },
    },
  );

  // 8. Create branch in the fork
  await githubApi(
    `/repos/${forkOwner}/${forkName}/git/refs`,
    contributorToken,
    {
      method: 'POST',
      body: {
        ref: `refs/heads/${branchName}`,
        sha: newCommit.sha,
      },
    },
  );

  // 9. Create PR from fork to original repo
  const pr = await githubApi(
    `/repos/${REPO_OWNER}/${REPO_NAME}/pulls`,
    contributorToken,
    {
      method: 'POST',
      body: {
        title: `[Community] ${safeTitle} (${technology})`,
        body:
          `## Nueva pregunta de la comunidad\n\n` +
          `- **Contribuidor:** [@${contributorLogin}](https://github.com/${contributorLogin})\n` +
          `- **Tecnología:** ${technology}\n` +
          `- **Dificultad:** ${safeDifficulty}\n` +
          `- **Tags:** ${safeTags.join(', ')}\n` +
          `- **Archivo:** \`questions/${technology}/${newFileName}\`` +
          `\n\n---\n\n### Preview del contenido\n\n${safeContent}`,
        head: `${forkOwner}:${branchName}`,
        base: BASE_BRANCH,
      },
    },
  );

  return { prUrl: pr.html_url };
}
