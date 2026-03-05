# ¿Qué es Angular?

Angular es un framework de desarrollo web de código abierto basado en TypeScript, mantenido por Google. Permite construir aplicaciones web de una sola página (SPA) y aplicaciones web progresivas (PWA) con una arquitectura basada en componentes, servicios e inyección de dependencias.

Sus principales características incluyen: sistema de módulos, enlace de datos bidireccional (two-way data binding), inyección de dependencias, directivas, pipes, servicios, routing y soporte para SSR con Angular Universal.

---

# ¿Qué es Change Detection en Angular?

Change Detection es el mecanismo que Angular usa para detectar cambios en el estado de la aplicación y actualizar la vista (DOM) en consecuencia.

Angular usa un árbol de detectores de cambios (ChangeDetectorRef) que se ejecutan de arriba hacia abajo. Hay dos estrategias:

- **Default**: Angular verifica todos los componentes del árbol en cada ciclo de detección
- **OnPush**: Angular solo verifica el componente cuando sus inputs cambian, se emite un evento, o se marca manualmente

Con la introducción de Signals en Angular 16+, la detección de cambios se vuelve más granular y eficiente.

---

# ¿Qué son los Signals en Angular?

Los Signals son una nueva primitiva reactiva introducida en Angular 16 que permite gestionar el estado de forma reactiva y granular.

Un Signal es un wrapper alrededor de un valor que notifica a los consumidores interesados cuando ese valor cambia.

```typescript
import { signal, computed, effect } from '@angular/core';

const count = signal(0);
const doubled = computed(() => count() * 2);

effect(() => {
  console.log(`Count is: ${count()}`);
});

count.set(5); // triggers effect and recomputes doubled
```

Los Signals mejoran el rendimiento porque permiten una detección de cambios más fina sin necesidad de Zone.js.

---

# ¿Qué es la inyección de dependencias en Angular?

La Inyección de Dependencias (DI) es un patrón de diseño en el que los objetos reciben sus dependencias en lugar de crearlas ellos mismos. Angular tiene un sistema de DI integrado.

```typescript
@Injectable({ providedIn: 'root' })
export class UserService {
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');
  }
  constructor(private http: HttpClient) {}
}

@Component({...})
export class UserComponent {
  constructor(private userService: UserService) {}
}
```

El sistema de DI de Angular usa un árbol de injectors que siguen la jerarquía de componentes.

---

# ¿Qué son los Standalone Components?

Los Standalone Components son componentes que no pertenecen a ningún NgModule. Introducidos en Angular 14 y estables desde Angular 15, permiten una arquitectura más simple y modular.

```typescript
@Component({
  standalone: true,
  selector: 'app-hero',
  imports: [CommonModule, RouterLink],
  template: `<h1>{{ hero.name }}</h1>`
})
export class HeroComponent {
  @Input() hero!: Hero;
}
```

Los Standalone Components facilitan el lazy loading, tree shaking y simplifican la estructura del proyecto.

---

# ¿Qué es Angular SSR (Server Side Rendering)?

Angular SSR (anteriormente Angular Universal) permite renderizar aplicaciones Angular en el servidor en lugar de solo en el navegador.

Beneficios:
- **SEO mejorado**: Los crawlers de motores de búsqueda pueden indexar el contenido
- **Mejor rendimiento percibido**: El usuario ve contenido antes de que JavaScript cargue
- **Compatibilidad con redes lentas**: Funciona mejor en conexiones lentas
- **Social sharing**: Previsualización correcta en redes sociales

---

# ¿Qué es el RxJS y cómo se usa en Angular?

RxJS (Reactive Extensions for JavaScript) es una librería para programación reactiva usando Observables. Angular lo usa extensivamente para manejar operaciones asíncronas.

```typescript
import { Observable, from } from 'rxjs';
import { map, filter, debounceTime } from 'rxjs/operators';

// HTTP requests
this.http.get<User[]>('/api/users').pipe(
  map(users => users.filter(u => u.active)),
  catchError(err => of([]))
).subscribe(users => this.users = users);
```

---

# ¿Qué es el módulo HttpClient en Angular?

HttpClient es el cliente HTTP de Angular para hacer peticiones HTTP. Es un wrapper sobre el API Fetch del navegador que devuelve Observables.

```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}
  
  getData(): Observable<Data[]> {
    return this.http.get<Data[]>('/api/data');
  }
}
```

---

# ¿Qué es el Angular Router?

El Angular Router es el sistema de navegación que permite crear aplicaciones SPA con múltiples vistas. Mapea URLs a componentes.

```typescript
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { 
    path: 'users', 
    loadComponent: () => import('./users/users.component').then(m => m.UsersComponent) 
  },
  { path: '**', redirectTo: '' }
];
```

Soporta lazy loading, guards, resolvers, child routes y query params.

---

# ¿Qué son los Pipes en Angular?

Los Pipes son transformadores de datos en las plantillas Angular. Transforman valores de visualización sin modificar el dato original.

```typescript
// Pipe personalizado
@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit: number = 100): string {
    return value.length > limit ? value.slice(0, limit) + '...' : value;
  }
}
```
