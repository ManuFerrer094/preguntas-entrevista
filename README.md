# Preguntas de Entrevistas Técnicas 🚀

Wiki open source de preguntas técnicas para entrevistas de desarrollo de software, construida con Angular 21, SSR y Angular Material.

[![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=flat&logo=angular)](https://angular.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ¿Qué es esto?

Una web que muestra preguntas típicas de entrevistas técnicas organizadas por tecnología. Cada pregunta tiene su propia URL generada automáticamente desde archivos Markdown.

## Tecnologías cubiertas

- **Angular** — Framework de Google para aplicaciones web
- **React** — Biblioteca de Meta para interfaces de usuario
- **Vue** — Framework progresivo de JavaScript
- **Node.js** — Entorno de ejecución de JavaScript del lado del servidor
- **TypeScript** — Superconjunto tipado de JavaScript
- **JavaScript** — El lenguaje de programación de la web
- **Testing** — Pruebas de software y calidad del código
- **System Design** — Diseño de sistemas escalables y distribuidos

## Stack Tecnológico

- **Angular 21** con Standalone Components
- **Angular SSR** para SEO y rendimiento
- **Angular Signals** para gestión de estado reactivo
- **Angular Material** con tema claro/oscuro
- **TypeScript** en modo strict
- **marked** para renderizado de Markdown
- **ESLint + Prettier** para calidad de código

## Comenzar

```bash
npm install
npm run dev
```

Visita `http://localhost:4200`

## Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo con SSR
npm run build        # Build de producción
npm run test         # Tests unitarios (Vitest + Playwright)
npm run format       # Formatear código (Prettier)
```

## Arquitectura

```
src/app/
├── core/
│   ├── services/     # SeoService — gestión de meta tags y SEO
│   ├── stores/       # ContentStore — estado global con Signals
│   └── utils/        # generateSlug — generador de slugs desde texto
├── domain/
│   └── models/       # Interfaces Question y Technology
├── infrastructure/
│   └── markdown/     # MarkdownParserService — parsea archivos .md
├── features/
│   ├── home/         # Página principal con tarjetas de tecnologías
│   ├── technology/   # Lista de preguntas por tecnología
│   └── question/     # Detalle de pregunta con navegación anterior/siguiente
└── shared/
    └── components/   # NavbarComponent con toggle de tema

questions/
├── angular/questions.md
├── react/questions.md
├── vue/questions.md
├── nodejs/questions.md
├── typescript/questions.md
├── javascript/questions.md
├── testing/questions.md
└── system-design/questions.md
```

## Añadir una nueva pregunta

Cada pregunta es un archivo Markdown independiente dentro de la carpeta de su tecnología
(`questions/<tecnología>/q<N>.md`), con un bloque de YAML frontmatter obligatorio al comienzo.

1. Añade el nuevo archivo, por ejemplo `questions/angular/q16.md`:

```markdown
---
title: ¿Qué es el Change Detection en Angular?
difficulty: medium
tags: [Change Detection, Performance]
---

Respuesta detallada con ejemplos de código si es necesario.

```typescript
@Component({ ... })
export class MyComponent { }
```
```

2. Registra el archivo en `questions/angular/index.json`:

```json
["q1.md", "q2.md", ..., "q16.md"]
```

3. Haz commit y crea un Pull Request

## Añadir una nueva tecnología

1. Crea la carpeta: `questions/<nueva-tecnologia>/`
2. Crea los archivos de preguntas: `questions/<nueva-tecnologia>/q1.md`, `q2.md`, etc., con el formato de frontmatter descrito arriba
3. Crea el índice: `questions/<nueva-tecnologia>/index.json` con la lista de archivos (e.g. `["q1.md","q2.md"]`)
4. Añade la tecnología al array `TECHNOLOGIES` en `src/app/core/stores/content.store.ts`
5. Crea un Pull Request

## Formato de Markdown

Cada pregunta tiene su propio archivo `.md` con frontmatter YAML al inicio:

```markdown
---
title: ¿Qué es Angular?
difficulty: easy
tags: [Framework, Google]
---

Angular es un framework de desarrollo web...
```

Campos del frontmatter:
- `title` (requerido) — título de la pregunta tal como se mostrará en la UI
- `difficulty` — `easy`, `medium` o `hard` (por defecto `medium`)
- `tags` — lista de etiquetas para filtrar (e.g. `[Hooks, State]`)

Los slugs se generan automáticamente desde el título:
- `¿Qué es Angular?` → `/angular/que-es-angular`
- `¿Qué hace el hook useEffect?` → `/react/que-hace-el-hook-useeffect`

## Contribuir

Las contribuciones son bienvenidas y ahora puedes enviarlas directamente desde la web:

- URL pública para contribuciones:  http://preguntas-entrevista.vercel.app/contribuir

Flujos disponibles:

- Enviar por la web (recomendado para la mayoría): rellena el formulario en la URL anterior; el sistema creará automáticamente una Pull Request en este repositorio con el nuevo fichero `.md` y la actualización de `index.json`. Tú revisarás y aprobarás o rechazarás la PR manualmente.
- Contribuir por Git (manual): fork → rama → commit → PR (método clásico)

Pasos tras usar la interfaz web

1. Rellena el formulario en `/contribuir` con la pregunta en Markdown y, opcionalmente, tu nombre y URL de LinkedIn.
2. Si la validación es correcta, el sistema creará una rama y una PR en el repo con el archivo `questions/<tecnología>/q<N>.md` y actualizará `questions/<tecnología>/index.json`.
3. Revisa la PR y haz merge si todo está correcto.

Seguridad y moderación

- No se publica nada automáticamente: todo pasa por una PR que tú debes aprobar.
- Se aplican limitaciones anti-spam (honeypot + rate limiting por IP).
- El token de GitHub necesario está almacenado como variable de entorno en Vercel (nunca en el código).

Variables de entorno (Vercel)

Agrega estas variables en Vercel → Project → Settings → Environment Variables:

- `GITHUB_TOKEN` (required)
    - Valor: tu Personal Access Token (fine‑grained preferido) con permisos mínimos.
    - Permisos recomendados: Contents Read & Write, Pull requests Read & Write, Metadata Read.

- `REPO_OWNER` (required)
    - Valor: tu usuario u organización en GitHub (ej. `mi-usuario`).

- `REPO_NAME` (required)
    - Valor: `preguntas-entrevista` (o el nombre del repo si difiere).

- `BASE_BRANCH` (optional, default `main`)
    - Valor: la rama base donde crear PRs (ej. `main`).

- `RATE_LIMIT_MAX` (optional)
    - Valor: máximo de envíos por IP por ventana (ej. `3`).

- `RATE_LIMIT_WINDOW_MS` (optional)
    - Valor: ventana de rate limit en milisegundos (ej. `3600000` para 1 hora).

Nota: revoca inmediatamente cualquier token que hayas expuesto accidentalmente y crea uno nuevo con permisos mínimos.

Variables de entorno para desarrollo local

Puedes crear un fichero `.env` en la raíz del proyecto con estas variables para desarrollo local (no incluir este fichero en commits):

```env
GITHUB_TOKEN=ghp_tu_token_aqui
REPO_OWNER=tu-usuario-github
REPO_NAME=preguntas-entrevista
BASE_BRANCH=main
```

Después de añadir las variables locales, reinicia el servidor de desarrollo.

## Licencia

MIT
