import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'glob';

const TECHNOLOGY_LABELS = {
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

const BROKEN_REPLACEMENTS = [
  ['?C?mo', '¿Cómo'],
  ['?Qu?', '¿Qué'],
  ['?Cu?ndo', '¿Cuándo'],
  ['?En', '¿En'],
  ['Qu?', 'Qué'],
  ['?rbol', 'árbol'],
  ['?nico', 'único'],
  ['abstracci?n', 'abstracción'],
  ['actualizaci?n', 'actualización'],
  ['aislar?as', 'aislarías'],
  ['aplicar?a', 'aplicaría'],
  ['aplicaci?n', 'aplicación'],
  ['as?ncrono', 'asíncrono'],
  ['as?ncronas', 'asíncronas'],
  ['autenticaci?n', 'autenticación'],
  ['b?sicas', 'básicas'],
  ['c?digo', 'código'],
  ['ca?tica', 'caótica'],
  ['colecci?n', 'colección'],
  ['configuraci?n', 'configuración'],
  ['coordinaci?n', 'coordinación'],
  ['correlaci?n', 'correlación'],
  ['cre?ble', 'creíble'],
  ['cu?ndo', 'cuándo'],
  ['c?mo', 'cómo'],
  ['decidir?as', 'decidirías'],
  ['decisi?n', 'decisión'],
  ['deber?an', 'deberían'],
  ['degradaci?n', 'degradación'],
  ['dejar?as', 'dejarías'],
  ['depurar?as', 'depurarías'],
  ['diagnosticar?as', 'diagnosticarías'],
  ['di?logos', 'diálogos'],
  ['dif?cil', 'difícil'],
  ['dif?ciles', 'difíciles'],
  ['din?mica', 'dinámica'],
  ['din?micos', 'dinámicos'],
  ['dise?ar', 'diseñar'],
  ['dise?ar?as', 'diseñarías'],
  ['diseñar?as', 'diseñarías'],
  ['dise?o', 'diseño'],
  ['duplicaci?n', 'duplicación'],
  ['edici?n', 'edición'],
  ['espec?fico', 'específico'],
  ['est?ticas', 'estáticas'],
  ['eval?a', 'evalúa'],
  ['evitar?as', 'evitarías'],
  ['excepci?n', 'excepción'],
  ['expl?citas', 'explícitas'],
  ['fr?gil', 'frágil'],
  ['fr?giles', 'frágiles'],
  ['gen?ricos', 'genéricos'],
  ['gestionar?as', 'gestionarías'],
  ['har?as', 'harías'],
  ['informaci?n', 'información'],
  ['inicializaci?n', 'inicialización'],
  ['in?tiles', 'inútiles'],
  ['integraci?n', 'integración'],
  ['integrar?as', 'integrarías'],
  ['interacci?n', 'interacción'],
  ['internacionalizaci?n', 'internacionalización'],
  ['l?gica', 'lógica'],
  ['librer?a', 'librería'],
  ['librer?as', 'librerías'],
  ['m?quinas', 'máquinas'],
  ['m?quinas', 'máquinas'],
  ['m?dulos', 'módulos'],
  ['m?s', 'más'],
  ['manejar?as', 'manejarías'],
  ['medir?as', 'medirías'],
  ['mejorar?as', 'mejorarías'],
  ['mensajer?a', 'mensajería'],
  ['metaprogramaci?n', 'metaprogramación'],
  ['m?tricas', 'métricas'],
  ['migraci?n', 'migración'],
  ['migrar?as', 'migrarías'],
  ['modelar?as', 'modelarías'],
  ['m?dulos', 'módulos'],
  ['modernizar?as', 'modernizarías'],
  ['mutaci?n', 'mutación'],
  ['navegaci?n', 'navegación'],
  ['partir?as', 'partirías'],
  ['patr?n', 'patrón'],
  ['plantear?as', 'plantearías'],
  ['preparar?as', 'prepararías'],
  ['presi?n', 'presión'],
  ['Priorizar?a', 'Priorizaría'],
  ['producci?n', 'producción'],
  ['protecci?n', 'protección'],
  ['qu??', 'qué?'],
  ['quedar?as', 'quedarías'],
  ['r?pido', 'rápido'],
  ['reacci?n', 'reacción'],
  ['realizaci?n', 'realización'],
  ['recuperaci?n', 'recuperación'],
  ['reflexi?n', 'reflexión'],
  ['revisi?n', 'revisión'],
  ['revisar?as', 'revisarías'],
  ['revertir?as', 'revertirías'],
  ['seg?n', 'según'],
  ['separar?as', 'separarías'],
  ['seguir?as', 'seguirías'],
  ['ser?a', 'sería'],
  ['s?lida', 'sólida'],
  ['soluci?n', 'solución'],
  ['sobreingenier?a', 'sobreingeniería'],
  ['t?cnico', 'técnico'],
  ['Tambi?n', 'También'],
  ['tipar?as', 'tiparías'],
  ['usar?as', 'usarías'],
  ['validaci?n', 'validación'],
  ['validar?as', 'validarías'],
  ['vac?as', 'vacías'],
  ['descartar?as', 'descartarías'],
  ['dividir?as', 'dividirías'],
  ['introducir?as', 'introducirías'],
  ['organizar?as', 'organizarías'],
  ['problem?ticos', 'problemáticos'],
  ['qu?', 'qué'],
  ['¿? ', '¿'],
];

const VISIBLE_REPLACEMENTS = [
  ['Trade-offs o errores comunes', 'Compromisos y errores comunes'],
  ['trade-offs', 'compromisos'],
  ['Trade-offs', 'Compromisos'],
  ['feature acotada', 'funcionalidad acotada'],
  ['feature', 'funcionalidad'],
  ['fallbacks', 'alternativas de respaldo'],
  ['fallback', 'alternativa de respaldo'],
  ['ownership claro', 'una responsabilidad clara'],
  ['ownership', 'responsabilidad'],
  ['maintainability', 'mantenibilidad'],
  ['performance', 'rendimiento'],
  ['architecture', 'arquitectura'],
  ['boundaries de error', 'límites de error'],
  ['boundary de error', 'límite de error'],
  ['background services', 'servicios en segundo plano'],
  ['background service', 'servicio en segundo plano'],
  ['deep links', 'enlaces profundos'],
  ['helpers', 'utilidades'],
  ['helper', 'utilidad'],
  ['jobs', 'tareas'],
  ['legacy', 'heredado'],
  ['providers', 'providers'],
  ['side effects', 'efectos secundarios'],
  ['tests', 'pruebas'],
  ['bugs', 'fallos'],
  ['rendering', 'renderizado'],
  ['debugging', 'depuración'],
  ['language-features', 'características del lenguaje'],
  ['real-world-scenarios', 'escenarios reales'],
  ['state-management', 'gestión de estado'],
  ['lazy loading', 'carga diferida'],
];

function fixBrokenText(text) {
  return BROKEN_REPLACEMENTS.reduce(
    (current, [broken, fixed]) => current.replaceAll(broken, fixed),
    text,
  );
}

function normalizeVisibleText(text) {
  return VISIBLE_REPLACEMENTS.reduce(
    (current, [source, target]) => current.replaceAll(source, target),
    text,
  )
    .replaceAll('## Qu? eval?a el entrevistador', '## Qué evalúa el entrevistador')
    .replaceAll('## Respuesta s?lida', '## Respuesta sólida')
    .replaceAll('## Compromisos y errores comunes', '## Compromisos y errores comunes')
    .replaceAll('## Ejemplo o caso real', '## Ejemplo o caso real')
    .replaceAll('## Frase corta de entrevista', '## Frase corta de entrevista');
}

function standardIntro(technology, title) {
  return `En una entrevista senior de ${technology}, esta pregunta te exige convertir "${title}" en una respuesta con criterio técnico. No basta con definir conceptos: tienes que explicar qué decisión tomarías, qué riesgos ves y cómo validarías el enfoque en un contexto real.`;
}

function standardExample(technology) {
  return `Lo aterrizaría primero en una funcionalidad acotada, con una responsabilidad bien delimitada y métricas sencillas, para comprobar si el enfoque mejora la mantenibilidad, el rendimiento o la fiabilidad antes de extenderlo al resto del sistema en ${technology}.`;
}

function replaceSectionContent(body, heading, replacement) {
  const pattern = new RegExp(`(## ${heading}\\n)([\\s\\S]*?)(?=\\n## |$)`);
  if (!pattern.test(body)) return body;
  return body.replace(pattern, `$1${replacement}\n`);
}

function normalizeQuestionFile(path) {
  const source = fixBrokenText(readFileSync(path, 'utf8')).replace(/\r\n/g, '\n');
  if (!source.startsWith('---')) return;

  const match = source.match(/^---\n([\s\S]*?)\n---\n+([\s\S]*)$/);
  if (!match) return;

  const frontmatterLines = match[1].split('\n');
  const folder = path.split(/[/\\]/)[1];
  const technology = TECHNOLOGY_LABELS[folder] ?? folder;

  let title = '';
  const updatedFrontmatter = frontmatterLines.map((line) => {
    if (!line.startsWith('title:')) return line;
    title = line.slice('title:'.length).trim();
    title = normalizeVisibleText(fixBrokenText(title));
    return `title: ${title}`;
  });

  let body = normalizeVisibleText(match[2].trim());

  const firstHeadingIndex = body.indexOf('\n## ');
  if (firstHeadingIndex > -1) {
    body = `${standardIntro(technology, title)}\n\n${body.slice(firstHeadingIndex + 1)}`;
  } else {
    body = `${standardIntro(technology, title)}\n\n${body}`;
  }

  body = replaceSectionContent(body, 'Ejemplo o caso real', standardExample(technology));
  body = body
    .replace(/\n{3,}/g, '\n\n')
    .replaceAll('## Compromisos y errores comunes', '## Compromisos y errores comunes')
    .trim();

  const output = `---\n${updatedFrontmatter.join('\n')}\n---\n\n${body}\n`;
  writeFileSync(path, output, 'utf8');
}

const files = globSync('questions/**/*.md', { nodir: true });

for (const file of files) {
  normalizeQuestionFile(file);
}

console.log(`Normalizadas ${files.length} preguntas.`);
