# ¿Qué es TypeScript?

TypeScript es un superconjunto tipado de JavaScript desarrollado por Microsoft. Añade tipado estático opcional.

---

# ¿Qué son los Generics en TypeScript?

Los Generics permiten crear componentes que pueden trabajar con múltiples tipos.

```typescript
function identity<T>(arg: T): T {
  return arg;
}

interface ApiResponse<T> {
  data: T;
  status: number;
}
```

---

# ¿Qué son los Utility Types en TypeScript?

Los Utility Types son tipos genéricos built-in que transforman tipos existentes.

```typescript
type UserWithoutPassword = Omit<User, 'password'>;
type PartialUser = Partial<User>;
type ReadonlyUser = Readonly<User>;
```

---

# ¿Qué es la diferencia entre interface y type en TypeScript?

Tanto `interface` como `type` permiten definir la forma de un objeto, pero tienen diferencias clave.

Regla general: usa `interface` para objetos, usa `type` para unions e intersections.

---

# ¿Qué es el decorador en TypeScript?

Los decoradores son una característica que permite modificar clases, métodos, propiedades en tiempo de declaración.
