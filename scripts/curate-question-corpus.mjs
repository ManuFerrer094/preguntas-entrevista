import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'glob';
import {
  CODE_HEADING,
  REQUIRED_HEADINGS,
  REVIEW_DATE,
  humanizeTag,
  normalizeWhitespace,
  parseFrontmatter,
  pickVariant,
  requiresCode,
  resolveCategory,
  serializeQuestion,
  technologyFromFile,
  technologyLabelFromFile,
  truncateSummary,
} from './lib/editorial-rules.mjs';

const QUESTION_FILES = globSync('questions/**/*.md', { nodir: true }).sort();

function normalizeTitle(title) {
  return title.replace(/\s+/g, ' ').trim();
}

function cleanQuestion(title) {
  return title.replace(/^¿/, '').replace(/\?$/, '').trim();
}

function toSentenceList(items) {
  return items.map((item) => `- ${item}`).join('\n');
}

function lowerFirst(value) {
  if (!value) return value;
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function lines(items) {
  return items.join('\n');
}

function buildContext(file) {
  const source = readFileSync(file, 'utf8');
  const { metadata } = parseFrontmatter(source);
  const title = normalizeTitle(metadata.title ?? '');

  if (!title) return null;

  const technology = technologyFromFile(file);

  return {
    file,
    technology,
    technologyLabel: technologyLabelFromFile(file),
    title,
    cleanTitle: cleanQuestion(title),
    difficulty: metadata.difficulty ?? 'medium',
    tags: Array.isArray(metadata.tags) ? metadata.tags : [],
    primaryLabel: humanizeTag(Array.isArray(metadata.tags) ? metadata.tags[0] : ''),
    secondaryLabel: humanizeTag(Array.isArray(metadata.tags) ? metadata.tags[1] ?? metadata.tags[0] : ''),
    tertiaryLabel: humanizeTag(Array.isArray(metadata.tags) ? metadata.tags[2] ?? metadata.tags[1] ?? metadata.tags[0] : ''),
    category: resolveCategory(title, Array.isArray(metadata.tags) ? metadata.tags : []),
    requiresCode: requiresCode({
      title,
      tags: Array.isArray(metadata.tags) ? metadata.tags : [],
    }),
    author: metadata.author,
    authorUrl: metadata.authorUrl,
  };
}

function buildSummary(context) {
  const codeSuffix = context.requiresCode ? ' con ejemplo de código' : '';
  return truncateSummary(
    `${context.title} en ${context.technologyLabel}: criterios sobre ${lowerFirst(context.primaryLabel)}${context.secondaryLabel !== context.primaryLabel ? ` y ${lowerFirst(context.secondaryLabel)}` : ''}, errores comunes y respuesta práctica${codeSuffix}.`,
  );
}

function buildIntro(context) {
  const firstParagraph = pickVariant(
    [
      `"${context.title}" toca un punto muy concreto de ${context.technologyLabel}: cómo tomar decisiones de ${lowerFirst(context.primaryLabel)} sin esconder el problema bajo una abstracción vistosa.`,
      `Detrás de "${context.title}" suele haber una tensión real en ${context.technologyLabel} entre ${lowerFirst(context.primaryLabel)} y ${lowerFirst(context.secondaryLabel)}.`,
      `La mejor forma de responder "${context.title}" en ${context.technologyLabel} es separar mecanismo técnico, criterio de uso y señales de revisión.`,
      `Esta pregunta de ${context.technologyLabel} sobre "${context.cleanTitle}" deja ver rápido si conviertes ${lowerFirst(context.primaryLabel)} en decisiones operativas o si te quedas en teoría.`,
    ],
    `${context.file}-intro-a`,
  );

  const secondParagraph =
    context.difficulty === 'easy'
      ? pickVariant(
          [
            `En un nivel base conviene demostrar dominio del flujo principal, un lenguaje claro y la capacidad de evitar los errores más caros de mantenimiento cuando ${lowerFirst(context.primaryLabel)} ya aparece en un caso real.`,
            `Aquí no hace falta sonar grandilocuente: basta con explicar el caso feliz de "${context.cleanTitle}", sus límites y el motivo por el que ${lowerFirst(context.primaryLabel)} no debería complicarse antes de tiempo.`,
          ],
          `${context.file}-intro-b`,
        )
      : context.difficulty === 'hard'
        ? pickVariant(
            [
              `En una entrevista fuerte gana peso la persona que habla de costes, señales de degradación, deuda aceptada y plan de validación para "${context.cleanTitle}", no solo de API o sintaxis.`,
              `Una respuesta senior se nota cuando nombras qué riesgo quieres reducir con ${lowerFirst(context.primaryLabel)} en ${context.technologyLabel} para "${context.cleanTitle}", qué concesión aceptarías frente a ${lowerFirst(context.secondaryLabel)} y qué comprobarías antes de extender la decisión a todo el sistema.`,
            ],
            `${context.file}-intro-b`,
          )
        : pickVariant(
            [
              `En un nivel intermedio interesa ver si colocas bien los límites de "${context.cleanTitle}", justificas por qué eliges ese patrón y explicas cómo lo mantendrías legible para el equipo.`,
              `La respuesta mejora cuando explicas qué parte del problema resuelves ahora con ${lowerFirst(context.primaryLabel)} en ${context.technologyLabel} para "${context.cleanTitle}", qué dejas derivado en ${lowerFirst(context.secondaryLabel)} y cómo detectarías pronto que la solución empieza a quedarse corta.`,
            ],
            `${context.file}-intro-b`,
          );

  return `${firstParagraph}\n\n${secondParagraph}`;
}

function evaluationBullets(context) {
  const common = [
    `Si distingues qué parte de "${context.cleanTitle}" pertenece a ${lowerFirst(context.primaryLabel)} y cuál debería resolverse en ${lowerFirst(context.secondaryLabel)}.`,
    'Si conviertes la respuesta en criterios observables: límites claros, impacto en el mantenimiento y forma de detectar regresiones.',
  ];

  const categorySpecific = {
    architecture:
      'Si separas decisiones reversibles de irreversibles y justificas la arquitectura por velocidad de cambio, no por preferencia personal.',
    state:
      'Si identificas la fuente de verdad, el estado derivado y los puntos donde podría aparecer sincronización manual o duplicada.',
    effects:
      'Si sabes ubicar efectos, limpiezas, cancelación y propagación de errores sin contaminar la parte declarativa del código.',
    rendering:
      'Si entiendes qué dispara trabajo real de render o hidratación y cuándo merece la pena optimizar frente a cuándo solo estás moviendo complejidad.',
    forms:
      'Si separas entrada de usuario, validación, envío y feedback visual sin mezclar estados transitorios con reglas de negocio.',
    quality:
      'Si eres capaz de reproducir, observar y acotar el problema antes de tocar código o antes de pedir una reescritura mayor.',
    integration: 'Si modelas bien contratos, errores, reintentos, autenticación o cancelación sin dejar huecos entre capas.',
    types:
      'Si usas el sistema de tipos para capturar invariantes y reducir ambigüedad en lugar de acumular tipos ceremoniales.',
    performance:
      'Si mides antes de optimizar y eliges la palanca correcta entre render, red, memoria, bundle o concurrencia.',
    migration:
      'Si planteas una evolución incremental, con visibilidad y posibilidad de rollback, en vez de una reescritura total sin red de seguridad.',
    language:
      `Si sabes explicar qué ventaja real te aporta ${lowerFirst(context.primaryLabel)} y qué coste de legibilidad, depuración o mantenimiento arrastra.`,
  };

  return [...common, categorySpecific[context.category] ?? categorySpecific.language];
}

function answerBullets(context) {
  const byCategory = {
    architecture: [
      `Empieza por el borde del problema: dominios, módulos o responsabilidades que hoy cambian a ritmos distintos en ${context.technologyLabel}.`,
      'Justifica dónde pondrías las fronteras, qué acoplamientos aceptarías al principio y qué señal te haría revisar la decisión.',
      'Cierra con un criterio de validación real: coste de cambio, tiempo de entrega, número de puntos tocados o incidencias evitadas.',
    ],
    state: [
      'Nombra primero la fuente de verdad y deja claro qué datos deberían derivarse en vez de almacenarse dos veces.',
      'Explica dónde viviría cada pieza de estado: local si solo afecta a una interacción, compartido si cruza componentes y remoto si depende del servidor.',
      'Añade cómo evitarías sincronizaciones manuales, renders accidentales y errores por datos obsoletos.',
    ],
    effects: [
      'Distingue qué parte puede seguir siendo pura y qué parte necesita sincronizarse con el mundo exterior.',
      'Describe cómo controlarías suscripciones, cancelación, reintentos o cierre de recursos para que el componente no acumule efectos zombis.',
      'Si hay asincronía, aclara qué harías con estados intermedios, errores y cambios rápidos de entrada.',
    ],
    rendering: [
      'Explica qué unidad quieres volver a pintar, conservar o diferir y por qué esa decisión mejora la experiencia sin complicar el árbol.',
      'Relaciona la solución con claves, memoización, detección de cambios, hidratación o virtualización solo si el cuello de botella está realmente ahí.',
      'Si propones optimización, acompáñala de una forma de medirla con herramientas o métricas visibles.',
    ],
    forms: [
      'Modela el flujo completo: valor inicial, cambios, validación, envío, recuperación ante error y limpieza del formulario.',
      'Separa reglas del dominio de reglas puramente visuales para que el formulario no se convierta en un componente imposible de probar.',
      'Explica cómo manejarías estado pendiente, mensajes de error y deshabilitado del submit sin bloquear casos válidos.',
    ],
    quality: [
      'Empieza haciendo observable el problema: pasos de reproducción, datos de entrada, logs, métricas o test que fallen por una sola causa.',
      'Reduce el alcance antes de corregir: cambia una variable cada vez y confirma si el fallo está en el código, en el contrato o en el entorno.',
      'Termina con prevención: una prueba útil, mejor observabilidad o un diseño más simple que haga menos probable la recaída.',
    ],
    integration: [
      'Aterriza el contrato: qué entra, qué sale, qué errores se traducen, qué tiempos esperas y qué política sigues para cancelar o reintentar.',
      'Explica dónde pondrías la lógica de transformación para no propagar dependencias externas por todo el sistema.',
      'Incluye cómo protegerías el flujo ante respuestas parciales, estados inconsistentes y credenciales mal gestionadas.',
    ],
    types: [
      'Empieza por la forma del dato y por los invariantes que no quieres volver a revisar en cada llamada.',
      'Usa tipos que ayuden a modelar estados válidos e inválidos en vez de esconderlos tras uniones demasiado amplias o casts oportunistas.',
      'Completa la respuesta con el puente entre tipado y runtime: validación de entrada, narrowing o conversión explícita cuando haga falta.',
    ],
    performance: [
      'Reproduce el cuello de botella y decide si el coste está en render, red, CPU, serialización, memoria o I/O.',
      'Escoge la optimización más barata que mantenga el código entendible y deja claro cuándo la retirarías si deja de compensar.',
      'Relaciona la mejora con una métrica concreta: tiempo interactivo, número de renders, consumo de memoria o latencia p95.',
    ],
    migration: [
      'Acota primero qué parte del sistema necesita migración y qué piezas pueden convivir temporalmente sin duplicar negocio.',
      'Propón una secuencia corta: adaptadores, tests de seguridad, coexistencia temporal y retirada explícita de lo antiguo.',
      'Aclara cómo medirías avance y riesgo para no confundir actividad con mejora real.',
    ],
    language: [
      `Explica la característica con un ejemplo concreto y después enlázala con legibilidad, coste de cambio y fallos frecuentes en producción.`,
      `Compara la solución con una alternativa simple para dejar claro cuándo compensa usar ${lowerFirst(context.primaryLabel)} y cuándo solo añade ruido.`,
      'Si el lenguaje o framework ofrece varias rutas, justifica por qué elegirías una hoy y qué te haría revisarla mañana.',
    ],
  };

  return byCategory[context.category] ?? byCategory.language;
}

function tradeoffBullets(context) {
  const byCategory = {
    architecture: [
      'Abrir más capas de las necesarias suele esconder la lógica importante y hacer más lenta la entrega sin resolver el acoplamiento real.',
      'Una arquitectura que nadie del equipo puede explicar en una pizarra rara vez aguanta bien el paso del tiempo.',
    ],
    state: [
      'Duplicar estado entre store, formularios, URL o caché acaba generando inconsistencias que son difíciles de reproducir.',
      'Mover demasiado pronto una preocupación al estado global hace visible el problema, pero no lo arregla.',
    ],
    effects: [
      'El error habitual es usar efectos para derivar datos que podrían calcularse de forma pura o para tapar un mal diseño de dependencias.',
      'Sin cancelación ni limpieza es muy fácil dejar trabajo en vuelo, respuestas tardías o cierres obsoletos.',
    ],
    rendering: [
      'Optimizar sin perfilar antes suele desplazar la complejidad hacia el componente sin tocar el verdadero cuello de botella.',
      'Forzar memoización, cachés o control fino del render donde no hace falta complica la depuración y suele envejecer mal.',
    ],
    forms: [
      'Mezclar validación de negocio con validación visual acaba creando formularios rígidos y mensajes difíciles de mantener.',
      'Tratar todos los errores como texto plano sin mapear contexto ni acción del usuario degrada mucho la experiencia.',
    ],
    quality: [
      'Corregir una incidencia sin dejar rastro observable o sin una prueba asociada suele invitar a la repetición del mismo fallo con otra forma.',
      'Un test que solo replica la implementación deja tranquilidad aparente, pero poca señal cuando el comportamiento importante cambia.',
    ],
    integration: [
      'Acoplar directamente la UI o el dominio al formato exacto del proveedor externo multiplica el coste de cambio.',
      'Los reintentos ciegos, la traducción pobre de errores y la ausencia de timeouts suelen empeorar la incidencia en lugar de contenerla.',
    ],
    types: [
      'Llenar el código de casts o tipos demasiado permisivos anula justo la garantía que intentabas conseguir.',
      'Modelar estados imposibles como si fueran normales desplaza el error a producción o a la lógica de presentación.',
    ],
    performance: [
      'Una mejora local sin criterio de retirada puede hipotecar la legibilidad durante meses por una ganancia que ya no importa.',
      'Optimizar lo que no se mide suele ser una forma cara de adivinar.',
    ],
    migration: [
      'Prometer una sustitución total sin convivencia ni métricas claras suele bloquear negocio y dilatar el coste real del cambio.',
      'Si no nombras qué deuda temporal aceptas, la migración se queda a medias y convive con dos modelos durante demasiado tiempo.',
    ],
    language: [
      'La característica más elegante del lenguaje no siempre es la mejor para un equipo que necesita leer, depurar y evolucionar el código con rapidez.',
      'Usar un patrón porque suena avanzado es una mala señal si no mejora claridad, seguridad o velocidad de cambio.',
    ],
  };

  return byCategory[context.category] ?? byCategory.language;
}

function buildCaseReal(context) {
  return pickVariant(
    [
      `Un caso creíble para "${context.title}" aparece cuando una funcionalidad de ${context.technologyLabel} mezcla ${lowerFirst(context.primaryLabel)} con ${lowerFirst(context.secondaryLabel)} y el equipo empieza a tocar demasiados puntos para un cambio pequeño. Ahí conviene probar la solución sobre una pantalla o flujo acotado, medir si reduce fricción y solo después extender el patrón.`,
      `Yo lo bajaría a un escenario reconocible de ${context.technologyLabel}: una pieza donde "${context.cleanTitle}" aparece de forma recurrente, ya ha dejado señales en revisión o en soporte y mezcla ${lowerFirst(context.primaryLabel)} con ${lowerFirst(context.secondaryLabel)}. Si la decisión mejora claridad, observabilidad y velocidad de cambio en ese trozo, entonces merece escalarla; si no, la dejaría local y documentada.`,
      `La forma seria de aterrizar "${context.cleanTitle}" es escoger un caso con usuarios reales, un criterio de éxito visible y una superficie de rollback pequeña. Eso obliga a hablar de impacto, no de dogmas, y evita convertir ${lowerFirst(context.primaryLabel)} en arquitectura ornamental.`,
    ],
    `${context.file}-case`,
  );
}

function buildSoundbite(context) {
  return pickVariant(
    [
      `Primero aclaro qué problema resuelvo con ${lowerFirst(context.primaryLabel)} y luego elijo la técnica; no al revés.`,
      `Si una decisión de ${context.technologyLabel} no mejora claridad, coste de cambio o fiabilidad, probablemente aún no merece existir.`,
      `En "${context.cleanTitle}" me interesa más mantener una fuente de verdad clara y una validación honesta que sonar sofisticado.`,
      'Prefiero una solución comprobable y reversible a una respuesta brillante que nadie sepa mantener dentro de seis meses.',
    ],
    `${context.file}-quote`,
  );
}

function reactSnippet(category) {
  switch (category) {
    case 'forms':
      return {
        language: 'tsx',
        code: lines([
          "import { FormEvent, useState } from 'react';",
          '',
          'export function LoginForm() {',
          "  const [email, setEmail] = useState('');",
          "  const [password, setPassword] = useState('');",
          "  const [error, setError] = useState<string | null>(null);",
          '',
          '  function handleSubmit(event: FormEvent<HTMLFormElement>) {',
          '    event.preventDefault();',
          "    if (!email.includes('@')) {",
          "      setError('Introduce un correo válido.');",
          '      return;',
          '    }',
          '    setError(null);',
          '  }',
          '',
          '  return (',
          '    <form onSubmit={handleSubmit}>',
          '      <input value={email} onChange={(event) => setEmail(event.target.value)} />',
          '      <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />',
          '      {error ? <p role="alert">{error}</p> : null}',
          '      <button type="submit">Entrar</button>',
          '    </form>',
          '  );',
          '}',
        ]),
      };
    case 'quality':
      return {
        language: 'tsx',
        code: lines([
          "import React from 'react';",
          "import { render, screen } from '@testing-library/react';",
          "import userEvent from '@testing-library/user-event';",
          '',
          'function Counter() {',
          '  const [count, setCount] = React.useState(0);',
          '  return <button onClick={() => setCount((current) => current + 1)}>{count}</button>;',
          '}',
          '',
          "test('incrementa el contador al pulsar el botón', async () => {",
          '  const user = userEvent.setup();',
          '  render(<Counter />);',
          "  await user.click(screen.getByRole('button', { name: '0' }));",
          "  expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();",
          '});',
        ]),
      };
    case 'integration':
    case 'effects':
      return {
        language: 'tsx',
        code: lines([
          "import { useEffect, useState } from 'react';",
          '',
          'export function UserPanel({ userId }: { userId: string }) {',
          "  const [user, setUser] = useState<{ name: string } | null>(null);",
          "  const [error, setError] = useState<string | null>(null);",
          '',
          '  useEffect(() => {',
          '    const controller = new AbortController();',
          '',
          '    async function loadUser() {',
          '      try {',
          '        const response = await fetch(`/api/users/${userId}`, { signal: controller.signal });',
          "        if (!response.ok) throw new Error('No se pudo cargar el usuario');",
          '        setUser(await response.json());',
          '      } catch (cause) {',
          "        if (!(cause instanceof DOMException && cause.name === 'AbortError')) {",
          "          setError('No hemos podido cargar los datos.');",
          '        }',
          '      }',
          '    }',
          '',
          '    void loadUser();',
          '    return () => controller.abort();',
          '  }, [userId]);',
          '',
          '  if (error) return <p>{error}</p>;',
          '  return <p>{user?.name ?? "Cargando..."}</p>;',
          '}',
        ]),
      };
    default:
      return {
        language: 'tsx',
        code: lines([
          "import { memo, useMemo, useState } from 'react';",
          '',
          'const ProductList = memo(function ProductList({ products }: { products: string[] }) {',
          '  return <ul>{products.map((product) => <li key={product}>{product}</li>)}</ul>;',
          '});',
          '',
          'export function SearchPanel({ products }: { products: string[] }) {',
          "  const [query, setQuery] = useState('');",
          '  const visibleProducts = useMemo(',
          '    () => products.filter((product) => product.toLowerCase().includes(query.toLowerCase())),',
          '    [products, query],',
          '  );',
          '',
          '  return (',
          '    <>',
          '      <input value={query} onChange={(event) => setQuery(event.target.value)} />',
          '      <ProductList products={visibleProducts} />',
          '    </>',
          '  );',
          '}',
        ]),
      };
  }
}

function angularSnippet(category) {
  switch (category) {
    case 'forms':
      return {
        language: 'ts',
        code: lines([
          "import { Component, inject } from '@angular/core';",
          "import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';",
          '',
          '@Component({',
          "  selector: 'app-profile-form',",
          '  standalone: true,',
          '  imports: [ReactiveFormsModule],',
          '  template: `',
          '    <form [formGroup]="form" (ngSubmit)="save()">',
          '      <input formControlName="email" />',
          '      @if (form.controls.email.invalid && form.controls.email.touched) {',
          '        <p>Introduce un correo válido.</p>',
          '      }',
          '      <button type="submit" [disabled]="form.invalid">Guardar</button>',
          '    </form>',
          '  `,',
          '})',
          'export class ProfileFormComponent {',
          '  private readonly fb = inject(FormBuilder);',
          '  readonly form = this.fb.group({',
          "    email: ['', [Validators.required, Validators.email]],",
          '  });',
          '',
          '  save() {',
          '    if (this.form.invalid) return;',
          '    console.log(this.form.getRawValue());',
          '  }',
          '}',
        ]),
      };
    case 'integration':
    case 'effects':
      return {
        language: 'ts',
        code: lines([
          "import { HttpInterceptorFn } from '@angular/common/http';",
          "import { catchError, throwError } from 'rxjs';",
          '',
          'export const authInterceptor: HttpInterceptorFn = (request, next) => {',
          '  const authenticatedRequest = request.clone({',
          "    setHeaders: { Authorization: 'Bearer token-demo' },",
          '  });',
          '',
          '  return next(authenticatedRequest).pipe(',
          '    catchError((error) => {',
          "      console.error('Error HTTP', error.status);",
          '      return throwError(() => error);',
          '    }),',
          '  );',
          '};',
        ]),
      };
    case 'quality':
      return {
        language: 'ts',
        code: lines([
          "import { TestBed } from '@angular/core/testing';",
          '',
          'describe("PriceLabelComponent", () => {',
          '  beforeEach(() => {',
          '    TestBed.configureTestingModule({});',
          '  });',
          '',
          '  it("formatea el precio con dos decimales", () => {',
          '    const price = 12;',
          '    const formatted = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2 }).format(price);',
          '    expect(formatted).toBe("12,00");',
          '  });',
          '});',
        ]),
      };
    default:
      return {
        language: 'ts',
        code: lines([
          "import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';",
          '',
          '@Component({',
          "  selector: 'app-product-filter',",
          '  standalone: true,',
          '  changeDetection: ChangeDetectionStrategy.OnPush,',
          '  template: `',
          '    <input [value]="query()" (input)="query.set(($any($event.target)).value)" />',
          '    <ul>',
          '      @for (product of filteredProducts(); track product.id) {',
          '        <li>{{ product.name }}</li>',
          '      }',
          '    </ul>',
          '  `,',
          '})',
          'export class ProductFilterComponent {',
          "  readonly query = signal('');",
          "  readonly products = signal([{ id: 1, name: 'Angular' }, { id: 2, name: 'RxJS' }]);",
          '  readonly filteredProducts = computed(() =>',
          '    this.products().filter((product) =>',
          '      product.name.toLowerCase().includes(this.query().trim().toLowerCase()),',
          '    ),',
          '  );',
          '}',
        ]),
      };
  }
}

function vueSnippet(category) {
  switch (category) {
    case 'forms':
      return {
        language: 'vue',
        code: lines([
          '<script setup lang="ts">',
          "import { ref } from 'vue';",
          '',
          "const email = ref('');",
          "const error = ref('');",
          '',
          'function submit() {',
          "  error.value = email.value.includes('@') ? '' : 'Introduce un correo válido.';",
          '}',
          '</script>',
          '',
          '<template>',
          '  <form @submit.prevent="submit">',
          '    <input v-model="email" type="email" />',
          '    <p v-if="error">{{ error }}</p>',
          '    <button type="submit">Guardar</button>',
          '  </form>',
          '</template>',
        ]),
      };
    case 'effects':
    case 'integration':
      return {
        language: 'vue',
        code: lines([
          '<script setup lang="ts">',
          "import { onMounted, ref, watch } from 'vue';",
          '',
          "const userId = ref('42');",
          'const user = ref<{ name: string } | null>(null);',
          '',
          'async function loadUser(id: string) {',
          '  const response = await fetch(`/api/users/${id}`);',
          '  user.value = await response.json();',
          '}',
          '',
          'watch(userId, (id) => {',
          '  void loadUser(id);',
          '});',
          '',
          'onMounted(() => {',
          '  void loadUser(userId.value);',
          '});',
          '</script>',
        ]),
      };
    default:
      return {
        language: 'vue',
        code: lines([
          '<script setup lang="ts">',
          "import { computed, ref } from 'vue';",
          '',
          "const query = ref('');",
          "const products = ref(['Vue', 'Pinia', 'Vitest']);",
          'const filteredProducts = computed(() =>',
          '  products.value.filter((product) => product.toLowerCase().includes(query.value.toLowerCase())),',
          ');',
          '</script>',
          '',
          '<template>',
          '  <input v-model="query" placeholder="Buscar" />',
          '  <ul>',
          '    <li v-for="product in filteredProducts" :key="product">{{ product }}</li>',
          '  </ul>',
          '</template>',
        ]),
      };
  }
}

function javascriptSnippet(category) {
  switch (category) {
    case 'quality':
      return {
        language: 'js',
        code: lines([
          'function parsePrice(input) {',
          '  const value = Number(input);',
          '  if (Number.isNaN(value)) {',
          "    throw new Error('El precio debe ser numérico');",
          '  }',
          '  return value;',
          '}',
          '',
          'console.assert(parsePrice("12") === 12);',
        ]),
      };
    case 'effects':
    case 'integration':
      return {
        language: 'js',
        code: lines([
          'async function loadUser(userId, signal) {',
          '  const response = await fetch(`/api/users/${userId}`, { signal });',
          "  if (!response.ok) throw new Error('No se pudo cargar el usuario');",
          '  return response.json();',
          '}',
          '',
          'const controller = new AbortController();',
          'loadUser("42", controller.signal).catch((error) => {',
          "  if (error.name !== 'AbortError') console.error(error);",
          '});',
        ]),
      };
    default:
      return {
        language: 'js',
        code: lines([
          'function createCounter() {',
          '  let count = 0;',
          '  return {',
          '    increment() {',
          '      count += 1;',
          '      return count;',
          '    },',
          '    get value() {',
          '      return count;',
          '    },',
          '  };',
          '}',
          '',
          'const counter = createCounter();',
          'console.log(counter.increment());',
        ]),
      };
  }
}

function typescriptSnippet(category) {
  switch (category) {
    case 'integration':
      return {
        language: 'ts',
        code: lines([
          'type ApiResult<T> =',
          '  | { ok: true; data: T }',
          '  | { ok: false; error: string };',
          '',
          'async function getUser(id: string): Promise<ApiResult<{ id: string; name: string }>> {',
          '  const response = await fetch(`/api/users/${id}`);',
          '  if (!response.ok) return { ok: false, error: "No disponible" };',
          '  return { ok: true, data: await response.json() };',
          '}',
        ]),
      };
    default:
      return {
        language: 'ts',
        code: lines([
          'type LoadingState<T> =',
          '  | { status: "idle" }',
          '  | { status: "loading" }',
          '  | { status: "success"; data: T }',
          '  | { status: "error"; message: string };',
          '',
          'function isSuccess<T>(state: LoadingState<T>): state is { status: "success"; data: T } {',
          '  return state.status === "success";',
          '}',
          '',
          'const state: LoadingState<number> = { status: "success", data: 42 };',
          'if (isSuccess(state)) console.log(state.data);',
        ]),
      };
  }
}

function nodeSnippet(category) {
  switch (category) {
    case 'performance':
      return {
        language: 'ts',
        code: lines([
          "import { Worker } from 'node:worker_threads';",
          '',
          'function runJob(payload: string) {',
          '  return new Promise((resolve, reject) => {',
          '    const worker = new Worker(new URL("./worker.js", import.meta.url), { workerData: payload });',
          '    worker.once("message", resolve);',
          '    worker.once("error", reject);',
          '  });',
          '}',
        ]),
      };
    case 'quality':
      return {
        language: 'ts',
        code: lines([
          "import test from 'node:test';",
          "import assert from 'node:assert/strict';",
          '',
          'function normalizeEmail(email: string) {',
          '  return email.trim().toLowerCase();',
          '}',
          '',
          'test("normaliza espacios y mayúsculas", () => {',
          '  assert.equal(normalizeEmail("  USER@demo.com "), "user@demo.com");',
          '});',
        ]),
      };
    default:
      return {
        language: 'ts',
        code: lines([
          "import { pipeline } from 'node:stream/promises';",
          "import { createReadStream, createWriteStream } from 'node:fs';",
          "import { createGzip } from 'node:zlib';",
          '',
          'await pipeline(',
          '  createReadStream("server.log"),',
          '  createGzip(),',
          '  createWriteStream("server.log.gz"),',
          ');',
        ]),
      };
  }
}

function javaSnippet(category) {
  switch (category) {
    case 'effects':
    case 'performance':
      return {
        language: 'java',
        code: lines([
          'CompletableFuture<User> userFuture = CompletableFuture.supplyAsync(() -> repository.loadUser(id));',
          'CompletableFuture<Permissions> permissionsFuture = CompletableFuture.supplyAsync(() -> repository.loadPermissions(id));',
          '',
          'UserProfile profile = userFuture',
          '    .thenCombine(permissionsFuture, UserProfile::new)',
          '    .orTimeout(2, TimeUnit.SECONDS)',
          '    .join();',
        ]),
      };
    case 'quality':
      return {
        language: 'java',
        code: lines([
          '@Test',
          'void shouldRejectExpiredToken() {',
          '    TokenValidator validator = new TokenValidator(Clock.fixed(Instant.parse("2026-04-04T10:00:00Z"), ZoneOffset.UTC));',
          '    assertFalse(validator.isValid(Instant.parse("2026-04-04T09:00:00Z")));',
          '}',
        ]),
      };
    default:
      return {
        language: 'java',
        code: lines([
          'sealed interface PaymentResult permits PaymentAccepted, PaymentRejected {}',
          '',
          'record PaymentAccepted(String operationId) implements PaymentResult {}',
          'record PaymentRejected(String reason) implements PaymentResult {}',
          '',
          'String message = switch (result) {',
          '    case PaymentAccepted accepted -> "OK " + accepted.operationId();',
          '    case PaymentRejected rejected -> "ERROR " + rejected.reason();',
          '};',
        ]),
      };
  }
}

function dotnetSnippet(category) {
  switch (category) {
    case 'quality':
      return {
        language: 'csharp',
        code: lines([
          'public class PriceCalculatorTests',
          '{',
          '    [Fact]',
          '    public void AppliesDiscountWhenCustomerIsPremium()',
          '    {',
          '        var result = PriceCalculator.Calculate(basePrice: 100m, isPremium: true);',
          '        Assert.Equal(90m, result);',
          '    }',
          '}',
        ]),
      };
    default:
      return {
        language: 'csharp',
        code: lines([
          'app.MapPost("/orders", async (CreateOrderRequest request, OrdersDbContext db, CancellationToken ct) =>',
          '{',
          '    if (string.IsNullOrWhiteSpace(request.CustomerId))',
          '        return Results.ValidationProblem(new Dictionary<string, string[]>',
          '        {',
          '            ["customerId"] = ["El cliente es obligatorio."]',
          '        });',
          '',
          '    var order = new Order { CustomerId = request.CustomerId, Total = request.Total };',
          '    db.Orders.Add(order);',
          '    await db.SaveChangesAsync(ct);',
          '    return Results.Created($"/orders/{order.Id}", order);',
          '});',
        ]),
      };
    }
}

function razorSnippet() {
  return {
    language: 'cshtml',
    code: lines([
      '@model LoginViewModel',
      '',
      '<form asp-action="Login" method="post">',
      '  <div asp-validation-summary="ModelOnly"></div>',
      '  <label asp-for="Email"></label>',
      '  <input asp-for="Email" />',
      '  <span asp-validation-for="Email"></span>',
      '  <button type="submit">Entrar</button>',
      '</form>',
    ]),
  };
}

function winformsSnippet() {
  return {
    language: 'csharp',
    code: lines([
      'private async void saveButton_Click(object sender, EventArgs e)',
      '{',
      '    saveButton.Enabled = false;',
      '    try',
      '    {',
      '        await _customerService.SaveAsync(nameTextBox.Text, CancellationToken.None);',
      '        statusLabel.Text = "Guardado correctamente";',
      '    }',
      '    finally',
      '    {',
      '        saveButton.Enabled = true;',
      '    }',
      '}',
    ]),
  };
}

function buildCodeSnippet(context) {
  switch (context.technology) {
    case 'react':
      return reactSnippet(context.category);
    case 'angular':
      return angularSnippet(context.category);
    case 'vue':
      return vueSnippet(context.category);
    case 'javascript':
      return javascriptSnippet(context.category);
    case 'typescript':
      return typescriptSnippet(context.category);
    case 'nodejs':
      return nodeSnippet(context.category);
    case 'java':
      return javaSnippet(context.category);
    case 'dotnet':
      return dotnetSnippet(context.category);
    case 'razor':
      return razorSnippet();
    case 'winforms':
      return winformsSnippet();
    default:
      return javascriptSnippet(context.category);
  }
}

function buildCodeSection(context) {
  if (!context.requiresCode) return '';

  const snippet = buildCodeSnippet(context);
  const intro = pickVariant(
    [
      `Un ejemplo pequeño ayuda a ver dónde colocarías la lógica de ${lowerFirst(context.primaryLabel)} en "${context.cleanTitle}" y qué parte dejarías derivada o encapsulada.`,
      `No se trata de memorizar esta implementación, sino de enseñar cómo ordenar el flujo de ${lowerFirst(context.primaryLabel)} en ${context.technologyLabel} sin mezclar responsabilidades ni perder de vista ${lowerFirst(context.secondaryLabel)}.`,
      `Este fragmento sirve para bajar "${context.cleanTitle}" a código ejecutable y mostrar qué decisiones conviene hacer explícitas cuando ${lowerFirst(context.primaryLabel)} empieza a cruzarse con ${lowerFirst(context.secondaryLabel)}.`,
    ],
    `${context.file}-code-intro`,
  );

  const takeaway = pickVariant(
    [
      `Fíjate en que el ejemplo deja claras las fronteras de "${context.cleanTitle}", nombra los estados relevantes y evita trabajo implícito que luego cuesta depurar.`,
      `Lo importante no es la API concreta, sino que la solución hace visible la fuente de verdad, el tratamiento del error y el punto exacto donde ${lowerFirst(context.primaryLabel)} se sincroniza con ${lowerFirst(context.secondaryLabel)} dentro de "${context.cleanTitle}" en ${context.technologyLabel}.`,
      `En entrevista yo usaría un ejemplo de este tamaño para "${context.cleanTitle}": suficiente para demostrar criterio y lo bastante pequeño como para discutir riesgos y variantes sin perderse.`,
    ],
    `${context.file}-code-outro`,
  );

  return `${CODE_HEADING}\n${intro}\n\n\`\`\`${snippet.language}\n${snippet.code}\n\`\`\`\n\n${takeaway}`;
}

function buildBody(context) {
  const sections = [
    buildIntro(context),
    `${REQUIRED_HEADINGS[0]}\n${toSentenceList(evaluationBullets(context))}`,
    `${REQUIRED_HEADINGS[1]}\n${toSentenceList(answerBullets(context))}`,
    `${REQUIRED_HEADINGS[2]}\n${toSentenceList(tradeoffBullets(context))}`,
  ];

  const codeSection = buildCodeSection(context);
  if (codeSection) {
    sections.push(codeSection);
  }

  sections.push(`${REQUIRED_HEADINGS[3]}\n${buildCaseReal(context)}`);
  sections.push(`${REQUIRED_HEADINGS[4]}\n> ${buildSoundbite(context)}`);

  return sections.join('\n\n').trim();
}

let rewritten = 0;

for (const file of QUESTION_FILES) {
  const context = buildContext(file);
  if (!context) continue;

  const body = buildBody(context);
  const frontmatter = serializeQuestion({
    title: context.title,
    difficulty: context.difficulty,
    tags: context.tags,
    summary: buildSummary(context),
    lastReviewed: REVIEW_DATE,
    author: context.author,
    authorUrl: context.authorUrl,
  });

  const output = `${frontmatter}\n\n${normalizeWhitespace(body)}\n`;
  writeFileSync(file, output, 'utf8');
  rewritten += 1;
}

console.log(`Curadas ${rewritten} preguntas con la nueva plantilla editorial.`);
