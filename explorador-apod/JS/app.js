
dayjs.locale("es");

const URL_APOD = "https://science.nasa.gov/wp-json/wp/v2/apod-basic/";

const FECHA_MINIMA = "1995-06-16";
const STORAGE_KEY = "apodFavoritos";

const titulo = document.querySelector("#tituloApod");
const fechaApod = document.querySelector("#fechaApod");
const inputFecha = document.querySelector("#fecha");
const btnBuscar = document.querySelector("#btnBuscar");
const mensaje = document.querySelector("#mensaje");
const foto = document.querySelector("#imagenApod");
const enlaceVideo = document.querySelector("#enlaceVideo");
const explicacion = document.querySelector("#explicacion");
const fuenteApod = document.querySelector("#fuenteApod");
const btnFavorito = document.querySelector("#btnFavorito");
const listaFavoritos = document.querySelector("#listaFavoritos");
const favoritosVacios = document.querySelector("#favoritosVacios");

let apodActual = null;

// Configurar calendario
inputFecha.min = FECHA_MINIMA;
inputFecha.max = dayjs().format("YYYY-MM-DD");

// MENSAJES

function mostrarMensaje(texto, tipo = "info") {
    mensaje.textContent = texto;
    mensaje.className = "alert cosmic-alert";

    if (tipo === "danger") {
        mensaje.classList.add("alert-danger");
    } else if (tipo === "success") {
        mensaje.classList.add("alert-success");
    } else {
        mensaje.classList.add("alert-info");
    }

    mensaje.classList.remove("d-none");
}

function ocultarMensaje() {
    mensaje.classList.add("d-none");
}

// EXPLICACIÓN HTML
function mostrarExplicacionHTML(html) {
    const documento = new DOMParser().parseFromString(
        html || "No hay explicación disponible.",
        "text/html"
    );

    const etiquetasPermitidas = [
        "A", "STRONG", "B", "EM", "I",
        "BR", "P", "SUP", "SUB", "UL", "OL", "LI"
    ];

    function limpiar(nodo) {

        if (nodo.nodeType === Node.TEXT_NODE) {
            return document.createTextNode(nodo.textContent);
        }

        if (nodo.nodeType !== Node.ELEMENT_NODE) {
            return document.createDocumentFragment();
        }

        if (!etiquetasPermitidas.includes(nodo.tagName)) {
            const fragmento = document.createDocumentFragment();

            nodo.childNodes.forEach(hijo => {
                fragmento.append(limpiar(hijo));
            });

            return fragmento;
        }

        const elemento = document.createElement(
            nodo.tagName.toLowerCase()
        );

        if (nodo.tagName === "A") {
            const href = nodo.getAttribute("href");

            try {
                const url = new URL(href, window.location.origin);

                if (
                    url.protocol === "https:" ||
                    url.protocol === "http:"
                ) {
                    elemento.href = url.href;
                    elemento.target = "_blank";
                    elemento.rel = "noopener noreferrer";
                }
            } catch {
                // Ignorar enlaces no válidos
            }
        }

        nodo.childNodes.forEach(hijo => {
            elemento.append(limpiar(hijo));
        });

        return elemento;
    }

    explicacion.replaceChildren();

    documento.body.childNodes.forEach(nodo => {
        explicacion.append(limpiar(nodo));
    });
}

// FAVORITOS

// Obtener favoritos
function obtenerFavoritos() {
    const guardados = localStorage.getItem(STORAGE_KEY);

    if (!guardados) {
        return [];
    }

    try {
        return JSON.parse(guardados);
    } catch {
        return [];
    }
}

// Guardar favoritos
function guardarFavoritos(favoritos) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(favoritos)
    );
}

// Comprobar si existe un favorito
function esFavorito(date) {
    return obtenerFavoritos().some(
        fav => fav.date === date
    );
}

// Renderizar favoritos
function renderizarFavoritos() {
    const favoritos = obtenerFavoritos();

    listaFavoritos.innerHTML = "";

    if (favoritos.length === 0) {
        favoritosVacios.hidden = false;
        return;
    }

    favoritosVacios.hidden = true;

    favoritos.forEach(fav => {

        const col = document.createElement("div");
        col.className = "col-12 col-sm-6 col-lg-4";

        const card = document.createElement("div");
        card.className = "favorite-card";

        const fecha = document.createElement("p");
        fecha.className = "favorite-date";

        fecha.textContent = dayjs(fav.date).format(
            "D [de] MMMM [de] YYYY"
        );

        const tituloFav = document.createElement("h3");
        tituloFav.className = "favorite-title";
        tituloFav.textContent = fav.title;

        const acciones = document.createElement("div");
        acciones.className = "favorite-actions";

        const btnAbrir = document.createElement("button");

        btnAbrir.type = "button";
        btnAbrir.className = "btn btn-sm btn-favorite-open";
        btnAbrir.textContent = "Ver";

        btnAbrir.addEventListener("click", () => {
            inputFecha.value = fav.date;
            cargarApod(fav.date);
        });

        const btnEliminar = document.createElement("button");

        btnEliminar.type = "button";
        btnEliminar.className = "btn btn-sm btn-favorite-delete";
        btnEliminar.textContent = "Eliminar";

        btnEliminar.addEventListener("click", () => {
            eliminarFavorito(fav.date);
        });

        acciones.append(btnAbrir, btnEliminar);

        card.append(fecha, tituloFav, acciones);
        col.append(card);

        listaFavoritos.append(col);
    });
}

// Agregar favorito
function agregarFavorito() {
    if (!apodActual) {
        return;
    }

    const favoritos = obtenerFavoritos();

    if (esFavorito(apodActual.date)) {
        mostrarMensaje(
            "Esta APOD ya está en tus favoritos.",
            "info"
        );

        return;
    }

    favoritos.push({
        date: apodActual.date,
        title: apodActual.title
    });

    guardarFavoritos(favoritos);
    renderizarFavoritos();

    btnFavorito.textContent = "Ya está en favoritos";

    mostrarMensaje(
        "APOD guardada en favoritos.",
        "success"
    );
}

// Eliminar favorito
function eliminarFavorito(date) {
    const favoritos = obtenerFavoritos().filter(
        fav => fav.date !== date
    );

    guardarFavoritos(favoritos);
    renderizarFavoritos();

    if (apodActual && apodActual.date === date) {
        btnFavorito.textContent = "Agregar a favoritos";
    }

    mostrarMensaje(
        "Favorito eliminado.",
        "success"
    );
}

// MOSTRAR APOD
function mostrarApod(datos) {

    apodActual = datos;

    // Título
    titulo.textContent = datos.title || "Sin título";

    // Fecha
    fechaApod.textContent = dayjs(datos.date).format(
        "D [de] MMMM [de] YYYY"
    );

    // Explicación
    mostrarExplicacionHTML(datos.explanation);

    // Ocultar imagen y video anteriores
    foto.hidden = true;
    foto.removeAttribute("src");

    enlaceVideo.classList.add("d-none");
    enlaceVideo.removeAttribute("href");

    // Mostrar imagen
    if (datos.media_type === "image" && datos.hdurl) {

        foto.src = datos.hdurl;
        foto.alt = datos.alt || datos.title;
        foto.hidden = false;

        foto.onerror = () => {
            foto.hidden = true;

            mostrarMensaje(
                "No se pudo cargar la imagen de NASA.",
                "danger"
            );
        };

    } else {

        // Mostrar enlace para videos
        const urlContenido = datos.url || datos.permalink;

        if (urlContenido) {
            enlaceVideo.href = urlContenido;

            enlaceVideo.textContent =
                datos.media_type === "video"
                    ? "Ver video de NASA ↗"
                    : "Ver contenido de NASA ↗";

            enlaceVideo.classList.remove("d-none");
        }
    }

    fuenteApod.innerHTML = "";

    const urlFuente = datos.permalink || datos.url;

    if (urlFuente) {

        const enlace = document.createElement("a");

        enlace.href = urlFuente;
        enlace.target = "_blank";
        enlace.rel = "noopener noreferrer";

        enlace.textContent = "Ver contenido original de NASA";

        fuenteApod.append("Fuente: ", enlace);
    }

    btnFavorito.disabled = false;

    btnFavorito.textContent = esFavorito(datos.date)
        ? "Ya está en favoritos"
        : "Agregar a favoritos";
}

// CONSULTAR NASA

async function cargarApod(fecha = "") {
    try {
        mostrarMensaje("Cargando imagen astronómica...", "info");
        btnFavorito.disabled = true;

        const fechaNASA = fecha
            ? dayjs(fecha).format("YYMMDD")
            : "";

        const url = fecha
            ? `${URL_APOD}${fechaNASA}`
            : URL_APOD;

        console.log("URL consultada:", url);

        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            throw new Error(`Error al consultar NASA: ${respuesta.status}`);
        }

        const resultado = await respuesta.json();

        const datos = Array.isArray(resultado)
            ? resultado[0]
            : resultado;

        if (!datos || !datos.title) {
            throw new Error("No se encontró contenido para esa fecha.");
        }

        console.log("Fecha solicitada:", fecha || "Hoy");
        console.log("Fecha recibida:", datos.date);
        console.log("Título:", datos.title);

        if (fecha && datos.date !== fecha) {
            throw new Error(
                `NASA devolvió ${datos.date} en lugar de ${fecha}.`
            );
        }

        mostrarApod(datos);
        ocultarMensaje();

    } catch (error) {
        console.error("Error APOD:", error);
        mostrarMensaje(error.message, "danger");
        btnFavorito.disabled = true;
    }
}



// BUSCAR POR FECHA

btnBuscar.addEventListener("click", () => {

    const fecha = inputFecha.value;

    if (!fecha) {
        mostrarMensaje(
            "Selecciona una fecha para buscar.",
            "danger"
        );

        return;
    }

    if (dayjs(fecha).isAfter(dayjs(), "day")) {
        mostrarMensaje(
            "La fecha no puede ser futura.",
            "danger"
        );

        return;
    }

    if (dayjs(fecha).isBefore(dayjs(FECHA_MINIMA), "day")) {
        mostrarMensaje(
            "La fecha debe ser igual o posterior al 16 de junio de 1995.",
            "danger"
        );

        return;
    }

    cargarApod(fecha);
});

// EVENTOS

// Agregar favorito
btnFavorito.addEventListener("click", agregarFavorito);

// Mostrar favoritos guardados
renderizarFavoritos();

// Cargar APOD del día
cargarApod();