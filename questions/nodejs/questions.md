# ¿Qué es Node.js?

Node.js es un entorno de ejecución de JavaScript del lado del servidor basado en el motor V8 de Chrome.

---

# ¿Qué es el Event Loop en Node.js?

El Event Loop es el mecanismo que permite a Node.js realizar operaciones I/O no bloqueantes, aunque JavaScript sea single-threaded.

---

# ¿Qué es Express.js?

Express.js es el framework web más popular para Node.js. Proporciona una capa de abstracción sobre el módulo HTTP.

```javascript
const express = require('express');
const app = express();

app.get('/users', async (req, res) => {
  res.json([]);
});

app.listen(3000);
```

---

# ¿Qué es el módulo fs en Node.js?

El módulo `fs` permite interactuar con el sistema de archivos del sistema operativo.

---

# ¿Qué son los Streams en Node.js?

Los Streams son colecciones de datos que pueden no estar disponibles de una vez y no tienen que caber en memoria.
