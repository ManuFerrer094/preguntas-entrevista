import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const README_URL =
  'https://raw.githubusercontent.com/DevCaress/guia-entrevistas-de-programacion/main/README.md';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const questionsDir = join(projectRoot, 'questions');
const resourcesDir = join(projectRoot, 'resources');

const headingTechMap = new Map([
  ['angular', 'angular'],
  ['django', 'django'],
  ['flutter', 'flutter'],
  ['java', 'java'],
  ['javascript', 'javascript'],
  ['php', 'php'],
  ['python', 'python'],
  ['react js', 'react'],
  ['typescript', 'typescript'],
  ['vue js', 'vue'],
  ['react clean architecture', 'react'],
  ['vue js clean architecture', 'vue'],
  ['clean architecture express js', 'nodejs'],
  ['clean architecture java', 'java'],
  ['clean architecture php', 'php'],
  ['clean architecture python', 'python'],
  ['control de versiones', 'git'],
  ['workflows', 'git'],
]);

const titleMatchers = {
  angular: [/^Angular Interview questions$/i],
  django: [
    /^Django Interview questions$/i,
    /^Clean Architecture in Django$/i,
    /^Django Clean Architecture$/i,
  ],
  git: [],
  go: [/^Algoritmos en Go$/i],
  java: [
    /^SOLID en Java con Ejemplos - Inglés$/i,
    /^SOLID en Java - Inglés$/i,
    /^Clean Code en Java - Español$/i,
    /^Clean Code en Java - Inglés$/i,
    /^Algoritmos en Java$/i,
    /^Top Data Structures & Algorithms in Java That You Need to Know$/i,
    /^Java Interview questions$/i,
  ],
  javascript: [
    /^SOLID en Javascript Vanilla - Inglés$/i,
    /^Clean Code en Javascript - Español$/i,
    /^Clean Code en Javascript - Inglés$/i,
    /^Algoritmos en Javascript$/i,
    /^JavaScript Algorithms and Data Structures$/i,
    /^Patrones de diseño en Javascript$/i,
    /^52 Frontend Interview Questions - JavaScript$/i,
    /^Javascript Interview questions$/i,
  ],
  laravel: [/^Clean Architecture with Laravel$/i],
  mongodb: [/MongoDB/i],
  nodejs: [/^Node\.js Clean Architecture$/i],
  php: [
    /^PHP Interview questions$/i,
    /^Algoritmos en PHP$/i,
    /^Discovering PHP Data Structures: Arrays, Linked Lists, and Binary Trees$/i,
    /^Efficient data structures for PHP 7$/i,
  ],
  python: [
    /^SOLID en Python - Inglés$/i,
    /^Clean Code en Python - Español$/i,
    /^Clean Code en Python - Inglés$/i,
    /^Algoritmos en Python$/i,
    /^Python Data Structures$/i,
    /^Python Interview questions$/i,
    /^Python Clean Architecture$/i,
  ],
  react: [/^SOLID en React\.JS - Inglés$/i, /^React Interview questions$/i],
  spring: [/^Java Spring Interview questions$/i, /Spring Boot/i],
  sql: [/SQL/i],
  typescript: [
    /^TypeScript best practices by AWS$/i,
    /^TypeScript Best Practices 2021$/i,
    /^Algoritmos en Typescript$/i,
  ],
  vue: [/^SOLID en Vue\.JS - Inglés$/i, /^Vue Interview questions$/i],
};

function normalize(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slugify(value) {
  return normalize(value).replace(/\s+/g, '-');
}

function shortHash(value) {
  return createHash('sha1').update(value).digest('hex').slice(0, 10);
}

function extractLinks(line) {
  return [...line.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)].map((match) => ({
    title: match[1].trim(),
    url: match[2].trim(),
  }));
}

function getTechnologySlugs() {
  return readdirSync(questionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function shouldIncludeByHeading(section, subsection) {
  return (
    headingTechMap.get(normalize(subsection)) ?? headingTechMap.get(normalize(section)) ?? null
  );
}

function shouldIncludeByTitle(title) {
  for (const [technology, matchers] of Object.entries(titleMatchers)) {
    if (matchers.some((matcher) => matcher.test(title))) {
      return technology;
    }
  }

  return null;
}

function toResource(technology, section, subsection, link) {
  const host = new URL(link.url).hostname.replace(/^www\./, '');
  return {
    id: `${technology}-${slugify(link.title)}-${shortHash(link.url)}`,
    technology,
    title: link.title,
    url: link.url,
    section,
    subsection: subsection || section,
    host,
  };
}

async function downloadReadme() {
  const response = await fetch(README_URL, {
    headers: {
      'User-Agent': 'preguntas-entrevista-resource-sync',
      Accept: 'text/plain',
    },
  });

  if (!response.ok) {
    throw new Error(`No se pudo descargar el README remoto (${response.status}).`);
  }

  return response.text();
}

async function main() {
  const technologies = getTechnologySlugs();
  const readme = await downloadReadme();
  const resourcesByTechnology = new Map(technologies.map((technology) => [technology, []]));
  const seenUrlsByTechnology = new Map(technologies.map((technology) => [technology, new Set()]));

  let currentSection = '';
  let currentSubsection = '';

  for (const line of readme.split(/\r?\n/)) {
    const headingMatch = line.match(/^(#{2,4})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();

      if (level === 2) {
        currentSection = headingText;
        currentSubsection = headingText;
      } else {
        currentSubsection = headingText;
      }

      continue;
    }

    const links = extractLinks(line);
    if (links.length === 0) {
      continue;
    }

    for (const link of links) {
      const technology =
        shouldIncludeByTitle(link.title) ??
        shouldIncludeByHeading(currentSection, currentSubsection);
      if (!technology || !resourcesByTechnology.has(technology)) {
        continue;
      }

      const seenUrls = seenUrlsByTechnology.get(technology);
      if (!seenUrls || seenUrls.has(link.url)) {
        continue;
      }

      seenUrls.add(link.url);
      resourcesByTechnology
        .get(technology)
        .push(toResource(technology, currentSection, currentSubsection, link));
    }
  }

  rmSync(resourcesDir, { force: true, recursive: true });
  mkdirSync(resourcesDir, { recursive: true });

  const manifest = {};

  for (const technology of technologies) {
    const resources = resourcesByTechnology.get(technology) ?? [];
    manifest[technology] = resources.length;
    writeFileSync(
      join(resourcesDir, `${technology}.json`),
      `${JSON.stringify(resources, null, 2)}\n`,
      'utf8',
    );
  }

  writeFileSync(
    join(resourcesDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );

  console.log(`Recursos generados para ${technologies.length} tecnologías en ${resourcesDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
