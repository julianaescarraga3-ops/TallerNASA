dayjs.locale("es");

const API_KEY = "DEMO_KEY";
const URL_BASE = "https://api.nasa.gov/planetary/apod";
const FECHA_MINIMA = "1995-06-16";

const titulo = document.querySelector("#tituloApod");
const fechaApod = document.querySelector("#fechaApod");
const inputFecha = document.querySelector("#fecha");
const btnBuscar = document.querySelector("#btnBuscar");
const mensaje = document.querySelector("#mensaje");
const foto = document.querySelector("#imagenApod");
const enlaceVideo = document.querySelector("#enlaceVideo");
const explicacion = document.querySelector("#explicacion");
const fuenteApod = document.querySelector("#fuenteApod");

inputFecha.max = dayjs().format("YYYY-MM-DD");

function mostrarMensaje(texto) {
  mensaje.textContent = texto;
  mensaje.classList.remove("d-none");
}

function ocultarMensaje() {
  mensaje.classList.add("d-none");
}

async function cargarApod(fecha) {
  let url = `${URL_BASE}?api_key=${API_KEY}`;
  if (fecha) {
    url += `&date=${fecha}`;
  }

  try {
    ocultarMensaje();

    const respuesta = await fetch(url);
    if (!respuesta.ok) {
      throw new Error("La NASA respondió con error " + respuesta.status);
    }

    const datos = await respuesta.json();

    titulo.textContent = datos.title;
    fechaApod.textContent = dayjs(datos.date).format("D [de] MMMM [de] YYYY");
    explicacion.textContent = datos.explanation;
    fuenteApod.textContent = datos.copyright
      ? "Crédito: " + datos.copyright.trim()
      : "";

    if (datos.media_type === "image") {
      foto.src = datos.url;
      foto.alt = datos.title;
      foto.hidden = false;
      enlaceVideo.classList.add("d-none");
    } else {
      foto.hidden = true;
      enlaceVideo.href = datos.url;
      enlaceVideo.classList.remove("d-none");
    }
  } catch (error) {
    mostrarMensaje("No se pudo cargar la foto del día. Intente de nuevo más tarde.");
    console.error(error);
  }
}

btnBuscar.addEventListener("click", () => {
  const fecha = inputFecha.value;

  if (!fecha) {
    mostrarMensaje("Selecciona una fecha para buscar.");
    return;
  }
  if (fecha < FECHA_MINIMA || fecha > inputFecha.max) {
    mostrarMensaje("La fecha debe estar entre el 16 de junio de 1995 y hoy.");
    return;
  }

  cargarApod(fecha);
});

cargarApod();