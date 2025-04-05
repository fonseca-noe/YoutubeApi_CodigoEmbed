document.addEventListener("DOMContentLoaded", () => {
  // Elementos de la interfaz
  const listaPlantillas = document.querySelectorAll(".template-list li");
  const vistaPrevia = document.getElementById("preview-box");
  const formularioVideo = document.getElementById("video-url-form");
  const inputVideoUrl = document.getElementById("video-url");
  const btnCargarVideo = document.getElementById("load-video");

  // Elementos del modal
  const videoModal = document.getElementById("videoModal");
  const modalContent = document.getElementById("modalContent");  // Contenedor del modal
  const videoFrame = document.getElementById("videoFrame");
  const videoTitle = document.getElementById("title");
  const publishedDate = document.getElementById("publishedDate");
  const videoViews = document.getElementById("views");
  const videoLikes = document.getElementById("likes");
  const videoComments = document.getElementById("comments");
  const subscribeButton = document.getElementById("subscribeButton");
  const videoCommentsContainer = document.getElementById("videoComments");

  let tipoSeleccionado = "";
  const urlSingleVideo="https://www.youtube.com/watch?v=VdS9ZGHHXWQ";
  const urlHandle="https://www.youtube.com/@EDteam";

  listaPlantillas.forEach((item) => {
    item.addEventListener("click", async () => {
      listaPlantillas.forEach((li) => li.classList.remove("active"));
      item.classList.add("active");

      tipoSeleccionado = item.dataset.template;
      vistaPrevia.innerHTML = `<h5>${tipoSeleccionado}</h5>`;

      if (tipoSeleccionado === "Single Video") {
        await cargarVideo(urlSingleVideo);
      } else if (tipoSeleccionado === "YouTube Channel") {
        await cargarCanal(urlHandle);
      } else if (tipoSeleccionado === "Video Grid") {
        await cargarVideoGrid(urlHandle);
      } else if (tipoSeleccionado === "YouTube Subscribe") {
        await cargarYoutubeSubscribe(urlHandle);
      } else if (tipoSeleccionado === "Video Gallery") {
        await cargarVideoGallery(urlHandle);
      } else if (tipoSeleccionado === "Video List") {
        await cargarVideoList(urlHandle);
      }
      
      if (
      tipoSeleccionado === "Single Video" ||
      tipoSeleccionado === "YouTube Channel" ||
      tipoSeleccionado === "Video Grid" ||
      tipoSeleccionado === "YouTube Subscribe" ||
      tipoSeleccionado === "Video Gallery" ||
      tipoSeleccionado === "Video List"
    ) {
      formularioVideo.classList.remove("d-none");
    } else {
      formularioVideo.classList.add("d-none");
    }
    });
  });

  btnCargarVideo.addEventListener("click", async () => {
    const url = inputVideoUrl.value.trim();
    if (!url) {
      alert("Por favor, ingresa una URL.");
      return;
    }
    if (tipoSeleccionado === "Single Video") {
      await cargarVideo(url);
    } else if (tipoSeleccionado === "YouTube Channel") {
      await cargarCanal(url);
    }
    else if (tipoSeleccionado === "Video Grid") {
      await cargarVideoGrid(url);
    }
    else if (tipoSeleccionado === "YouTube Subscribe") {
      await cargarYoutubeSubscribe(url);
    }
    else if (tipoSeleccionado === "Video Gallery") {
      await cargarVideoGallery(url);
    }
    else if (tipoSeleccionado === "Video List") {
      await cargarVideoList(url);
    }
  });

  async function cargarVideo(videoId, desdeCanal = false) {
    if (videoId.includes("http")) {
      videoId = extraerVideoId(videoId);
    }

    if (!videoId || videoId.length < 10) {
      alert("No se pudo extraer el ID del video. Verifica la URL.");
      return;
    }
    try {
      const respuesta = await fetch(`youtube_api.php?videoId=${videoId}`);
      const datos = await respuesta.json();

      if (!datos.items?.length) {
        alert("No se encontró el video.");
        return;
      }

      const { snippet, statistics } = datos.items[0];
      const channelId = snippet.channelId;

      if (desdeCanal) {
        actualizarDatosVideo(snippet, statistics, videoId, channelId);
        await cargarComentarios(videoId);
        return;
      }

      vistaPrevia.innerHTML = `
        <div style="display: flex;justify-content: center;">
          <div class="video-card" style="position: relative; display: inline-block;">
            <img src="${snippet.thumbnails.high.url}" class="img-fluid" style="object-fit: cover; display: block;">
            <div class="video-details" style="position: absolute; top: 0; left: 0; right: 0;bottom: 0; background: rgba(0,0,0,0.7); color: #fff; opacity: 0; transition: opacity 0.3s; padding: 5px; font-size: 0.9rem;">
                <h6 style="margin: 0;">${snippet.title}</h6>
                <p class="color" style="margin: 0; font-size: 0.8rem;">${new Date(snippet.publishedAt).toLocaleDateString()}</p>
                <p class="color">${statistics.viewCount || "N/A"} Views • ${statistics.likeCount || "N/A"} Likes • ${statistics.commentCount || "N/A"} Comments</p>
              </div>
          </div>
        </div>
      `;
      document.querySelectorAll('.video-card').forEach(card => {
        card.addEventListener('mouseenter', function () {
          const details = this.querySelector('.video-details');
          if (details) details.style.opacity = '1';
        });
        card.addEventListener('mouseleave', function () {
          const details = this.querySelector('.video-details');
          if (details) details.style.opacity = '0';
        });
        card.addEventListener('click', function (event) {
          event.preventDefault();
          actualizarDatosVideo(snippet, statistics, videoId, channelId);
          cargarComentarios(videoId);
        });
      });

      document.getElementById("embedButton").style.display = "block";
    } catch (error) {
      console.error("Error al obtener los datos del video:", error);
      alert("Hubo un problema al cargar los datos del video.");
    }
  }

  async function cargarCanal(url) {
    let channelId;

    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      if (pathname.includes("/channel/")) {
        channelId = pathname.split("/channel/")[1];
      } else if (pathname.startsWith("/@")) {
        const handle = pathname.substring(1);
        channelId = await obtenerChannelId(handle);
        if (!channelId) {
          alert("No se pudo obtener el ID del canal.");
          return;
        }
      } else {
        alert("URL inválida. Solo se admiten enlaces con ID o @handle.");
        return;
      }
    } catch (e) {
      alert("URL inválida. Debe ser un enlace de un canal de YouTube.");
      return;
    }

    limpiarDatosVideo();
    vistaPrevia.innerHTML = "";

    try {
      const [canalResp, videosResp] = await Promise.all([
        fetch(`youtube_api.php?channelId=${channelId}`).then(res => res.json()),
        fetch(`youtube_api.php?videoGallery=${channelId}`).then(res => res.json())
      ]);

      if (!canalResp.items?.length) {
        alert("No se encontró el canal.");
        return;
      }

      const canal = canalResp.items[0];
      const { snippet, statistics, brandingSettings } = canal;
      const bannerUrl = brandingSettings?.image?.bannerExternalUrl + "=w2560-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj";


      const channelHeaderHTML = `
        <div class="card shadow">
            <img src="${bannerUrl}" class="card-img-top" alt="Banner del canal" style="max-height: 200px; object-fit: cover; width: 100%;">
            <div class="card-body text-center">
                <img src="${snippet.thumbnails.high.url}" class="rounded-circle border border-3 border-white" width="100">
                <h4 class="mt-2">${snippet.title}</h4>
                <p class="text-muted">${statistics.subscriberCount} Subscribers • ${statistics.videoCount} Videos • ${statistics.viewCount} Views</p>
                <a href="https://www.youtube.com/channel/${channelId}" target="_blank" class="btn btn-danger">
                  <i class="fab fa-youtube"></i> YouTube ${statistics.subscriberCount}
                </a>
            </div>
        </div>
      `;

      // Construir carrusel de videos
      let carouselItems = "";
      if (videosResp.items && videosResp.items.length > 0) {
        for (let i = 0; i < videosResp.items.length; i += 2) {
          carouselItems += `<div class="carousel-item ${i === 0 ? 'active' : ''}"><div class="row">`;
          for (let j = i; j < i + 2 && j < videosResp.items.length; j++) {
            const video = videosResp.items[j];
            carouselItems += `
              <div class="col-md-6">
                <div class="card">
                    <a href="#" class="video-link" data-video-id="${video.id}" 
                        data-bs-toggle="modal" data-bs-target="#videoModal">
                        <img src="${video.snippet.thumbnails.high.url}" class="card-img-top">
                    </a>
                    <div class="card-body">
                        <h6 class="card-title">${video.snippet.title}</h6>
                        <p class="text-muted">${new Date(video.snippet.publishedAt).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
            `;
          }
          carouselItems += `</div></div>`;
        }
      }
      const carouselHTML = `
      <div id="videoCarousel" class="carousel slide mt-3" data-bs-interval="false">
        <div class="carousel-inner">
          ${carouselItems}
        </div>
        <button class="custom-carousel-control carousel-control-prev" type="button" data-bs-target="#videoCarousel" data-bs-slide="prev">
          <span class="custom-icon"><i class="fas fa-chevron-left"></i></span>
          <span class="visually-hidden">Anterior</span>
        </button>
        <button class="custom-carousel-control carousel-control-next" type="button" data-bs-target="#videoCarousel" data-bs-slide="next">
          <span class="custom-icon"><i class="fas fa-chevron-right"></i></span>
          <span class="visually-hidden">Siguiente</span>
        </button>
      </div>
    `;

      vistaPrevia.innerHTML = channelHeaderHTML + carouselHTML;

      document.querySelectorAll(".video-link").forEach(link => {
        link.removeEventListener("click", manejarClickVideo);
        link.addEventListener("click", manejarClickVideo);
      });

      function manejarClickVideo(event) {
        event.preventDefault();
        limpiarDatosVideo();
        const videoId = this.getAttribute("data-video-id");
        cargarVideo(videoId, true);
      }
      document.getElementById("embedButton").style.display = "block";
    } catch (error) {
      console.error("Error al obtener los datos del canal:", error);
      alert("Hubo un problema al cargar los datos del canal.");
    }
  }

  async function cargarVideoGrid(url) {
    let channelId;
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      if (pathname.includes("/channel/")) {
        channelId = pathname.split("/channel/")[1];
      } else if (pathname.startsWith("/@")) {
        const handle = pathname.substring(1);
        channelId = await obtenerChannelId(handle);
        if (!channelId) {
          alert("No se pudo obtener el ID del canal.");
          return;
        }
      } else {
        alert("URL inválida. Solo se admiten enlaces con ID o @handle.");
        return;
      }
    } catch (e) {
      alert("URL inválida. Debe ser un enlace de un canal de YouTube.");
      return;
    }

    limpiarDatosVideo();
    vistaPrevia.innerHTML = "";

    try {
      const [canalResp, videosResp] = await Promise.all([
        fetch(`youtube_api.php?channelId=${channelId}`).then(res => res.json()),
        fetch(`youtube_api.php?videoGallery=${channelId}`).then(res => res.json())
      ]);
      if (!canalResp.items?.length) {
        alert("No se encontró el canal.");
        return;
      }

      let carouselItems = "";
      if (videosResp.items && videosResp.items.length > 0) {
        // Agrupar en slides de 16 videos
        for (let i = 0; i < videosResp.items.length; i += 16) {
          // Comienza un nuevo slide. Si es el primero, se marca como 'active'
          carouselItems += `<div class="carousel-item ${i === 0 ? 'active' : ''}">`;

          // Dentro de cada slide, crear 4 filas
          for (let row = 0; row < 4; row++) {
            carouselItems += `<div class="row mb-2">`;

            // Para cada fila, agregar 4 videos (columnas)
            for (let col = 0; col < 4; col++) {
              // Calcular el índice actual en el array de videos
              let index = i + row * 4 + col;
              // Asegurarse de no exceder el total de videos
              if (index >= videosResp.items.length) break;
              const video = videosResp.items[index];
              carouselItems += `
              <div class="col-md-3">
                  <div class="video-container" style="position: relative;">
                    <div class="video-card" >
                        <a href="#" class="video-link" data-video-id="${video.id}" 
                            data-bs-toggle="modal" data-bs-target="#videoModal">
                            <img src="${video.snippet.thumbnails.medium.url}" class="card-img-top">
                        <span class="position-absolute top-50 start-50 translate-middle text-white" style="font-size: 3.5rem; opacity: 0.8;">
                          <i class="fas fa-play-circle" style="color:red;"></i>
                        </span>
                        </a>
                    </div>
                    <div class="video-details" style="position: absolute; top: 0; left: 0; right: 0;bottom: 0; background: rgba(0,0,0,0.7); color: #fff; opacity: 0; transition: opacity 0.3s; padding: 5px; font-size: 0.9rem;">
                      <h6 style="margin: 0;">${video.snippet.title}</h6>
                      <p class="color" style="margin: 0; font-size: 0.8rem;">${new Date(video.snippet.publishedAt).toLocaleDateString()}</p>
                      <p class="color">${video.statistics.viewCount || "N/A"} Views • ${video.statistics.likeCount || "N/A"} Likes • ${video.statistics.commentCount || "N/A"} Comments</p>
                    </div>
                  </div>
              </div>
            `;
            } // fin ciclo de columnas
            carouselItems += `</div>`; // fin de la fila
          } // fin ciclo de filas

          carouselItems += `</div>`; // fin de slide
        }
      }
      const carouselHTML = `
      <div id="videoCarousel" class="carousel slide mt-3" data-bs-interval="false">
        <div class="carousel-inner">
          ${carouselItems}
        </div>
        <button class="custom-carousel-control carousel-control-prev" type="button" data-bs-target="#videoCarousel" data-bs-slide="prev">
          <span class="custom-icon"><i class="fas fa-chevron-left"></i></span>
          <span class="visually-hidden">Anterior</span>
        </button>
        <button class="custom-carousel-control carousel-control-next" type="button" data-bs-target="#videoCarousel" data-bs-slide="next">
          <span class="custom-icon"><i class="fas fa-chevron-right"></i></span>
          <span class="visually-hidden">Siguiente</span>
        </button>
      </div>
    `;

      vistaPrevia.innerHTML = carouselHTML;

      document.querySelectorAll('.video-container').forEach(container => {
        container.addEventListener('mouseenter', function () {
          const details = this.querySelector('.video-details');
          if (details) details.style.opacity = '1';
        });
        container.addEventListener('mouseleave', function () {
          const details = this.querySelector('.video-details');
          if (details) details.style.opacity = '0';
        });
      });
      document.querySelectorAll(".video-link").forEach(link => {
        link.removeEventListener("click", manejarClickVideo);
        link.addEventListener("click", manejarClickVideo);
      });
      document.querySelectorAll(".video-details").forEach(details => {
        details.removeEventListener("click", manejarClickVideo);
        details.addEventListener("click", manejarClickVideo);
      });

      function manejarClickVideo(event) {
        event.preventDefault();
        limpiarDatosVideo();
        let videoId = this.getAttribute("data-video-id");
        if (!videoId) {
          videoId = this.closest(".video-container").querySelector(".video-link").getAttribute("data-video-id");
        }
        cargarVideo(videoId, true);
      }
      document.getElementById("embedButton").style.display = "block";
    } catch (error) {
      console.error("Error al obtener los datos del canal:", error);
      alert("Hubo un problema al cargar los datos del canal.");
    }
  }

  async function cargarVideoGallery(url) {
    let channelId;

    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      if (pathname.includes("/channel/")) {
        channelId = pathname.split("/channel/")[1];
      } else if (pathname.startsWith("/@")) {
        const handle = pathname.substring(1);
        channelId = await obtenerChannelId(handle);
        if (!channelId) {
          alert("No se pudo obtener el ID del canal.");
          return;
        }
      } else {
        alert("URL inválida. Solo se admiten enlaces con ID o @handle.");
        return;
      }
    } catch (e) {
      alert("URL inválida. Debe ser un enlace de un canal de YouTube.");
      return;
    }

    limpiarDatosVideo();
    vistaPrevia.innerHTML = "";

    try {
      const [canalResp, videosResp] = await Promise.all([
        fetch(`youtube_api.php?channelId=${channelId}`).then(res => res.json()),
        fetch(`youtube_api.php?videoGallery=${channelId}`).then(res => res.json())
      ]);

      if (!canalResp.items?.length) {
        alert("No se encontró el canal.");
        return;
      }

      let carouselItems = "";
      if (videosResp.items && videosResp.items.length > 0) {
        for (let i = 0; i < videosResp.items.length; i += 8) {
          carouselItems += `<div class="carousel-item ${i === 0 ? 'active' : ''}">`;
          for (let row = 0; row < 2; row++) {
            carouselItems += `<div class="row mb-2">`;
            for (let col = 0; col < 4; col++) {
              let index = i + row * 4 + col;
              if (index >= videosResp.items.length) break;
              const video = videosResp.items[index];
              carouselItems += `
              <div class="col-md-3">
                  <div class="card">
                      <a href="#" class="video-link" data-video-id="${video.id}" 
                          data-bs-toggle="modal" data-bs-target="#videoModal">
                          <img src="${video.snippet.thumbnails.medium.url}" class="card-img-top">
                      </a>
                      <div class="card-body">
                          <h6 class="title">${video.snippet.title}</h6>
                          <p class="text-muted">${new Date(video.snippet.publishedAt).toLocaleDateString()}</p>
                          <div>
                            <p class="text-muted">${video.statistics.viewCount || "N/A"} Views • ${video.statistics.likeCount || "N/A"} Likes • ${video.statistics.commentCount || "N/A"} Comments</p>
                          </div>
                      </div>
                  </div>
              </div>
            `;
            } 
            carouselItems += `</div>`; 
          } 
          carouselItems += `</div>`; 
        }
      }
      const carouselHTML = `
      <div id="videoCarousel" class="carousel slide mt-3" data-bs-interval="false">
        <div class="carousel-inner">
          ${carouselItems}
        </div>
        <button class="custom-carousel-control carousel-control-prev" type="button" data-bs-target="#videoCarousel" data-bs-slide="prev">
          <span class="custom-icon"><i class="fas fa-chevron-left"></i></span>
          <span class="visually-hidden">Anterior</span>
        </button>
        <button class="custom-carousel-control carousel-control-next" type="button" data-bs-target="#videoCarousel" data-bs-slide="next">
          <span class="custom-icon"><i class="fas fa-chevron-right"></i></span>
          <span class="visually-hidden">Siguiente</span>
        </button>
      </div>
    `;
      vistaPrevia.innerHTML = carouselHTML;
      document.querySelectorAll(".video-link").forEach(link => {
        link.removeEventListener("click", manejarClickVideo);
        link.addEventListener("click", manejarClickVideo);
      });

      function manejarClickVideo(event) {
        event.preventDefault();
        limpiarDatosVideo();
        const videoId = this.getAttribute("data-video-id");
        cargarVideo(videoId, true);
      }
      document.getElementById("embedButton").style.display = "block";
    } catch (error) {
      console.error("Error al obtener los datos del canal:", error);
      alert("Hubo un problema al cargar los datos del canal.");
    }
  }

  async function cargarYoutubeSubscribe(url) {
    let channelId;

    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      if (pathname.includes("/channel/")) {
        channelId = pathname.split("/channel/")[1];
      } else if (pathname.startsWith("/@")) {
        const handle = pathname.substring(1);
        channelId = await obtenerChannelId(handle);
        if (!channelId) {
          alert("No se pudo obtener el ID del canal.");
          return;
        }
      } else {
        alert("URL inválida. Solo se admiten enlaces con ID o @handle.");
        return;
      }
    } catch (e) {
      alert("URL inválida. Debe ser un enlace de un canal de YouTube.");
      return;
    }

    limpiarDatosVideo();
    vistaPrevia.innerHTML = "";

    try {
      const [canalResp, videosResp] = await Promise.all([
        fetch(`youtube_api.php?channelId=${channelId}`).then(res => res.json()),
        fetch(`youtube_api.php?videoGallery=${channelId}`).then(res => res.json())
      ]);

      if (!canalResp.items?.length) {
        alert("No se encontró el canal.");
        return;
      }

      const canal = canalResp.items[0];
      const { snippet, statistics, brandingSettings } = canal;
      const bannerUrl = brandingSettings?.image?.bannerExternalUrl + "=w2560-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj";

      // Construir header del canal con banner y overlay
      const channelHeaderHTML = `
        <div class="channel-header" style="position: relative; height: 200px; background: url('${bannerUrl}') center/cover no-repeat;">
          <div style="position: absolute; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.5);"></div>
          <div style="position: absolute; top:50%; left:50%; transform: translate(-50%, -50%); text-align: center; color: white;">
            <img src="${snippet.thumbnails.medium.url}" class="rounded-circle border border-3 border-white" width="100">
            <h4 class="mt-2">${snippet.title}</h4>
            <p class="mb-2 color">${statistics.subscriberCount} Subscribers • ${statistics.videoCount} Videos • ${statistics.viewCount} Views</p>
            <a href="https://www.youtube.com/channel/${channelId}" target="_blank" class="btn btn-danger">
              <i class="fab fa-youtube"></i> YouTube ${statistics.subscriberCount}
            </a>
          </div>
        </div>
      `;

      // Construir carrusel de videos
      let carouselItems = "";
      if (videosResp.items && videosResp.items.length > 0) {
        for (let i = 0; i < videosResp.items.length; i += 2) {
          carouselItems += `<div class="carousel-item ${i === 0 ? 'active' : ''}"><div class="row">`;
          for (let j = i; j < i + 2 && j < videosResp.items.length; j++) {
            const video = videosResp.items[j];
            carouselItems += `
              <div class="col-6">
                <div class="video-card" style="position: relative;"> 
                  <a href="#" class="video-link" data-video-id="${video.id}" data-bs-toggle="modal" data-bs-target="#videoModal">
                    <img src="${video.snippet.thumbnails.high.url}" class="img-fluid card-img-top" object-fit: cover;">
                    <div class="video-details" style="position: absolute; top: 0; left: 0; right: 0;bottom: 0; background: rgba(0,0,0,0.7); color: #fff; opacity: 0; transition: opacity 0.3s; padding: 5px; font-size: 0.9rem;">
                      <h6 style="margin: 0;">${video.snippet.title}</h6>
                      <p class="color" style="margin: 0; font-size: 0.8rem;">${new Date(video.snippet.publishedAt).toLocaleDateString()}</p>
                      <p class="color">${video.statistics.viewCount || "N/A"} Views • ${video.statistics.likeCount || "N/A"} Likes • ${video.statistics.commentCount || "N/A"} Comments</p>
                    </div>
                  </a>
                </div>
              </div>
            `;
          }
          carouselItems += `</div></div>`;
        }
      }
      const carouselHTML = `
      <div id="videoCarousel" class="carousel slide mt-3" data-bs-interval="false">
        <div class="carousel-inner">
          ${carouselItems}
        </div>
        <button class="custom-carousel-control carousel-control-prev" type="button" data-bs-target="#videoCarousel" data-bs-slide="prev">
          <span class="custom-icon"><i class="fas fa-chevron-left"></i></span>
          <span class="visually-hidden">Anterior</span>
        </button>
        <button class="custom-carousel-control carousel-control-next" type="button" data-bs-target="#videoCarousel" data-bs-slide="next">
          <span class="custom-icon"><i class="fas fa-chevron-right"></i></span>
          <span class="visually-hidden">Siguiente</span>
        </button>
      </div>
    `;

      vistaPrevia.innerHTML = channelHeaderHTML + carouselHTML;

      // Agregar efecto hover para mostrar detalles del video
      document.querySelectorAll('.video-card').forEach(card => {
        card.addEventListener('mouseenter', function () {
          const details = this.querySelector('.video-details');
          if (details) details.style.opacity = '1';
        });
        card.addEventListener('mouseleave', function () {
          const details = this.querySelector('.video-details');
          if (details) details.style.opacity = '0';
        });
      });

      // Adjuntar el evento click para reproducir el video usando cargarVideo
      document.querySelectorAll(".video-link").forEach(link => {
        link.removeEventListener("click", manejarClickVideo);
        link.addEventListener("click", manejarClickVideo);
      });

      function manejarClickVideo(event) {
        event.preventDefault();
        limpiarDatosVideo();
        let videoId = this.getAttribute("data-video-id");
        if (!videoId) {
          videoId = this.closest(".video-card").querySelector(".video-link").getAttribute("data-video-id");
        }
        cargarVideo(videoId, true);
      }
      document.getElementById("embedButton").style.display = "block";
    } catch (error) {
      console.error("Error al obtener los datos del canal:", error);
      alert("Hubo un problema al cargar los datos del canal.");
    }
  }

  async function cargarComentarios(videoId) {
    try {
      const respuesta = await fetch(`youtube_api.php?comments=true&videoId=${videoId}`);
      const datos = await respuesta.json();
      if (!datos.items || datos.items.length === 0) {
        videoCommentsContainer.innerHTML = "<p>No hay comentarios disponibles.</p>";
        return;
      }
      videoCommentsContainer.innerHTML = datos.items
        .map((comment) => {
          const fechaOriginal = comment.snippet.topLevelComment.snippet.publishedAt;
          const fechaFormateada = tiempoTranscurrido(fechaOriginal);
          return `
                <div class="d-flex align-items-start mb-3 p-3 border rounded shadow-sm bg-white">
                     <img src="${comment.snippet.topLevelComment.snippet.authorProfileImageUrl}" 
                        onerror="this.onerror=null; this.src='img/default-avatar.png';" 
                        alt="Avatar" class="rounded-circle me-3" width="50" height="50">
                      <div class="w-100">
                          <p class="mb-1">
                              <strong>${comment.snippet.topLevelComment.snippet.authorDisplayName}</strong> 
                              <small class="text-muted">${fechaFormateada}</small>
                          </p>                         
                          <p>${comment.snippet.topLevelComment.snippet.textDisplay}</p>
                          <p class="text-muted small">
                              <i class="fa-solid fa-thumbs-up text-primary"></i> ${comment.snippet.topLevelComment.snippet.likeCount}  
                          </p>
                      </div>
                  </div>
            `;
        })
        .join("");
    } catch (error) {
      console.error("Error al obtener los comentarios:", error);
      videoCommentsContainer.innerHTML = "<p>No se pudieron cargar los comentarios.</p>";
    }
  }

  async function cargarVideoList(url) {
    let channelId;

    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      if (pathname.includes("/channel/")) {
        channelId = pathname.split("/channel/")[1];
      } else if (pathname.startsWith("/@")) {
        const handle = pathname.substring(1);
        channelId = await obtenerChannelId(handle);
        if (!channelId) {
          alert("No se pudo obtener el ID del canal.");
          return;
        }
      } else {
        alert("URL inválida. Solo se admiten enlaces con ID o @handle.");
        return;
      }
    } catch (e) {
      alert("URL inválida. Debe ser un enlace de un canal de YouTube.");
      return;
    }

    limpiarDatosVideo();
    vistaPrevia.innerHTML = "";

    try {
      const [canalResp, videosResp] = await Promise.all([
        fetch(`youtube_api.php?channelId=${channelId}`).then(res => res.json()),
        fetch(`youtube_api.php?videoGallery=${channelId}`).then(res => res.json())
      ]);

      if (!canalResp.items?.length) {
        alert("No se encontró el canal.");
        return;
      }

      // Construir los items individuales para la lista
        const videoItems = videosResp.items?.map(video => {
        const videoId = video.id.videoId || video.id;
        const title = video.snippet.title;
        const date = new Date(video.snippet.publishedAt).toLocaleDateString();
        const thumbnail = video.snippet.thumbnails.medium.url;
        const views = video.statistics?.viewCount || "N/A";
        const likes = video.statistics?.likeCount || "N/A";
        const comments = video.statistics?.commentCount || "N/A";

        return `
          <div class="video-list-item d-flex align-items-center mb-3">
            <a href="#" class="video-link me-3" data-video-id="${videoId}">
              <div class="thumbnail-wrapper position-relative" ">
                <img 
                  src="${thumbnail}" 
                  alt="Thumbnail" 
                  class="img-fluid rounded" 
                  style="object-fit: cover; "
                >
                <span 
                  class="position-absolute top-50 start-50 translate-middle text-white" 
                  style="font-size: 3.5rem; opacity: 0.8;"
                >
                  <i class="fas fa-play-circle " style="color:red;"></i>
                </span>
              </div>
            </a>
            <div class="video-info flex-grow-1">
              <h6 class="mb-1 fw-bold">${title}</h6>
              <p class="text-muted mb-1">${date}</p>
              <p class="mb-0 text-muted">${views} Views • ${likes} Likes • ${comments} Comments</p>
            </div>
          </div>
        `;
      }) || [];

      // Agrupar los items en slides de 4 videos cada uno
      let slidesHTML = "";
      for (let i = 0; i < videoItems.length; i += 4) {
        let group = videoItems.slice(i, i + 4).join("");
        slidesHTML += `
          <div class="carousel-item ${i === 0 ? 'active' : ''}">
            <div class="video-list-group">
              ${group}
            </div>
          </div>
        `;
      }

      const carouselHTML = `
      <div id="videoCarousel" class="carousel slide carousel-vertical mt-3" data-bs-interval="false">
        <div class="carousel-inner">
          ${slidesHTML}
        </div>
        <button class="custom-carousel-control carousel-control-prev" type="button" data-bs-target="#videoCarousel" data-bs-slide="prev">
          <span class="custom-icon"><i class="fas fa-chevron-up"></i></span>
          <span class="visually-hidden">Anterior</span>
        </button>
        <button class="custom-carousel-control carousel-control-next" type="button" data-bs-target="#videoCarousel" data-bs-slide="next">
          <span class="custom-icon"><i class="fas fa-chevron-down"></i></span>
          <span class="visually-hidden">Siguiente</span>
        </button>
      </div>
    `;
      vistaPrevia.innerHTML = carouselHTML;

      // Agregar el evento de clic a cada miniatura/enlace
      document.querySelectorAll(".video-link").forEach(link => {
        link.removeEventListener("click", manejarClickVideo);
        link.addEventListener("click", manejarClickVideo);
      });

      function manejarClickVideo(event) {
        event.preventDefault();
        limpiarDatosVideo();
        const videoId = this.getAttribute("data-video-id");
        cargarVideo(videoId, true);
      }
      document.getElementById("embedButton").style.display = "block";
    } catch (error) {
      console.error("Error al obtener los datos del canal:", error);
      alert("Hubo un problema al cargar los datos del canal.");
    }
  }

  function limpiarDatosVideo() {
    videoTitle.textContent = "";
    publishedDate.textContent = "";
    videoViews.textContent = "";
    videoLikes.textContent = "";
    videoComments.textContent = "";
    videoFrame.src = "about:blank";
    subscribeButton.href = "";
    videoCommentsContainer.innerHTML = "";
    modalContent.classList.add("hidden");
  }

  function actualizarDatosVideo(snippet, statistics, videoId, channelId) {
    modalContent.classList.add("hidden");
    limpiarDatosVideo();

    videoTitle.textContent = snippet.title || "Título no disponible";
    publishedDate.textContent = new Date(snippet.publishedAt).toLocaleDateString() || "Fecha no disponible";
    videoViews.textContent = statistics.viewCount || "N/A";
    videoLikes.textContent = statistics.likeCount || "N/A";
    videoComments.textContent = statistics.commentCount || "N/A";
    subscribeButton.href = `https://www.youtube.com/channel/${channelId}`;

    videoFrame.onload = () => {
      modalContent.classList.remove("hidden");
    };

    videoFrame.src = `https://www.youtube.com/embed/${videoId}`;
    new bootstrap.Modal(videoModal).show();
  }



  document.getElementById("videoModal").addEventListener("hidden.bs.modal", () => {
    limpiarDatosVideo();
  });

  function tiempoTranscurrido(fecha) {
    const segundos = Math.floor((new Date() - new Date(fecha)) / 1000);
    const intervalos = {
      año: 31536000,
      mes: 2592000,
      día: 86400,
      hora: 3600,
      minuto: 60,
    };

    for (let [unidad, segundosUnidad] of Object.entries(intervalos)) {
      const cantidad = Math.floor(segundos / segundosUnidad);
      if (cantidad >= 1)
        return `hace ${cantidad} ${unidad}${cantidad > 1 ? "s" : ""}`;
    }
    return "hace unos segundos";
  }

  async function obtenerChannelId(handle) {
    try {
      const respuesta = await fetch(`youtube_api.php?handle=${handle}`);
      const datos = await respuesta.json();
      if (!datos.items || datos.items.length === 0) {
        alert("No se encontró el canal.");
        return null;
      }
      return datos.items[0].id;
    } catch (error) {
      console.error("Error al obtener el ID del canal:", error);
      return null;
    }
  }
  function extraerVideoId(url) {
    try {
      let videoId;
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        videoId = new URL(url).searchParams.get("v") || url.split("/").pop();
      }
      return videoId;
    } catch {
      return null;
    }
  }

  document.getElementById("embedButton").addEventListener("click", () => {
    const url = document.getElementById("video-url").value.trim();
    if (!url) {
      alert("Por favor, ingresa una URL de video o canal.");
      return;
    }
    console.log("Tipo seleccionado:", tipoSeleccionado);

    // Verificamos que la URL sea de YouTube
    if (!(url.includes("youtube.com") || url.includes("youtu.be"))) {
      alert("Solo se admiten URLs de YouTube.");
      return;
    }

    let embedCode = "";

    try {
      const urlObj = new URL(url);
      // Usamos el valor de tipoSeleccionado para decidir el embed code
      switch (tipoSeleccionado) {
        case "Single Video": {
          // Para video individual debe tener watch?v=
          if (!url.includes("watch?v=")) {
            alert("La URL no es válida para un video individual.");
            return;
          }
          const videoId = urlObj.searchParams.get("v");
          if (!videoId) {
            alert("No se pudo extraer el ID del video.");
            return;
          }
          embedCode = `
          <script src="http://localhost/YoutubeApi_CodigoEmbed/js/widget.js" defer></script>
          <div class="mi-widget" data-video-url="https://www.youtube.com/watch?v=${videoId}" data-template="Single Video"></div>
          `;
          break;
        }
        case "YouTube Channel": {
          // Puede ser URL con /channel/ o con @handle
          if (url.includes("/channel/")) {
            const channelId = url.split("/channel/")[1];
            embedCode = `
            <script src="http://localhost/YoutubeApi_CodigoEmbed/js/widget.js" defer></script>
            <div class="mi-widget" data-video-url="https://www.youtube.com/channel/${channelId}" data-template="YouTube Channel"></div>
            `;
          } else if (url.includes("/@")) {
            const handle = url.split("/@")[1];
            embedCode = `
            <script src="http://localhost/YoutubeApi_CodigoEmbed/js/widget.js" defer></script>
            <div class="mi-widget" data-video-url="https://www.youtube.com/@${handle}" data-template="YouTube Channel"></div>
            `;
          } else {
            alert("La URL no es válida para un canal de YouTube.");
            return;
          }
          break;
        }
        case "Video Grid": {
          // Asumimos que Video Grid se basa en un canal
          if (url.includes("/channel/")) {
            const channelId = url.split("/channel/")[1];
            embedCode = `
            <script src="http://localhost/YoutubeApi_CodigoEmbed/js/widget.js" defer></script>
            <div class="mi-widget" data-video-url="https://www.youtube.com/channel/${channelId}" data-template="Video Grid"></div>
            `;
          } else if (url.includes("/@")) {
            const handle = url.split("/@")[1];
            embedCode = `
            <script src="http://localhost/YoutubeApi_CodigoEmbed/js/widget.js" defer></script>
            <div class="mi-widget" data-video-url="https://www.youtube.com/@${handle}" data-template="Video Grid"></div>
            `;
          } else {
            alert("La URL no es válida para Video Grid.");
            return;
          }
          break;
        }
        case "YouTube Subscribe": {
          // Template para suscripción, basado en canal
          if (url.includes("/channel/")) {
            const channelId = url.split("/channel/")[1];
            embedCode = `
          <script src="http://localhost/YoutubeApi_CodigoEmbed/js/widget.js" defer></script>
          <div class="mi-widget" data-video-url="https://www.youtube.com/channel/${channelId}" data-template="YouTube Subscribe"></div>
            `;
          } else if (url.includes("/@")) {
            const handle = url.split("/@")[1];
            embedCode = `
          <script src="http://localhost/YoutubeApi_CodigoEmbed/js/widget.js" defer></script>
          <div class="mi-widget" data-video-url="https://www.youtube.com/@${handle}" data-template="YouTube Subscribe"></div>
            `;
          } else {
            alert("La URL no es válida para YouTube Subscribe.");
            return;
          }
          break;
        }
        case "Video Gallery": {
          // Para galería de videos, basamos el embed en el canal
          if (url.includes("/channel/")) {
            const channelId = url.split("/channel/")[1];
            embedCode = `
            <script src="http://localhost/YoutubeApi_CodigoEmbed/js/widget.js" defer></script>
            <div class="mi-widget" data-video-url="https://www.youtube.com/channel/${channelId}" data-template="Video Gallery"></div>
            `;
          } else if (url.includes("/@")) {
            const handle = url.split("/@")[1];
            embedCode = `
            <script src="http://localhost/YoutubeApi_CodigoEmbed/js/widget.js" defer></script>
            <div class="mi-widget" data-video-url="https://www.youtube.com/@${handle}" data-template="Video Gallery"></div>
            `;
          } else {
            alert("La URL no es válida para Video Gallery.");
            return;
          }
          break;
        }
        case "Video List": {
          // Similar al Video Gallery, basado en canal
          if (url.includes("/channel/")) {
            const channelId = url.split("/channel/")[1];
            embedCode = `
            <script src="http://localhost/YoutubeApi_CodigoEmbed/js/widget.js" defer></script>
            <div class="mi-widget" data-video-url="https://www.youtube.com/channel/${channelId}" data-template="Video List"></div>
            `;
          } else if (url.includes("/@")) {
            const handle = url.split("/@")[1];
            embedCode = `
            <script src="http://localhost/YoutubeApi_CodigoEmbed/js/widget.js" defer></script>
            <div class="mi-widget" data-video-url="https://www.youtube.com/@${handle}" data-template="Video List"></div>
            `;
          } else {
            alert("La URL no es válida para Video List.");
            return;
          }
          break;
        }
        default:
          alert("Por favor, selecciona un tipo de plantilla.");
          return;
      }
    } catch (e) {
      alert("URL inválida. Verifica el formato.");
      return;
    }

    prompt("Copia el código embed:", embedCode);
  });
});

