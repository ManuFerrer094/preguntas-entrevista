# Preguntas de Entrevistas Técnicas 🚀

Wiki open source de preguntas técnicas para entrevistas de desarrollo de software, construida con Angular 21, SSR y Angular Material.

[![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=flat&logo=angular)](https://angular.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ¿Qué es esto?

Una web que muestra preguntas típicas de entrevistas técnicas organizadas por tecnología, similar a [reactjs.wiki](https://www.reactjs.wiki/). Cada pregunta tiene su propia URL generada automáticamente desde archivos Markdown.

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
npm run test         # Tests unitarios (Vitest)
npm run lint         # Linter (ESLint)
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

1. Abre el archivo `questions/<tecnología>/questions.md`
2. Añade una nueva sección al final:

```markdown
---

# ¿Tu nueva pregunta aquí?

Respuesta detallada con ejemplos de código si es necesario.
```

3. Haz commit y crea un Pull Request

## Añadir una nueva tecnología

1. Crea la carpeta: `questions/<nueva-tecnologia>/`
2. Crea el archivo: `questions/<nueva-tecnologia>/questions.md` con el formato de preguntas
3. Añade la tecnología al array `TECHNOLOGIES` en `src/app/core/stores/content.store.ts`
4. Crea un Pull Request

## Formato de Markdown

Cada pregunta se define con un H1 (`#`). El contenido posterior es la respuesta. Las preguntas se separan con `---`.

```markdown
# ¿Qué es Angular?

Angular es un framework de desarrollo web...

---

# ¿Qué es Change Detection?

Change detection es el mecanismo...
```

Los slugs se generan automáticamente desde el título:
- `¿Qué es Angular?` → `/angular/que-es-angular`
- `¿Qué hace el hook useEffect?` → `/react/que-hace-el-hook-useeffect`

## Contribuir

Las contribuciones son bienvenidas. Por favor sigue estos pasos:

1. Haz fork del repositorio
2. Crea una rama: `git checkout -b feature/nueva-pregunta`
3. Haz tus cambios
4. Asegúrate de que el linter pasa: `npm run lint`
5. Envía un Pull Request con descripción clara de los cambios

## Licencia

MIT
