"use strict";

/* =========================
   CONFIGURACIÓN
========================= */

const API_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const DIAS_PRONOSTICO = 5;
const TIEMPO_LIMITE_MS = 8000;

const CIUDADES = [
  { id: "huancayo", nombre: "Huancayo", pais: "Perú", lat: -12.0651, lon: -75.2049 },
  { id: "lima", nombre: "Lima", pais: "Perú", lat: -12.0464, lon: -77.0428 },
  { id: "cusco", nombre: "Cusco", pais: "Perú", lat: -13.5319, lon: -71.9675 },
  { id: "arequipa", nombre: "Arequipa", pais: "Perú", lat: -16.409, lon: -71.5375 },
  { id: "trujillo", nombre: "Trujillo", pais: "Perú", lat: -8.1091, lon: -79.0215 },
  { id: "piura", nombre: "Piura", pais: "Perú", lat: -5.1945, lon: -80.6328 },
  { id: "iquitos", nombre: "Iquitos", pais: "Perú", lat: -3.7437, lon: -73.2516 },
  { id: "puno", nombre: "Puno", pais: "Perú", lat: -15.8402, lon: -70.0219 },
  { id: "ayacucho", nombre: "Ayacucho", pais: "Perú", lat: -13.1588, lon: -74.2239 },
  { id: "cajamarca", nombre: "Cajamarca", pais: "Perú", lat: -7.1638, lon: -78.5003 },
  { id: "bogota", nombre: "Bogotá", pais: "Colombia", lat: 4.711, lon: -74.0721 },
  { id: "santiago", nombre: "Santiago", pais: "Chile", lat: -33.4489, lon: -70.6693 }
];

const CODIGOS_CLIMA = {
  0: { texto: "Cielo despejado", icono: "☀️", grupo: "despejado" },
  1: { texto: "Mayormente despejado", icono: "🌤️", grupo: "despejado" },
  2: { texto: "Parcialmente nublado", icono: "⛅", grupo: "nublado" },
  3: { texto: "Nublado", icono: "☁️", grupo: "nublado" },
  45: { texto: "Niebla", icono: "🌫️", grupo: "nublado" },
  48: { texto: "Niebla con escarcha", icono: "🌫️", grupo: "nublado" },
  51: { texto: "Llovizna ligera", icono: "🌦️", grupo: "lluvia" },
  53: { texto: "Llovizna moderada", icono: "🌦️", grupo: "lluvia" },
  55: { texto: "Llovizna intensa", icono: "🌧️", grupo: "lluvia" },
  61: { texto: "Lluvia ligera", icono: "🌦️", grupo: "lluvia" },
  63: { texto: "Lluvia moderada", icono: "🌧️", grupo: "lluvia" },
  65: { texto: "Lluvia fuerte", icono: "🌧️", grupo: "lluvia" },
  71: { texto: "Nevada ligera", icono: "🌨️", grupo: "nieve" },
  73: { texto: "Nevada moderada", icono: "🌨️", grupo: "nieve" },
  75: { texto: "Nevada fuerte", icono: "❄️", grupo: "nieve" },
  80: { texto: "Chubascos ligeros", icono: "🌦️", grupo: "lluvia" },
  81: { texto: "Chubascos moderados", icono: "🌧️", grupo: "lluvia" },
  82: { texto: "Chubascos fuertes", icono: "🌧️", grupo: "lluvia" },
  95: { texto: "Tormenta eléctrica", icono: "⛈️", grupo: "tormenta" },
  96: { texto: "Tormenta con granizo", icono: "⛈️", grupo: "tormenta" },
  99: { texto: "Tormenta fuerte", icono: "⛈️", grupo: "tormenta" }
};

/* =========================
   ESTADO Y REFERENCIAS DOM
========================= */

const estado = {
  ciudadActual: null,
  favoritos: JSON.parse(localStorage.getItem("campusFavoritos")) || [],
  ciudadesAgregadas: JSON.parse(localStorage.getItem("campusCiudades")) || [],
  numeroConsulta: 0,
  unidad: "C",
  ultimaRespuesta: null
};

const el = {
  formulario: document.getElementById("formConsulta"),
  selectCiudad: document.getElementById("selectCiudad"),
  btnFavorito: document.getElementById("btnFavorito"),
  btnReintentar: document.getElementById("btnReintentar"),
  btnUbicacion: document.getElementById("btnUbicacion"),
  btnActualizar: document.getElementById("btnActualizar"),
  btnUnidad: document.getElementById("btnUnidad"),
  indicadorConexion: document.getElementById("indicadorConexion"),
  formAgregarCiudad: document.getElementById("formAgregarCiudad"),
  inputNuevaCiudad: document.getElementById("inputNuevaCiudad"),
  mensajeNuevaCiudad: document.getElementById("mensajeNuevaCiudad"),
  zonaResultados: document.getElementById("zonaResultados"),
  mensajeError: document.getElementById("mensajeError"),
  tarjetaActual: document.getElementById("tarjetaActual"),
  ciudadNombre: document.getElementById("ciudadNombre"),
  fechaHora: document.getElementById("fechaHora"),
  iconoClima: document.getElementById("iconoClima"),
  temperatura: document.getElementById("temperatura"),
  condicion: document.getElementById("condicion"),
  humedad: document.getElementById("humedad"),
  viento: document.getElementById("viento"),
  recomendacion: document.getElementById("recomendacion"),
  ultimaActualizacion: document.getElementById("ultimaActualizacion"),
  pronostico: document.getElementById("pronostico"),
  listaFavoritos: document.getElementById("listaFavoritos"),
  favoritosVacio: document.getElementById("favoritosVacio"),
  contador: document.getElementById("contadorFavoritos")
};

const zonas = {
  inicial: document.getElementById("estadoInicial"),
  cargando: document.getElementById("estadoCargando"),
  error: document.getElementById("estadoError"),
  exito: document.getElementById("resultado")
};

/* =========================
   FUNCIONES GENERALES
========================= */

function todasLasCiudades() {
  return [...CIUDADES, ...estado.ciudadesAgregadas];
}

function buscarCiudad(id) {
  return todasLasCiudades().find((ciudad) => ciudad.id === id);
}

function crearElemento(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);

  if (clase) elemento.className = clase;
  if (texto !== undefined) elemento.textContent = texto;

  return elemento;
}

function redondear(numero) {
  return Math.round(numero);
}

function describirCodigo(codigo) {
  return CODIGOS_CLIMA[codigo] || {
    texto: "Condición desconocida",
    icono: "🌡️",
    grupo: "nublado"
  };
}

function mostrarEstado(nombre) {
  Object.entries(zonas).forEach(([clave, elemento]) => {
    elemento.hidden = clave !== nombre;
  });

  el.zonaResultados.setAttribute(
    "aria-busy",
    nombre === "cargando"
  );
}

/* =========================
   CONEXIÓN
========================= */

function actualizarIndicadorConexion() {
  const conectado = navigator.onLine;

  el.indicadorConexion.className = conectado
    ? "indicador-conexion conectado"
    : "indicador-conexion desconectado";

  el.indicadorConexion.textContent = conectado
    ? "🟢 Conectado a Internet"
    : "🔴 Sin conexión a Internet";
}

window.addEventListener("online", actualizarIndicadorConexion);
window.addEventListener("offline", actualizarIndicadorConexion);

/* =========================
   API DEL CLIMA
========================= */

function construirUrl(ciudad) {
  const parametros = new URLSearchParams({
    latitude: ciudad.lat,
    longitude: ciudad.lon,
    current:
      "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "auto",
    forecast_days: DIAS_PRONOSTICO
  });

  return `${API_URL}?${parametros.toString()}`;
}

function fetchConTiempoLimite(url) {
  const controlador = new AbortController();

  const temporizador = setTimeout(
    () => controlador.abort(),
    TIEMPO_LIMITE_MS
  );

  return fetch(url, {
    signal: controlador.signal
  }).finally(() => {
    clearTimeout(temporizador);
  });
}

function obtenerClima(ciudad) {
  return fetchConTiempoLimite(construirUrl(ciudad))
    .then((respuesta) => {
      if (!respuesta.ok) {
        throw new Error(`HTTP ${respuesta.status}`);
      }

      return respuesta.json();
    })
    .then((json) => {
      if (!json.current || !json.daily) {
        throw new Error("RESPUESTA_INVALIDA");
      }

      const pronostico = json.daily.time.map((fecha, indice) => ({
        fecha,
        codigo: json.daily.weather_code[indice],
        maxima: json.daily.temperature_2m_max[indice],
        minima: json.daily.temperature_2m_min[indice]
      }));

      return {
        temperatura: json.current.temperature_2m,
        humedad: json.current.relative_humidity_2m,
        viento: json.current.wind_speed_10m,
        codigo: json.current.weather_code,
        fechaHora: json.current.time,
        pronostico
      };
    });
}

/* =========================
   AGREGAR CIUDADES DESDE LA APP
========================= */

function obtenerCiudadPorGeocodificacion(nombre) {
  const parametros = new URLSearchParams({
    name: nombre,
    count: 1,
    language: "es",
    format: "json"
  });

  return fetch(`${GEOCODING_URL}?${parametros.toString()}`)
    .then((respuesta) => {
      if (!respuesta.ok) {
        throw new Error("GEOCODIFICACION");
      }

      return respuesta.json();
    })
    .then((datos) => {
      if (!datos.results || datos.results.length === 0) {
        throw new Error("CIUDAD_NO_ENCONTRADA");
      }

      const resultado = datos.results[0];

      return {
        id: `agregada-${resultado.latitude}-${resultado.longitude}`,
        nombre: resultado.name,
        pais: resultado.country || "Sin país",
        lat: resultado.latitude,
        lon: resultado.longitude
      };
    });
}

function mostrarMensajeNuevaCiudad(mensaje, tipo = "") {
  el.mensajeNuevaCiudad.textContent = mensaje;
  el.mensajeNuevaCiudad.className =
    `mensaje-nueva-ciudad ${tipo}`;
}

function agregarCiudadAlSelector(ciudad) {
  const opcionExistente = [...el.selectCiudad.options].find(
    (opcion) => opcion.value === ciudad.id
  );

  if (!opcionExistente) {
    const opcion = document.createElement("option");

    opcion.value = ciudad.id;
    opcion.textContent =
      `${ciudad.nombre} (${ciudad.pais})`;

    el.selectCiudad.append(opcion);
  }
}

function agregarCiudadDesdeFormulario(evento) {
  evento.preventDefault();

  const nombre = el.inputNuevaCiudad.value.trim();

  if (!nombre) {
    mostrarMensajeNuevaCiudad(
      "Escribe el nombre de una ciudad.",
      "mensaje-error"
    );
    return;
  }

  mostrarMensajeNuevaCiudad(
    "Buscando la ciudad...",
    "mensaje-cargando"
  );

  obtenerCiudadPorGeocodificacion(nombre)
    .then((ciudad) => {
      const yaExiste = todasLasCiudades().some(
        (item) =>
          item.nombre.toLowerCase() ===
          ciudad.nombre.toLowerCase()
      );

      if (yaExiste) {
        mostrarMensajeNuevaCiudad(
          "Esa ciudad ya está registrada.",
          "mensaje-error"
        );
        return;
      }

      estado.ciudadesAgregadas.push(ciudad);

      localStorage.setItem(
        "campusCiudades",
        JSON.stringify(estado.ciudadesAgregadas)
      );

      agregarCiudadAlSelector(ciudad);

      el.inputNuevaCiudad.value = "";

      mostrarMensajeNuevaCiudad(
        `${ciudad.nombre} fue agregada correctamente.`,
        "mensaje-exito"
      );

      el.selectCiudad.value = ciudad.id;
      consultarCiudad(ciudad);
    })
    .catch((error) => {
      if (error.message === "CIUDAD_NO_ENCONTRADA") {
        mostrarMensajeNuevaCiudad(
          "No encontramos esa ciudad.",
          "mensaje-error"
        );
      } else {
        mostrarMensajeNuevaCiudad(
          "No se pudo agregar la ciudad. Revisa tu conexión.",
          "mensaje-error"
        );
      }
    });
}

/* =========================
   ERRORES
========================= */

function mensajeDeError(error) {
  if (error.name === "AbortError") {
    return "El servicio tardó demasiado en responder.";
  }

  if (error.message.startsWith("HTTP")) {
    return `El servicio respondió con un error (${error.message}).`;
  }

  if (error.message === "RESPUESTA_INVALIDA") {
    return "El servicio devolvió datos incompletos.";
  }

  if (error.name === "TypeError") {
    return "No hay conexión con el servicio meteorológico.";
  }

  return "Ocurrió un error inesperado.";
}

function mostrarError(mensaje, permitirReintento) {
  el.mensajeError.textContent = mensaje;
  el.btnReintentar.hidden = !permitirReintento;
  mostrarEstado("error");
}

/* =========================
   CLIMA Y TEMPERATURA
========================= */

function convertirTemperatura(valor) {
  if (estado.unidad === "C") {
    return redondear(valor);
  }

  return redondear((valor * 9) / 5 + 32);
}

function obtenerRecomendacion(codigo) {
  if ([0, 1].includes(codigo)) {
    return "☀️ Buen momento para actividades al aire libre.";
  }

  if ([2, 3, 45, 48].includes(codigo)) {
    return "⛅ El cielo está nublado. Lleva una prenda ligera.";
  }

  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(codigo)) {
    return "🌧️ Lleva un paraguas porque puede llover.";
  }

  if ([95, 96, 99].includes(codigo)) {
    return "⛈️ Evita actividades al aire libre por la tormenta.";
  }

  if ([71, 73, 75].includes(codigo)) {
    return "❄️ Hace frío. Usa ropa abrigadora.";
  }

  return "🌡️ Revisa las condiciones meteorológicas.";
}

function formatearFechaHora(fecha) {
  return new Date(fecha).toLocaleString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function nombreDelDia(fecha, posicion) {
  if (posicion === 0) return "Hoy";

  return new Date(`${fecha}T00:00:00`).toLocaleDateString(
    "es-PE",
    { weekday: "short" }
  );
}

/* =========================
   PINTAR INFORMACIÓN
========================= */

function pintarActual(ciudad, datos) {
  const informacion = describirCodigo(datos.codigo);
  const unidad = estado.unidad === "C" ? "°C" : "°F";

  el.ciudadNombre.textContent =
    `${ciudad.nombre}, ${ciudad.pais}`;

  el.fechaHora.textContent =
    formatearFechaHora(datos.fechaHora);

  el.iconoClima.textContent = informacion.icono;

  el.temperatura.textContent =
    convertirTemperatura(datos.temperatura);

  el.condicion.textContent = informacion.texto;
  el.humedad.textContent = datos.humedad;
  el.viento.textContent = redondear(datos.viento);

  document.querySelectorAll(".actual__unidad").forEach((elemento) => {
    elemento.textContent = unidad;
  });

  el.recomendacion.textContent =
    obtenerRecomendacion(datos.codigo);

  el.ultimaActualizacion.textContent =
    `Última actualización: ${new Date().toLocaleString("es-PE")}`;

  el.tarjetaActual.dataset.grupo = informacion.grupo;
}

function pintarPronostico(dias) {
  el.pronostico.replaceChildren();

  dias.forEach((dia, posicion) => {
    const informacion = describirCodigo(dia.codigo);
    const item = crearElemento("li", "dia");

    item.append(
      crearElemento(
        "p",
        "dia__nombre",
        nombreDelDia(dia.fecha, posicion)
      ),
      crearElemento(
        "p",
        "dia__icono",
        informacion.icono
      ),
      crearElemento("p", "dia__temps")
    );

    const temperaturas = item.querySelector(".dia__temps");

    temperaturas.append(
      crearElemento(
        "span",
        "dia__max",
        `${convertirTemperatura(dia.maxima)}°`
      ),
      document.createTextNode(" / "),
      crearElemento(
        "span",
        "dia__min",
        `${convertirTemperatura(dia.minima)}°`
      )
    );

    el.pronostico.append(item);
  });
}

/* =========================
   FAVORITOS
========================= */

function guardarFavoritos() {
  localStorage.setItem(
    "campusFavoritos",
    JSON.stringify(estado.favoritos)
  );
}

function esFavorita(id) {
  return estado.favoritos.includes(id);
}

function pintarFavoritos() {
  el.listaFavoritos.replaceChildren();

  el.contador.textContent = estado.favoritos.length;
  el.favoritosVacio.hidden =
    estado.favoritos.length > 0;

  estado.favoritos.forEach((id) => {
    const ciudad = buscarCiudad(id);

    if (!ciudad) return;

    const botonCiudad = crearElemento(
      "button",
      "favorita__ciudad",
      ciudad.nombre
    );

    botonCiudad.type = "button";

    botonCiudad.addEventListener("click", () => {
      seleccionarCiudad(ciudad);
    });

    const botonQuitar = crearElemento(
      "button",
      "favorita__quitar",
      "✕"
    );

    botonQuitar.type = "button";

    botonQuitar.setAttribute(
      "aria-label",
      `Quitar ${ciudad.nombre} de favoritos`
    );

    botonQuitar.addEventListener("click", () => {
      quitarFavorito(id);
    });

    const item = crearElemento("li", "favorita");

    item.append(botonCiudad, botonQuitar);
    el.listaFavoritos.append(item);
  });
}

function actualizarBotonFavorito() {
  const ciudad = estado.ciudadActual;

  if (!ciudad || ciudad.id === "mi-ubicacion") {
    el.btnFavorito.disabled = true;
    el.btnFavorito.textContent =
      "☆ Agregar a favoritos";
    return;
  }

  const guardada = esFavorita(ciudad.id);

  el.btnFavorito.disabled = false;
  el.btnFavorito.setAttribute(
    "aria-pressed",
    guardada
  );

  el.btnFavorito.textContent = guardada
    ? "★ Quitar de favoritos"
    : "☆ Agregar a favoritos";
}

function alternarFavorito() {
  const ciudad = estado.ciudadActual;

  if (!ciudad || ciudad.id === "mi-ubicacion") return;

  if (esFavorita(ciudad.id)) {
    quitarFavorito(ciudad.id);
  } else {
    estado.favoritos.push(ciudad.id);
    guardarFavoritos();
    pintarFavoritos();
    actualizarBotonFavorito();
  }
}

function quitarFavorito(id) {
  estado.favoritos = estado.favoritos.filter(
    (favorito) => favorito !== id
  );

  guardarFavoritos();
  pintarFavoritos();
  actualizarBotonFavorito();
}

/* =========================
   CONSULTA PRINCIPAL
========================= */

function poblarSelect() {
  el.selectCiudad.innerHTML =
    `<option value="" disabled selected>
      Selecciona una ciudad
    </option>`;

  todasLasCiudades().forEach((ciudad) => {
    agregarCiudadAlSelector(ciudad);
  });
}

function seleccionarCiudad(ciudad) {
  if (!ciudad) return;

  if (ciudad.id !== "mi-ubicacion") {
    el.selectCiudad.value = ciudad.id;
  }

  consultarCiudad(ciudad);
}

function consultarCiudad(ciudad) {
  if (!ciudad) return;

  estado.ciudadActual = ciudad;
  estado.numeroConsulta += 1;

  const numeroActual = estado.numeroConsulta;

  actualizarBotonFavorito();
  mostrarEstado("cargando");

  obtenerClima(ciudad)
    .then((datos) => {
      if (numeroActual !== estado.numeroConsulta) return;

      estado.ultimaRespuesta = datos;

      pintarActual(ciudad, datos);
      pintarPronostico(datos.pronostico);

      el.btnActualizar.disabled = false;

      mostrarEstado("exito");
    })
    .catch((error) => {
      if (numeroActual !== estado.numeroConsulta) return;

      console.error("Error al consultar el clima:", error);

      mostrarError(mensajeDeError(error), true);
    });
}

/* =========================
   UBICACIÓN DEL USUARIO
========================= */

function usarMiUbicacion() {
  if (!navigator.geolocation) {
    mostrarError(
      "Tu navegador no permite obtener la ubicación.",
      false
    );
    return;
  }

  mostrarEstado("cargando");

  navigator.geolocation.getCurrentPosition(
    (posicion) => {
      const ciudad = {
        id: "mi-ubicacion",
        nombre: "Mi ubicación",
        pais: "Ubicación actual",
        lat: posicion.coords.latitude,
        lon: posicion.coords.longitude
      };

      consultarCiudad(ciudad);
    },
    () => {
      mostrarError(
        "No se pudo obtener tu ubicación. Revisa los permisos.",
        false
      );
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    }
  );
}

/* =========================
   ACTUALIZACIÓN Y UNIDADES
========================= */

function actualizarClima() {
  if (estado.ciudadActual) {
    consultarCiudad(estado.ciudadActual);
  }
}

function cambiarUnidad() {
  estado.unidad = estado.unidad === "C" ? "F" : "C";

  if (estado.ultimaRespuesta && estado.ciudadActual) {
    pintarActual(
      estado.ciudadActual,
      estado.ultimaRespuesta
    );

    pintarPronostico(
      estado.ultimaRespuesta.pronostico
    );
  }
}

/* =========================
   EVENTOS
========================= */

el.selectCiudad.addEventListener("change", () => {
  consultarCiudad(
    buscarCiudad(el.selectCiudad.value)
  );
});

el.formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();

  if (!el.selectCiudad.value) {
    mostrarError(
      "Primero selecciona una ciudad.",
      false
    );
    return;
  }

  consultarCiudad(
    buscarCiudad(el.selectCiudad.value)
  );
});

el.formAgregarCiudad.addEventListener(
  "submit",
  agregarCiudadDesdeFormulario
);

el.btnFavorito.addEventListener(
  "click",
  alternarFavorito
);

el.btnUbicacion.addEventListener(
  "click",
  usarMiUbicacion
);

el.btnActualizar.addEventListener(
  "click",
  actualizarClima
);

el.btnUnidad.addEventListener(
  "click",
  cambiarUnidad
);

el.btnReintentar.addEventListener("click", () => {
  if (estado.ciudadActual) {
    consultarCiudad(estado.ciudadActual);
  }
});

/* =========================
   INICIO
========================= */

poblarSelect();
pintarFavoritos();
actualizarBotonFavorito();
actualizarIndicadorConexion();
mostrarEstado("inicial");

/* Actualización automática cada 10 minutos */
setInterval(() => {
  if (estado.ciudadActual && navigator.onLine) {
    actualizarClima();
  }
}, 10 * 60 * 1000);