# ¿Qué es Vue.js?

Vue.js es un framework progresivo de JavaScript para construir interfaces de usuario. Está diseñado para ser adoptado incrementalmente.

---

# ¿Qué es la Composition API?

La Composition API es una alternativa a la Options API introducida en Vue 3. Permite organizar el código lógico de un componente por funcionalidad.

```javascript
import { ref, computed, onMounted } from 'vue'

export default {
  setup() {
    const count = ref(0)
    const doubled = computed(() => count.value * 2)
    return { count, doubled }
  }
}
```

---

# ¿Qué es Vuex?

Vuex es la librería oficial de gestión de estado para Vue.js. En Vue 3, Pinia es la alternativa moderna recomendada.

---

# ¿Qué son los Composables en Vue 3?

Los Composables son funciones que usan la Composition API para encapsular y reutilizar lógica stateful.

```javascript
export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  const increment = () => count.value++
  return { count, increment }
}
```
