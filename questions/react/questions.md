# ¿Qué es React?

React es una biblioteca de JavaScript de código abierto para construir interfaces de usuario, desarrollada por Meta (Facebook). Se basa en componentes reutilizables y el concepto de DOM virtual para actualizar la UI de manera eficiente.

Sus características principales son: componentes, JSX, estado (state), props, hooks, context API y reconciliación mediante el DOM virtual.

---

# ¿Qué hace el hook useEffect?

`useEffect` es un hook de React que permite realizar efectos secundarios en componentes funcionales. Se ejecuta después de cada renderizado por defecto.

```javascript
useEffect(() => {
  const subscription = someService.subscribe();
  return () => subscription.unsubscribe();
}, [dependency]);
```

---

# ¿Qué es el Virtual DOM?

El Virtual DOM es una representación en memoria del DOM real. React usa esta representación para calcular los cambios mínimos necesarios antes de actualizar el DOM real.

---

# ¿Qué son los React Hooks?

Los Hooks son funciones especiales que permiten usar características de React en componentes funcionales.

Hooks más importantes: useState, useEffect, useContext, useReducer, useMemo, useCallback, useRef.

---

# ¿Qué es el Context API?

Context API es una forma de compartir datos entre componentes sin necesidad de pasar props manualmente en cada nivel del árbol.

```javascript
const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Children />
    </ThemeContext.Provider>
  );
}
```

---

# ¿Qué es Redux y cuándo usarlo?

Redux es una librería de gestión de estado predecible. Centraliza el estado de la aplicación en un único store y actualiza ese estado mediante acciones y reducers puros.
