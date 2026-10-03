/* ==========================================================
   Campus Weather - Asistente meteorológico universitario
   ----------------------------------------------------------
   Índice del archivo:
     1. Configuración y datos fijos
     2. Estado de la aplicación y referencias al DOM
     3. Capa de datos: Fetch + Promesas (lo más importante)
     4. Utilidades de formato (fechas, códigos de clima)
     5. Capa de interfaz: actualizar el DOM
     6. Favoritas
     7. Flujo principal: consultarCiudad()
     8. Eventos (callbacks) e inicio

   Flujo general:
     Evento → callback → consultarCiudad() → fetch() → Promesa
       → procesarRespuesta() → funciones pintar...() → DOM
   ========================================================== */
"use strict";

/* ==========================================================
   1. CONFIGURACIÓN Y DATOS FIJOS
   ========================================================== */

// Endpoint de Open-Meteo (no necesita clave privada).
// Si en la sustentación piden "romper" la API, se cambia esta línea.
const API_URL = "https://api.open-meteo.com/v1/forecast";

const DIAS_PRONOSTICO = 5;       // cuántos días muestra el pronóstico
const TIEMPO_LIMITE_MS = 8000;   // si la API tarda más de 8 s, cancelamos

// Lista de ciudades disponibles. Para AGREGAR una ciudad nueva
// basta con añadir un objeto aquí: el <select> se genera desde este arreglo.
const CIUDADES = [
  { id: "huancayo",  nombre: "Huancayo",  pais: "Perú",     lat: -12.0651, lon: -75.2049 },
  { id: "lima",      nombre: "Lima",      pais: "Perú",     lat: -12.0464, lon: -77.0428 },
  { id: "cusco",     nombre: "Cusco",     pais: "Perú",     lat: -13.5319, lon: -71.9675 },
  { id: "arequipa",  nombre: "Arequipa",  pais: "Perú",     lat: -16.4090, lon: -71.5375 },
  { id: "trujillo",  nombre: "Trujillo",  pais: "Perú",     lat:  -8.1091, lon: -79.0215 },
  { id: "piura",     nombre: "Piura",     pais: "Perú",     lat:  -5.1945, lon: -80.6328 },
  { id: "iquitos",   nombre: "Iquitos",   pais: "Perú",     lat:  -3.7437, lon: -73.2516 },
  { id: "puno",      nombre: "Puno",      pais: "Perú",     lat: -15.8402, lon: -70.0219 },
  { id: "ayacucho",  nombre: "Ayacucho",  pais: "Perú",     lat: -13.1588, lon: -74.2239 },
  { id: "cajamarca", nombre: "Cajamarca", pais: "Perú",     lat:  -7.1638, lon: -78.5003 },
  { id: "bogota",    nombre: "Bogotá",    pais: "Colombia", lat:   4.7110, lon: -74.0721 },
  { id: "santiago",  nombre: "Santiago",  pais: "Chile",    lat: -33.4489, lon: -70.6693 }
];

// Open-Meteo devuelve el clima como un CÓDIGO numérico (estándar WMO).
// Este diccionario lo traduce a texto, emoji y "grupo" (el grupo decide
// el color de fondo de la tarjeta, ver estilos.css).
const CODIGOS_CLIMA = {
  0:  { texto: "Cielo despejado",          icono: "☀️", grupo: "despejado" },
  1:  { texto: "Mayormente despejado",     icono: "🌤️", grupo: "despejado" },
  2:  { texto: "Parcialmente nublado",     icono: "⛅", grupo: "nublado" },
  3:  { texto: "Nublado",                  icono: "☁️", grupo: "nublado" },
  45: { texto: "Niebla",                   icono: "🌫️", grupo: "nublado" },
  48: { texto: "Niebla con escarcha",      icono: "🌫️", grupo: "nublado" },
  51: { texto: "Llovizna ligera",          icono: "🌦️", grupo: "lluvia" },
  53: { texto: "Llovizna moderada",        icono: "🌦️", grupo: "lluvia" },
  55: { texto: "Llovizna intensa",         icono: "🌧️", grupo: "lluvia" },
  56: { texto: "Llovizna helada",          icono: "🌧️", grupo: "lluvia" },
  57: { texto: "Llovizna helada intensa",  icono: "🌧️", grupo: "lluvia" },
  61: { texto: "Lluvia ligera",            icono: "🌦️", grupo: "lluvia" },
  63: { texto: "Lluvia moderada",          icono: "🌧️", grupo: "lluvia" },
  65: { texto: "Lluvia fuerte",            icono: "🌧️", grupo: "lluvia" },
  66: { texto: "Lluvia helada",            icono: "🌧️", grupo: "lluvia" },
  67: { texto: "Lluvia helada fuerte",     icono: "🌧️", grupo: "lluvia" },
  71: { texto: "Nevada ligera",            icono: "🌨️", grupo: "nieve" },
  73: { texto: "Nevada moderada",          icono: "🌨️", grupo: "nieve" },
  75: { texto: "Nevada fuerte",            icono: "❄️", grupo: "nieve" },
  77: { texto: "Granos de nieve",          icono: "❄️", grupo: "nieve" },
  80: { texto: "Chubascos ligeros",        icono: "🌦️", grupo: "lluvia" },
  81: { texto: "Chubascos moderados",      icono: "🌧️", grupo: "lluvia" },
  82: { texto: "Chubascos violentos",      icono: "🌧️", grupo: "lluvia" },
  85: { texto: "Chubascos de nieve",       icono: "🌨️", grupo: "nieve" },
  86: { texto: "Chubascos de nieve fuertes", icono: "🌨️", grupo: "nieve" },
  95: { texto: "Tormenta eléctrica",       icono: "⛈️", grupo: "tormenta" },
  96: { texto: "Tormenta con granizo",     icono: "⛈️", grupo: "tormenta" },
  99: { texto: "Tormenta con granizo fuerte", icono: "⛈️", grupo: "tormenta" }
};

/* ==========================================================
   2. ESTADO DE LA APLICACIÓN Y REFERENCIAS AL DOM
   ========================================================== */

// Toda la información que cambia mientras se usa la app vive aquí.
const estado = {
  ciudadActual: null,   // objeto de CIUDADES elegido por el usuario
  favoritos: [],        // ids de las ciudades favoritas (solo en memoria = "temporal")
  numeroConsulta: 0     // contador para descartar respuestas viejas (ver sección 7)
};

// Guardamos las referencias una sola vez: buscar en el DOM es más lento
// que leer una variable, y el código queda más limpio.
const el = {
  formulario:      document.getElementById("formConsulta"),
  selectCiudad:    document.getElementById("selectCiudad"),
  btnFavorito:     document.getElementById("btnFavorito"),
  btnReintentar:   document.getElementById("btnReintentar"),
  zonaResultados:  document.getElementById("zonaResultados"),
  mensajeError:    document.getElementById("mensajeError"),
  tarjetaActual:   document.getElementById("tarjetaActual"),
  ciudadNombre:    document.getElementById("ciudadNombre"),
  fechaHora:       document.getElementById("fechaHora"),
  iconoClima:      document.getElementById("iconoClima"),
  temperatura:     document.getElementById("temperatura"),
  condicion:       document.getElementById("condicion"),
  humedad:         document.getElementById("humedad"),
  viento:          document.getElementById("viento"),
  pronostico:      document.getElementById("pronostico"),
  listaFavoritos:  document.getElementById("listaFavoritos"),
  favoritosVacio:  document.getElementById("favoritosVacio"),
  contador:        document.getElementById("contadorFavoritos")
};

// Los cuatro estados de la pantalla de resultados (uno visible a la vez).
const zonas = {
  inicial:  document.getElementById("estadoInicial"),
  cargando: document.getElementById("estadoCargando"),
  error:    document.getElementById("estadoError"),
  exito:    document.getElementById("resultado")
};

/* ==========================================================
   3. CAPA DE DATOS: FETCH + PROMESAS
   Esta sección no toca el DOM: solo pide y transforma datos.
   ========================================================== */

// Arma la URL con las coordenadas de la ciudad.
// URLSearchParams se encarga de escribir y codificar los parámetros (?a=1&b=2).
function construirUrl(ciudad) {
  const parametros = new URLSearchParams({
    latitude: ciudad.lat,
    longitude: ciudad.lon,
    current: "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "auto",                 // la API usa la hora local de la ciudad
    forecast_days: DIAS_PRONOSTICO
  });
  return `${API_URL}?${parametros.toString()}`;
}

// fetch() por sí solo NO tiene límite de tiempo: si la API no responde,
// la Promesa quedaría pendiente para siempre y el usuario vería
// "Consultando..." eternamente.
// Solución: AbortController permite CANCELAR la petición pasado un tiempo.
// Al cancelarse, la Promesa se rechaza con un error llamado "AbortError".
function fetchConTiempoLimite(url) {
  const controlador = new AbortController();

  // CALLBACK: la función flecha se ejecuta cuando pasen 8 segundos.
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_LIMITE_MS);

  return fetch(url, { signal: controlador.signal })
    // .finally() se ejecuta SIEMPRE (con éxito o con error):
    // así apagamos el temporizador y no cancelamos una petición ya terminada.
    .finally(() => clearTimeout(temporizador));
}

// Pide el clima y devuelve una Promesa con los datos YA procesados.
//
// Cómo leer la cadena de .then():
//   fetch()  → Promesa de un objeto Response (solo cabeceras y estado HTTP)
//   .then #1 → verifica el estado y pide leer el cuerpo como JSON
//   .then #2 → recibe el JSON ya convertido en objeto JavaScript
//
// Por eso fetch() "no devuelve los datos directamente": la red es lenta,
// así que devuelve una promesa de respuesta y JavaScript sigue trabajando.
function obtenerClima(ciudad) {
  const url = construirUrl(ciudad);

  return fetchConTiempoLimite(url)
    .then((respuesta) => {
      // OJO: fetch solo se rechaza por fallos de RED. Un error HTTP
      // (404, 500...) llega aquí como "éxito", por eso hay que revisarlo.
      if (!respuesta.ok) {
        throw new Error(`HTTP ${respuesta.status}`);
      }
      return respuesta.json();   // otra Promesa: leer el cuerpo también toma tiempo
    })
    .then((json) => procesarRespuesta(json));
}

// Convierte el JSON de la API en un objeto simple, propio de nuestra app.
// Así el resto del código no depende de los nombres raros de la API
// (temperature_2m, relative_humidity_2m...).
function procesarRespuesta(json) {
  // Validamos la forma de los datos antes de usarlos.
  if (!json || !json.current || !json.daily) {
    throw new Error("RESPUESTA_INVALIDA");
  }

  const { current, daily } = json;

  // La API entrega el pronóstico como columnas paralelas:
  //   daily.time = [d1, d2...], daily.temperature_2m_max = [t1, t2...]
  // .map() las junta en una lista de objetos, uno por día:
  //   [{ fecha, codigo, maxima, minima }, ...]
  // (la función que recibe .map es un CALLBACK)
  const pronostico = daily.time.map((fecha, i) => ({
    fecha: fecha,
    codigo: daily.weather_code[i],
    maxima: daily.temperature_2m_max[i],
    minima: daily.temperature_2m_min[i]
  }));

  return {
    temperatura: current.temperature_2m,
    humedad: current.relative_humidity_2m,
    viento: current.wind_speed_10m,
    codigo: current.weather_code,
    fechaHora: current.time,
    pronostico: pronostico
  };
}

/* ==========================================================
   4. UTILIDADES DE FORMATO
   ========================================================== */

// Busca el texto/icono/grupo de un código. Si la API enviara un código
// que no conocemos, devolvemos un valor por defecto en vez de romper la app.
function describirCodigo(codigo) {
  return CODIGOS_CLIMA[codigo] || { texto: "Condición desconocida", icono: "🌡️", grupo: "nublado" };
}

// "2026-09-29T14:15" → "martes, 29 de septiembre, 14:15"
// La API entrega la hora LOCAL de la ciudad, sin zona horaria. new Date()
// la interpreta como hora local del navegador y toLocaleString la escribe
// igual, así que se muestra la hora correcta de la ciudad consultada.
function formatearFechaHora(iso) {
  return new Date(iso).toLocaleString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// "2026-09-30" → "mié"
// TRUCO: new Date("2026-09-30") se interpreta como medianoche UTC, que en
// Perú (UTC-5) es el día ANTERIOR a las 19:00 → saldría el día equivocado.
// Agregar "T00:00:00" fuerza la interpretación en hora local.
function nombreDelDia(fechaISO, posicion) {
  if (posicion === 0) return "Hoy";
  return new Date(`${fechaISO}T00:00:00`).toLocaleDateString("es-PE", { weekday: "short" });
}

// Redondea a entero: 18.4 → 18
function redondear(numero) {
  return Math.round(numero);
}

/* ==========================================================
   5. CAPA DE INTERFAZ: ACTUALIZAR EL DOM
   ========================================================== */

// Crea un elemento con clase y texto en una sola línea.
// Se usa textContent (no innerHTML) para que ningún texto externo
// pueda insertar HTML o scripts en la página.
function crearElemento(etiqueta, clase, texto) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
}

// Muestra UNO de los cuatro estados y oculta los demás.
// nombre: "inicial" | "cargando" | "error" | "exito"
function mostrarEstado(nombre) {
  // Object.keys(zonas) = ["inicial", "cargando", "error", "exito"]
  // El callback de forEach se ejecuta una vez por cada nombre.
  Object.keys(zonas).forEach((clave) => {
    zonas[clave].hidden = clave !== nombre;
  });
  // Avisa a los lectores de pantalla que el contenido está cargando.
  el.zonaResultados.setAttribute("aria-busy", nombre === "cargando");
}

// Muestra un mensaje de error comprensible (RF05).
function mostrarError(mensaje, permitirReintento) {
  el.mensajeError.textContent = mensaje;
  el.btnReintentar.hidden = !permitirReintento;
  mostrarEstado("error");
}

// Traduce el error técnico a una frase que entienda cualquier usuario.
// Cada tipo de fallo llega de una forma distinta:
function mensajeDeError(error) {
  if (error.name === "AbortError") {
    return "El servicio tardó demasiado en responder. Inténtalo nuevamente en unos segundos.";
  }
  if (error.message.startsWith("HTTP")) {
    return `El servicio meteorológico respondió con un error (${error.message}). Inténtalo más tarde.`;
  }
  if (error.message === "RESPUESTA_INVALIDA") {
    return "El servicio devolvió datos incompletos. Inténtalo nuevamente.";
  }
  if (error.name === "TypeError") {
    // fetch lanza TypeError cuando no hay conexión o la URL es inalcanzable.
    return "No hay conexión con el servicio. Revisa tu internet e inténtalo de nuevo.";
  }
  return "Ocurrió un error inesperado. Inténtalo nuevamente.";
}

// Rellena la tarjeta del clima actual.
function pintarActual(ciudad, datos) {
  const info = describirCodigo(datos.codigo);

  el.ciudadNombre.textContent = `${ciudad.nombre}, ${ciudad.pais}`;
  el.fechaHora.textContent = formatearFechaHora(datos.fechaHora);
  el.iconoClima.textContent = info.icono;
  el.temperatura.textContent = redondear(datos.temperatura);   // ← elemento #temperatura
  el.condicion.textContent = info.texto;
  el.humedad.textContent = datos.humedad;
  el.viento.textContent = redondear(datos.viento);

  // dataset.grupo escribe el atributo data-grupo="..." del HTML,
  // y el CSS cambia el color de fondo según ese valor.
  el.tarjetaActual.dataset.grupo = info.grupo;
}

// Genera una tarjeta por cada día del pronóstico.
function pintarPronostico(dias) {
  el.pronostico.replaceChildren();   // vacía la lista anterior

  // CALLBACK: se ejecuta una vez por día, con el día y su posición (0, 1, 2...).
  dias.forEach((dia, posicion) => {
    const info = describirCodigo(dia.codigo);

    const item = crearElemento("li", "dia");
    item.append(
      crearElemento("p", "dia__nombre", nombreDelDia(dia.fecha, posicion)),
      crearElemento("p", "dia__icono", info.icono),
      crearElemento("p", "dia__temps"),
    );

    // La línea de temperaturas lleva dos partes con estilos distintos.
    const temps = item.querySelector(".dia__temps");
    temps.append(
      crearElemento("span", "dia__max", `${redondear(dia.maxima)}°`),
      document.createTextNode(" / "),
      crearElemento("span", "dia__min", `${redondear(dia.minima)}°`)
    );

    // Accesible: el emoji no se lee bien, así que describimos el día en texto.
    item.setAttribute("aria-label",
      `${nombreDelDia(dia.fecha, posicion)}: ${info.texto}, máxima ${redondear(dia.maxima)} grados, mínima ${redondear(dia.minima)} grados`);

    el.pronostico.append(item);
  });
}

/* ==========================================================
   6. FAVORITAS (RF06)
   Viven en el arreglo estado.favoritos, sin localStorage:
   al recargar la página se pierden (es lo que pide la guía).
   ========================================================== */

function esFavorita(id) {
  return estado.favoritos.includes(id);
}

// Agrega la ciudad si no está, y la quita si ya estaba.
function alternarFavorito() {
  const ciudad = estado.ciudadActual;
  if (!ciudad) return;

  if (esFavorita(ciudad.id)) {
    quitarFavorito(ciudad.id);
  } else {
    estado.favoritos.push(ciudad.id);
    pintarFavoritos();
  }
  actualizarBotonFavorito();
}

function quitarFavorito(id) {
  // filter() crea un arreglo nuevo SIN la ciudad indicada.
  estado.favoritos = estado.favoritos.filter((favId) => favId !== id);
  pintarFavoritos();
  actualizarBotonFavorito();
}

// El botón principal cambia de texto según la ciudad esté o no guardada.
function actualizarBotonFavorito() {
  const ciudad = estado.ciudadActual;

  if (!ciudad) {
    el.btnFavorito.disabled = true;
    el.btnFavorito.setAttribute("aria-pressed", "false");
    el.btnFavorito.textContent = "☆ Agregar a favoritos";
    return;
  }

  const guardada = esFavorita(ciudad.id);
  el.btnFavorito.disabled = false;
  el.btnFavorito.setAttribute("aria-pressed", guardada);
  el.btnFavorito.textContent = guardada ? "★ Quitar de favoritos" : "☆ Agregar a favoritos";
}

// Vuelve a dibujar toda la lista de favoritas.
function pintarFavoritos() {
  el.listaFavoritos.replaceChildren();
  el.contador.textContent = estado.favoritos.length;
  el.favoritosVacio.hidden = estado.favoritos.length > 0;

  estado.favoritos.forEach((id) => {
    const ciudad = buscarCiudad(id);

    const botonCiudad = crearElemento("button", "favorita__ciudad", ciudad.nombre);
    botonCiudad.type = "button";
    // CALLBACK: al pulsar el nombre, se consulta esa ciudad.
    botonCiudad.addEventListener("click", () => seleccionarCiudad(ciudad));

    const botonQuitar = crearElemento("button", "favorita__quitar", "✕");
    botonQuitar.type = "button";
    botonQuitar.setAttribute("aria-label", `Quitar ${ciudad.nombre} de favoritos`);
    // CALLBACK: al pulsar la ✕, se elimina de la lista.
    botonQuitar.addEventListener("click", () => quitarFavorito(id));

    const item = crearElemento("li", "favorita");
    item.append(botonCiudad, botonQuitar);
    el.listaFavoritos.append(item);
  });
}

/* ==========================================================
   7. FLUJO PRINCIPAL
   ========================================================== */

function buscarCiudad(id) {
  return CIUDADES.find((ciudad) => ciudad.id === id);
}

// Llena el <select> desde el arreglo CIUDADES (así hay un solo lugar donde editar).
function poblarSelect() {
  CIUDADES.forEach((ciudad) => {
    const opcion = document.createElement("option");
    opcion.value = ciudad.id;
    opcion.textContent = `${ciudad.nombre} (${ciudad.pais})`;
    el.selectCiudad.append(opcion);
  });
}

// Marca la ciudad como elegida (select + estado) y lanza la consulta.
function seleccionarCiudad(ciudad) {
  el.selectCiudad.value = ciudad.id;
  consultarCiudad(ciudad);
}

// FUNCIÓN CENTRAL: consulta el clima de una ciudad y actualiza la pantalla.
function consultarCiudad(ciudad) {
  estado.ciudadActual = ciudad;
  actualizarBotonFavorito();

  // --- PARTE DIFÍCIL: respuestas que llegan en desorden ---
  // Si el usuario elige Lima y enseguida Cusco, hay dos peticiones en vuelo.
  // Si la de Lima tarda más, terminaría DESPUÉS y pisaría el resultado de Cusco
  // (verías "Cusco" en el select pero datos de Lima).
  // Solución: cada consulta recibe un número; al terminar, solo la más
  // reciente puede actualizar la pantalla. Las demás se descartan.
  estado.numeroConsulta++;
  const miNumero = estado.numeroConsulta;

  mostrarEstado("cargando");                          // RF03

  obtenerClima(ciudad)                                // devuelve una Promesa
    .then((datos) => {                                // ← se ejecuta si TODO salió bien
      if (miNumero !== estado.numeroConsulta) return; // respuesta vieja: la ignoramos

      pintarActual(ciudad, datos);                    // RF04: se actualiza el DOM
      pintarPronostico(datos.pronostico);
      mostrarEstado("exito");
    })
    .catch((error) => {                               // ← se ejecuta si CUALQUIER paso falló
      if (miNumero !== estado.numeroConsulta) return;

      console.error("Error al consultar el clima:", error);
      mostrarError(mensajeDeError(error), true);      // RF05
    });
}

/* ==========================================================
   8. EVENTOS (CALLBACKS) E INICIO
   Un callback es una función que le entregamos a otra para que
   la ejecute más tarde. Aquí, el navegador ejecuta cada una
   cuando ocurre el evento indicado.
   ========================================================== */

// Al cambiar la ciudad en el <select>: consulta sin recargar la página (RF07).
el.selectCiudad.addEventListener("change", () => {
  consultarCiudad(buscarCiudad(el.selectCiudad.value));
});

// Al enviar el formulario (botón "Consultar clima" o tecla Enter).
el.formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();   // evita que el formulario recargue la página

  // Validación: hay que haber elegido una ciudad.
  if (!el.selectCiudad.value) {
    estado.ciudadActual = null;
    mostrarError("Primero selecciona una ciudad de la lista.", false);
    return;
  }
  consultarCiudad(buscarCiudad(el.selectCiudad.value));
});

el.btnFavorito.addEventListener("click", alternarFavorito);

el.btnReintentar.addEventListener("click", () => {
  if (estado.ciudadActual) consultarCiudad(estado.ciudadActual);
});

// Estado inicial de la pantalla.
poblarSelect();
pintarFavoritos();
actualizarBotonFavorito();
mostrarEstado("inicial");
