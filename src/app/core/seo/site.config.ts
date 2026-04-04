type RuntimeWithProcess = typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
};

function readRuntimeEnv(name: string): string | undefined {
  return (globalThis as RuntimeWithProcess).process?.env?.[name];
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export const SITE_NAME = 'Preguntas Entrevista';
export const SITE_LANGUAGE = 'es';
export const SITE_DESCRIPTION =
  'Preguntas reales y recursos curados para preparar entrevistas técnicas por tecnología.';
export const SITE_URL = trimTrailingSlash(
  readRuntimeEnv('SITE_URL') ?? 'https://preguntas-entrevista.vercel.app',
);
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.svg`;
export const CONTACT_EMAIL = 'hola@preguntasentrevista.dev';
