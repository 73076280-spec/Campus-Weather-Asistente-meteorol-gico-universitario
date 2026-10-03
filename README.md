# Campus Weather — Asistente meteorológico universitario

Práctica calificada EP · Ingeniería de Software · Universidad Continental

## Datos de entrega

**Integrantes del equipo**

1. William Andree Rojas Zuñiga
2. _(completar)_
3. _(completar)_
4. _(completar)_

**Repositorio:** _(pegar aquí la ruta del repositorio)_

> Entregar este archivo en el aula virtual a más tardar 12 horas antes de la evaluación.

---

## 1. Problema que resuelve

Los estudiantes necesitan consultar rápidamente el clima de distintas ciudades para planificar actividades académicas, deportivas o viajes. La aplicación permite elegir una ciudad, consultar su clima y ver los resultados en una interfaz que se actualiza sin recargar la página.

## 2. Cómo ejecutarlo

No requiere instalación ni servidor. Abrir `index.html` en el navegador (necesita conexión a internet para consultar la API).

## 3. Estructura de archivos

```
campus-weather/
│
├── index.html          Estructura semántica y los 4 estados de pantalla
├── css/
│   └── estilos.css     Diseño, estados, tarjetas y responsive
└── js/
    └── app.js          Lógica: eventos, Fetch, Promesas y DOM
```

`app.js` está dividido en 8 secciones numeradas (configuración, estado, capa de datos, utilidades, interfaz, favoritas, flujo principal y eventos).

## 4. API utilizada

**Open-Meteo** (`https://api.open-meteo.com/v1/forecast`): pública y sin clave. Se piden: temperatura, humedad, viento y código de clima actuales, más máxima, mínima y código de clima diarios para 5 días.

## 5. Flujo general

```
Usuario selecciona ciudad          → addEventListener("change")
        ↓
JavaScript obtiene coordenadas     → buscarCiudad() + arreglo CIUDADES
        ↓
Se muestra "Consultando..."        → mostrarEstado("cargando")
        ↓
Fetch realiza la petición          → fetchConTiempoLimite()
        ↓
Promesa devuelve la respuesta      → .then(respuesta.json())
        ↓
Se procesan los datos              → procesarRespuesta()
        ↓
JavaScript actualiza el DOM        → pintarActual() / pintarPronostico()
        ↓
Se muestran resultados             → mostrarEstado("exito")
```

## 6. Requisitos funcionales

| Requisito | Dónde se cumple |
|---|---|
| RF01. Seleccionar una ciudad | `<select id="selectCiudad">`, opciones creadas por `poblarSelect()` |
| RF02. Consultar con Fetch | `fetchConTiempoLimite()` y `obtenerClima()` |
| RF03. Estado de carga | `mostrarEstado("cargando")` al inicio de `consultarCiudad()` |
| RF04. Resultados dinámicos en el DOM | `pintarActual()` y `pintarPronostico()` |
| RF05. Mensaje de error comprensible | `.catch()` → `mensajeDeError()` → `mostrarError()` |
| RF06. Agregar y quitar favoritas | `alternarFavorito()`, `quitarFavorito()`, `pintarFavoritos()` |
| RF07. Cambiar de ciudad sin recargar | evento `change` + `preventDefault()` en el formulario |

## 7. Requisitos técnicos

| Tecnología | Aplicación en el proyecto |
|---|---|
| HTML5 | `header`, `main`, `section`, `article`, `aside`, `dl`, `footer`; etiquetas `label` y `aria-live` |
| CSS3 | Variables, grid, flexbox, tarjeta que cambia de color por `data-grupo`, spinner, `@media` |
| JavaScript | Objeto `estado`, funciones pequeñas por responsabilidad, validaciones |
| DOM | `createElement`, `textContent`, `append`, `replaceChildren`, `hidden`, `dataset` |
| Callbacks | Manejadores de eventos, `forEach`, `map`, `filter`, `setTimeout` |
| Promesas | Cadena `.then().catch().finally()` |
| Fetch API | `fetch(url, { signal })` |
| Estados | Inicial (vacío), cargando, éxito y error |
| Errores | `.catch()`, `response.ok`, validación del JSON, tiempo límite con `AbortController` |

## 8. Evidencias a mostrar en la sustentación

- [ ] Selección de diferentes ciudades
- [ ] Consulta correcta a la API (pestaña Network de las herramientas del navegador)
- [ ] Estado de carga
- [ ] Presentación dinámica de resultados
- [ ] Manejo de errores (desconectar internet o cambiar `API_URL` por una dirección inválida)
- [ ] Agregar y eliminar favoritas
- [ ] Código donde se usa Fetch → `fetchConTiempoLimite()`
- [ ] Código donde se usan Promesas → cadena `.then()` en `obtenerClima()` y `consultarCiudad()`
- [ ] Código donde se usan callbacks → sección 8 de `app.js`
- [ ] Actualización de elementos del DOM → sección 5 de `app.js`

## 9. Preguntas técnicas

**¿Dónde se realiza la petición Fetch?**
En `fetchConTiempoLimite()` (`js/app.js`, sección 3), que es llamada desde `obtenerClima()`.

**¿Qué devuelve `fetch()`?**
Una Promesa que, cuando la red responde, se cumple con un objeto `Response`. Ese objeto tiene el estado HTTP y métodos como `.json()`, pero todavía no contiene los datos ya convertidos.

**¿Qué función procesa la respuesta?**
Primero `respuesta.json()` convierte el cuerpo a un objeto JavaScript; luego `procesarRespuesta()` lo transforma en un objeto simple con temperatura, humedad, viento, código de clima, fecha y pronóstico.

**¿Qué ocurre si la API no responde?**
`AbortController` cancela la petición a los 8 segundos (`TIEMPO_LIMITE_MS`). La Promesa se rechaza con un `AbortError`, el `.catch()` de `consultarCiudad()` lo recibe, `mensajeDeError()` lo traduce a un texto claro y `mostrarError()` lo muestra en pantalla con el botón «Reintentar».

**¿Dónde se utiliza un callback?**
En cada `addEventListener` (sección 8), por ejemplo el que recibe el evento `change` del `<select>`. También en `forEach`, `map`, `filter` y en el `setTimeout` del tiempo límite.

**¿Qué elemento del DOM se modifica para mostrar la temperatura?**
El `<span id="temperatura">`, mediante `el.temperatura.textContent` dentro de `pintarActual()`.

**¿Por qué es necesario mostrar un estado de carga?**
Porque la consulta es asíncrona y tarda un tiempo variable. Sin estado de carga la pantalla parecería congelada o mostraría datos viejos, y el usuario no sabría si la aplicación está funcionando.

**¿Qué modificación realizarías para agregar una nueva ciudad?**
Añadir un objeto al arreglo `CIUDADES` con `id`, `nombre`, `pais`, `lat` y `lon`. El `<select>` y las favoritas se actualizan solos porque se generan desde ese arreglo.

## 10. Ideas para la modificación en vivo

- Cambiar `DIAS_PRONOSTICO` de 5 a 7.
- Cambiar el texto de un botón o de un mensaje en `mensajeDeError()`.
- Mostrar la temperatura en °F (fórmula: `°C × 9/5 + 32`) dentro de `pintarActual()`.
- Agregar una ciudad nueva en `CIUDADES`.
- Cambiar `TIEMPO_LIMITE_MS` para provocar el error de tiempo agotado.
