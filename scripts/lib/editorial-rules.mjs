import path from 'node:path';

export const REVIEW_DATE = '2026-04-04';

export const TECHNOLOGY_LABELS = {
  angular: 'Angular',
  dotnet: '.NET',
  java: 'Java',
  javascript: 'JavaScript',
  nodejs: 'Node.js',
  razor: 'Razor',
  react: 'React',
  typescript: 'TypeScript',
  vue: 'Vue',
  winforms: 'WinForms',
};

export const REQUIRED_HEADINGS = [
  '## Qué evalúa el entrevistador',
  '## Respuesta sólida',
  '## Compromisos y errores comunes',
  '## Ejemplo o caso real',
  '## Frase corta de entrevista',
];

export const CODE_HEADING = '## Ejemplo de código';

export const BANNED_VISIBLE_PATTERNS = [
  /En una entrevista senior de .* esta pregunta te exige convertir/i,
  /Lo aterrizaría primero en una funcionalidad acotada/i,
  /No basta con definir conceptos/i,
  /trade-offs/i,
  /\bfallbacks?\b/i,
  /\bownership\b/i,
];

const TAG_LABELS = {
  abstractions: 'abstracciones',
  accessibility: 'accesibilidad',
  architecture: 'arquitectura',
  async: 'asincronía',
  authentication: 'autenticación',
  authorization: 'autorización',
  behavior: 'comportamiento',
  blazor: 'Blazor',
  boundaries: 'fronteras',
  cache: 'caché',
  caching: 'caché',
  callbacks: 'callbacks',
  cancellation: 'cancelación',
  'change-detection': 'detección de cambios',
  closures: 'closures',
  'code-quality': 'calidad de código',
  'code-review': 'revisión de código',
  'code-splitting': 'división de código',
  collections: 'colecciones',
  communication: 'comunicación',
  compatibility: 'compatibilidad',
  components: 'componentes',
  composables: 'composables',
  composition: 'composición',
  concurrency: 'concurrencia',
  configuration: 'configuración',
  context: 'contexto',
  contracts: 'contratos',
  coupling: 'acoplamiento',
  'data-access': 'acceso a datos',
  'data-binding': 'enlace de datos',
  'data-fetching': 'obtención de datos',
  'decision-making': 'toma de decisiones',
  debugging: 'depuración',
  dependencies: 'dependencias',
  'dependency-injection': 'inyección de dependencias',
  deployment: 'despliegue',
  'derived-state': 'estado derivado',
  design: 'diseño',
  effects: 'efectos',
  enterprise: 'escala enterprise',
  'entity-framework': 'Entity Framework',
  enums: 'enums',
  'error-boundaries': 'límites de error',
  'error-handling': 'gestión de errores',
  events: 'eventos',
  exceptions: 'excepciones',
  external: 'integraciones externas',
  forms: 'formularios',
  frameworks: 'frameworks',
  generics: 'genéricos',
  guards: 'guards',
  hooks: 'hooks',
  html: 'HTML',
  http: 'HTTP',
  hydration: 'hidratación',
  i18n: 'internacionalización',
  immutability: 'inmutabilidad',
  inference: 'inferencia',
  inject: 'Inject',
  'integration-tests': 'pruebas de integración',
  interceptors: 'interceptores',
  interop: 'interoperabilidad',
  invariants: 'invariantes',
  javascript: 'JavaScript',
  jvm: 'JVM',
  'language-features': 'características del lenguaje',
  'lazy-loading': 'carga diferida',
  legacy: 'código heredado',
  lifecycle: 'ciclo de vida',
  logging: 'registro y trazas',
  maintainability: 'mantenibilidad',
  memoization: 'memoización',
  memory: 'memoria',
  'memory-leaks': 'fugas de memoria',
  migration: 'migración',
  modularization: 'modularización',
  modules: 'módulos',
  mvc: 'MVC',
  navigation: 'navegación',
  ngrx: 'NgRx',
  observability: 'observabilidad',
  observables: 'observables',
  onpush: 'OnPush',
  operators: 'operadores',
  'optimistic-ui': 'interfaz optimista',
  orm: 'ORM',
  performance: 'rendimiento',
  pinia: 'Pinia',
  plugins: 'plugins',
  profiling: 'profiling',
  promises: 'promesas',
  props: 'props',
  'provide-inject': 'provide/inject',
  providers: 'providers',
  queries: 'consultas',
  'race-conditions': 'condiciones de carrera',
  'react-query': 'React Query',
  reactivity: 'reactividad',
  'real-world-scenarios': 'escenarios reales',
  reconciliation: 'reconciliación',
  reducers: 'reducers',
  rendering: 'renderizado',
  renders: 'renders',
  resilience: 'resiliencia',
  routing: 'enrutamiento',
  runtime: 'runtime',
  rxjs: 'RxJS',
  scalability: 'escalabilidad',
  security: 'seguridad',
  'server-components': 'componentes de servidor',
  'server-state': 'estado del servidor',
  services: 'servicios',
  'shared-state': 'estado compartido',
  signals: 'signals',
  ssr: 'SSR',
  standalone: 'standalone',
  state: 'estado',
  'state-machines': 'máquinas de estados',
  'state-management': 'gestión de estado',
  suspense: 'Suspense',
  synchronization: 'sincronización',
  testing: 'pruebas',
  tracing: 'trazabilidad',
  transitions: 'transiciones',
  'type-inference': 'inferencia de tipos',
  'type-safety': 'seguridad de tipos',
  'type-system': 'sistema de tipos',
  types: 'tipos',
  ui: 'interfaz',
  'ui-state': 'estado de la interfaz',
  validation: 'validación',
  views: 'vistas',
  virtualization: 'virtualización',
  watchers: 'watchers',
  'worker-threads': 'worker threads',
  xss: 'XSS',
  zoneless: 'sin Zone.js',
  zustand: 'Zustand',
};

const WORD_LABELS = {
  api: 'API',
  app: 'app',
  aspnet: 'ASP.NET',
  auth: 'autenticación',
  cache: 'caché',
  code: 'código',
  component: 'componente',
  components: 'componentes',
  data: 'datos',
  debug: 'depuración',
  design: 'diseño',
  domain: 'dominio',
  effect: 'efecto',
  effects: 'efectos',
  error: 'error',
  errors: 'errores',
  event: 'evento',
  events: 'eventos',
  feature: 'funcionalidad',
  features: 'funcionalidades',
  forms: 'formularios',
  framework: 'framework',
  hooks: 'hooks',
  http: 'HTTP',
  i18n: 'internacionalización',
  query: 'Query',
  routing: 'enrutamiento',
  ssr: 'SSR',
  state: 'estado',
  types: 'tipos',
  ui: 'interfaz',
};

const CATEGORY_TAGS = {
  architecture: new Set([
    'architecture',
    'modularization',
    'design',
    'decision-making',
    'domain',
    'maintainability',
    'scalability',
    'coupling',
    'standalone',
    'clean-architecture',
    'separation-of-concerns',
    'microservices',
    'enterprise',
  ]),
  state: new Set([
    'state',
    'state-management',
    'shared-state',
    'server-state',
    'ui-state',
    'derived-state',
    'context',
    'signals',
    'reactivity',
    'observables',
    'ngrx',
    'pinia',
    'zustand',
    'reducers',
    'state-machines',
    'provide-inject',
  ]),
  effects: new Set([
    'effects',
    'hooks',
    'lifecycle',
    'watchers',
    'async',
    'promises',
    'cancellation',
    'race-conditions',
    'rxjs',
    'worker-threads',
    'events',
    'observables',
  ]),
  rendering: new Set([
    'rendering',
    'renders',
    'reconciliation',
    'hydration',
    'ssr',
    'server-components',
    'suspense',
    'transitions',
    'virtualization',
    'onpush',
    'change-detection',
    'zoneless',
    'components',
    'props',
    'conditional-rendering',
  ]),
  forms: new Set([
    'forms',
    'validation',
    'input-validation',
    'data-binding',
    'controls',
    'model-binding',
  ]),
  quality: new Set([
    'testing',
    'integration-tests',
    'debugging',
    'profiling',
    'logging',
    'observability',
    'code-review',
    'production-issues',
    'tracing',
    'error-handling',
    'error-boundaries',
    'resilience',
  ]),
  integration: new Set([
    'http',
    'httpclient',
    'interceptors',
    'authentication',
    'authorization',
    'security',
    'xss',
    'api-design',
    'data-fetching',
    'queries',
    'services',
    'contracts',
    'external-services',
    'middleware',
    'webhooks',
  ]),
  types: new Set([
    'types',
    'type-safety',
    'type-system',
    'type-inference',
    'generics',
    'mapped-types',
    'conditional-types',
    'discriminated-unions',
    'utility-types',
    'runtime-validation',
    'inference',
  ]),
  performance: new Set([
    'performance',
    'memoization',
    'cache',
    'caching',
    'code-splitting',
    'lazy-loading',
    'profiling',
    'memory',
    'memory-leaks',
    'bundling',
    'assets',
    'preloading',
  ]),
  migration: new Set([
    'migration',
    'legacy',
    'modernization',
    'dotnet-modernization',
  ]),
  language: new Set([
    'language-features',
    'javascript',
    'closures',
    'callbacks',
    'generics',
    'enums',
    'operators',
    'composition',
    'composables',
  ]),
};

const CODE_REQUIRED_TAGS = new Set([
  'async',
  'cancellation',
  'components',
  'composition',
  'composables',
  'context',
  'data-binding',
  'data-fetching',
  'effects',
  'error-boundaries',
  'forms',
  'hooks',
  'http',
  'httpclient',
  'hydration',
  'input-validation',
  'interceptors',
  'lifecycle',
  'memory-leaks',
  'memoization',
  'ngrx',
  'observables',
  'onpush',
  'performance',
  'pinia',
  'profiling',
  'props',
  'provide-inject',
  'reactivity',
  'react-query',
  'reducers',
  'rendering',
  'renders',
  'routing',
  'rxjs',
  'server-components',
  'server-state',
  'shared-state',
  'signals',
  'ssr',
  'state',
  'state-machines',
  'state-management',
  'suspense',
  'testing',
  'transitions',
  'type-inference',
  'type-safety',
  'type-system',
  'types',
  'ui-state',
  'validation',
  'virtualization',
  'watchers',
  'worker-threads',
  'zustand',
]);

const CODE_SKIP_TAGS = new Set([
  'architecture',
  'clean-architecture',
  'code-review',
  'communication',
  'decision-making',
  'maintainability',
  'modularization',
  'real-world-scenarios',
  'scalability',
]);

const CODE_REQUIRED_TITLE_PATTERNS = [
  /\bhook\b/i,
  /\bstate\b/i,
  /\bestado\b/i,
  /\beffect\b/i,
  /\basync\b/i,
  /\bsuscrib/i,
  /\bcancel/i,
  /\brender/i,
  /\bform/i,
  /\bvalid/i,
  /\bhydrat/i,
  /\bssr\b/i,
  /\binterceptor/i,
  /\bprops?\b/i,
  /\brefs?\b/i,
  /\bstream/i,
  /\btesting\b/i,
  /\btest\b/i,
  /\btip/i,
  /\bcomponent/i,
  /\bcomponente/i,
];

const CODE_SKIP_TITLE_PATTERNS = [
  /\bmerge\b/i,
  /\bpr\b/i,
  /\broadmap\b/i,
  /\bprioriza/i,
  /\bpriorizar/i,
  /\borganiza/i,
  /\bestructur/i,
  /\barquitect/i,
  /\bsmells?\b/i,
  /\bincidencia\b/i,
  /\bentrevista\b/i,
  /\bcriterios?\b/i,
];

export function normalizeWhitespace(text) {
  return text.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trim();
}

export function technologyFromFile(file) {
  return path.basename(path.dirname(file));
}

export function technologyLabelFromFile(file) {
  const technology = technologyFromFile(file);
  return TECHNOLOGY_LABELS[technology] ?? technology;
}

export function parseFrontmatter(source) {
  const normalized = source.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    return { metadata: {}, body: normalized.trim() };
  }

  const end = normalized.indexOf('\n---\n', 4);
  if (end === -1) {
    return { metadata: {}, body: normalized.trim() };
  }

  const raw = normalized.slice(4, end);
  const body = normalized.slice(end + 5).trim();
  const metadata = {};

  for (const line of raw.split('\n')) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();

    if (key === 'tags') {
      metadata.tags = value
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
      continue;
    }

    metadata[key] = value.replace(/^"|"$/g, '');
  }

  return { metadata, body };
}

function serializeScalar(value) {
  return String(value).replace(/"/g, '\\"');
}

export function serializeQuestion({ title, difficulty, tags, summary, lastReviewed, author, authorUrl }) {
  const lines = [
    '---',
    `title: ${serializeScalar(title)}`,
    `difficulty: ${serializeScalar(difficulty)}`,
    `tags: [${tags.join(', ')}]`,
    `summary: "${serializeScalar(summary)}"`,
    `lastReviewed: ${serializeScalar(lastReviewed)}`,
  ];

  if (author) lines.push(`author: ${serializeScalar(author)}`);
  if (authorUrl) lines.push(`authorUrl: ${serializeScalar(authorUrl)}`);

  return `${lines.join('\n')}\n---`;
}

export function humanizeTag(tag) {
  if (!tag) return 'tema general';
  if (TAG_LABELS[tag]) return TAG_LABELS[tag];

  return tag
    .split('-')
    .filter(Boolean)
    .map((chunk) => WORD_LABELS[chunk] ?? chunk)
    .join(' ')
    .trim()
    .toLowerCase();
}

export function resolveCategory(title, tags) {
  for (const [category, tagSet] of Object.entries(CATEGORY_TAGS)) {
    if (tags.some((tag) => tagSet.has(tag))) {
      return category;
    }
  }

  if (/\bform/i.test(title) || /\bvalid/i.test(title)) return 'forms';
  if (/\brender/i.test(title) || /\bhydrat/i.test(title)) return 'rendering';
  if (/\bhook\b/i.test(title) || /\beffect\b/i.test(title)) return 'effects';
  if (/\btype/i.test(title) || /\btip/i.test(title)) return 'types';
  if (/\bdebug/i.test(title) || /\btest/i.test(title)) return 'quality';
  if (/\bapi\b/i.test(title) || /\bhttp\b/i.test(title)) return 'integration';
  if (/\barquitect/i.test(title) || /\bestructur/i.test(title)) return 'architecture';
  return 'language';
}

export function requiresCode({ title, tags }) {
  if (tags.some((tag) => CODE_REQUIRED_TAGS.has(tag))) return true;
  if (tags.some((tag) => CODE_SKIP_TAGS.has(tag))) return false;
  if (CODE_REQUIRED_TITLE_PATTERNS.some((pattern) => pattern.test(title))) return true;
  if (CODE_SKIP_TITLE_PATTERNS.some((pattern) => pattern.test(title))) return false;
  return false;
}

export function hasValidCodeBlock(body) {
  const matches = [...body.matchAll(/```([a-zA-Z0-9+#.-]+)\n([\s\S]*?)```/g)];
  return matches.some(([, language, code]) => {
    const lines = code
      .split('\n')
      .map((line) => line.trimEnd())
      .filter((line) => line.trim().length > 0);
    return language.trim().length > 0 && lines.length >= 4;
  });
}

export function stableHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function pickVariant(options, seed) {
  return options[stableHash(seed) % options.length];
}

export function findBrokenCharacters(source) {
  const sanitized = source.replace(/https?:\/\/\S+/g, '');
  const failures = [];

  if (/[Â][¿¡A-Za-z]/.test(sanitized) || /Ã[\u0080-\u00ff]/.test(sanitized)) {
    failures.push('mojibake');
  }

  const malformedQuestions =
    sanitized.match(
      /[A-Za-zÁÉÍÓÚáéíóúñÑ]\?[A-Za-zÁÉÍÓÚáéíóúñÑ?]+|\?[A-Za-zÁÉÍÓÚáéíóúñÑ][A-Za-zÁÉÍÓÚáéíóúñÑ?]*/g,
    ) ?? [];

  failures.push(...malformedQuestions);
  return failures;
}

export function collectParagraphs(body) {
  const sanitized = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\r\n/g, '\n')
    .trim();

  return sanitized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .filter(
      (paragraph) =>
        !paragraph.startsWith('## ') &&
        !paragraph.startsWith('- ') &&
        !paragraph.startsWith('> ') &&
        paragraph.length > 80,
    )
    .map((paragraph) => paragraph.replace(/\s+/g, ' '));
}

export function truncateSummary(text, max = 160) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3).trimEnd()}...`;
}
