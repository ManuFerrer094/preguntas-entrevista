import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  readQuestions,
  technologyNameFromSlug,
  type DossierTechnologySection,
} from './generate-dossier.js';

export function hasQuestionCatalog(questionsDir: string, technology: string): boolean {
  const techDir = join(questionsDir, technology);
  const indexPath = join(techDir, 'index.json');
  return existsSync(techDir) && existsSync(indexPath);
}

export function normalizeTechnologies(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .filter((entry, index, entries) => entries.indexOf(entry) === index);
}

export function buildDossierSections(
  questionsDir: string,
  technologies: string[],
): DossierTechnologySection[] {
  return technologies
    .filter((technology) => hasQuestionCatalog(questionsDir, technology))
    .map((technology) => ({
      slug: technology,
      technologyName: technologyNameFromSlug(technology),
      questions: readQuestions(join(questionsDir, technology)),
    }))
    .filter((section) => section.questions.length > 0);
}

export function buildDossierFilename(technologies: string[]): string {
  if (technologies.length === 1) {
    return `preguntas-entrevista-${technologies[0]}.pdf`;
  }

  return `preguntas-entrevista-dossier-${technologies.length}-tecnologias.pdf`;
}
