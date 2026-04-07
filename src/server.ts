import 'dotenv/config';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createPdfRouter } from './api/pdf.router';
import { createAiQuestionsRouter } from './api/ai-questions.router';
import { createSubmitQuestionRouter } from './api/submit-question.router';
import { createAuthGitHubRouter } from './api/auth-github.router';
import { createQuizRouter } from './api/quiz.router';
import { createSeoRouter } from './api/seo.router';

const browserDistFolder = join(import.meta.dirname, '../browser');
// In production the questions are copied to the browser bundle output;
// in dev (ng serve) they live at the project root instead.
const builtQuestionsDir = join(browserDistFolder, 'questions');
const questionsDir = existsSync(builtQuestionsDir)
  ? builtQuestionsDir
  : join(process.cwd(), 'questions');

const app = express();
const angularApp = new AngularNodeAppEngine();
app.use(express.json({ limit: '100kb' }));

/**
 * PDF generation API — returns a downloadable PDF with all questions for a technology.
 * GET /api/pdf/:technology   (legacy)
 * GET /api/dossier/:technology
 */
const pdfRouter = createPdfRouter(questionsDir);
app.use('/api/pdf', pdfRouter);
app.use('/api/dossier', pdfRouter);

/**
 * AI-powered question generation — analyses a job description and returns relevant questions.
 * POST /api/ai-questions
 */
const aiRouter = createAiQuestionsRouter(questionsDir);
app.use('/api/ai-questions', aiRouter);

/**
 * Community question submissions — creates a PR on GitHub.
 * POST /api/submit-question
 */
const submitRouter = createSubmitQuestionRouter();
app.use('/api/submit-question', submitRouter);

/**
 * GitHub OAuth — client ID retrieval and code exchange.
 * GET  /api/auth/github
 * POST /api/auth/github
 */
const authRouter = createAuthGitHubRouter();
app.use('/api/auth/github', authRouter);

/**
 * AI-powered quiz — generates a multiple-choice exam from a job description.
 * POST /api/quiz
 */
const quizRouter = createQuizRouter();
app.use('/api/quiz', quizRouter);

/**
 * SEO surfaces â€” robots.txt and sitemap index/sections.
 */
app.use(createSeoRouter());

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
