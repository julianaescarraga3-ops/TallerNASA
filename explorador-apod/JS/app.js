dayjs.locale("es");
console.log(dayjs().format("D [de] MMMM [de] YYYY"));
const API_KEY = "DEMO_KEY";
const URL_APOD = `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`;
 
// Elementos del HTML (los ids deben ser iguales a los del index.html)
const titulo = document.querySelector("#titulo");
const fecha = document.querySelector("#fecha");
const mensaje = document.querySelector("#mensaje");
const foto = document.querySelector("#foto");
const video = document.querySelector("#video");
const explicacion = document.querySelector("#explicacion");
 
async function cargarFotoDelDia() {
  try {
    const respuesta = await fetch(URL_APOD);
 
    if (!respuesta.ok) {
      throw new Error("La NASA respondió con error " + respuesta.status);
    }
 
    const datos = await respuesta.json();
 
    titulo.textContent = datos.title;
    fecha.textContent = datos.date;
    explicacion.textContent = datos.explanation;
 
    // Algunos días el APOD es un video y no una imagen
    if (datos.media_type === "image") {
      foto.src = datos.url;
      foto.alt = datos.title;
      foto.hidden = false;
    } else {
      video.src = datos.url;
      video.hidden = false;
    }
 
    mensaje.hidden = true;
  } catch (error) {
    mensaje.textContent = "No se pudo cargar la foto del día. Intente de nuevo más tarde.";
    console.error(error);
  }
}
 
cargarFotoDelDia();
 