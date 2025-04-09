document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".mi-widget").forEach(widget => {
        const videoUrl = widget.getAttribute("data-video-url");
        const template = widget.getAttribute("data-template") || "";

        if (!videoUrl) {
            console.error("Error: No se proporcionó un video.");
            widget.innerHTML = "<p style='color: red;'>Error: No se proporcionó un video.</p>";
            return;
        }

        // Crear el iframe que apunta a widget.html y pasar videoUrl y template como parámetros
        const iframe = document.createElement("iframe");
        iframe.src = `https://925398678.senati.chat.pe/widget.html?videoUrl=${encodeURIComponent(videoUrl)}&template=${encodeURIComponent(template)}`;
        iframe.width = "100%";
        iframe.height = "300px"; // Altura inicial pequeña
        iframe.allowFullscreen = true;
        iframe.style.border = "none";
        iframe.style.transition = "height 0.3s ease-in-out";

        widget.appendChild(iframe);

        window.addEventListener("message", (event) => {
            if (event.data.type === "resize" && event.data.height) {
                iframe.style.height = event.data.height + "px";
            }
        });
    });
});
