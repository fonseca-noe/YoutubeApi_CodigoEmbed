<?php
header("Content-Type: application/json");

if (!isset($_GET['videoId']) && !isset($_GET['channelId']) && !isset($_GET['handle']) && !isset($_GET['videos']) && !isset($_GET['videoGallery']) && !isset($_GET['videoGrid'])) {
    echo json_encode(["error" => "Falta el ID del video, canal o handle"]);
    exit;
}

$API_KEY = "Tu_api_key";  // Reemplázala con tu clave real

if (isset($_GET['videoId'])) {
    $videoId = $_GET['videoId'];

    // Verificar si se solicitan comentarios
    if (isset($_GET['comments']) && $_GET['comments'] === 'true') {
        $API_URL = "https://www.googleapis.com/youtube/v3/commentThreads?videoId=$videoId&part=snippet&key=$API_KEY&maxResults=25";
    } else {
        $API_URL = "https://www.googleapis.com/youtube/v3/videos?id=$videoId&part=snippet,statistics&key=$API_KEY";
    }
} elseif (isset($_GET['channelId'])) {
    $channelId = $_GET['channelId'];
    $API_URL = "https://www.googleapis.com/youtube/v3/channels?id=$channelId&part=snippet,statistics,brandingSettings&key=$API_KEY";

} elseif (isset($_GET['handle'])) {
    $handle = $_GET['handle'];
    $API_URL = "https://www.googleapis.com/youtube/v3/channels?forHandle=$handle&part=id,snippet,statistics&key=$API_KEY";

} elseif (isset($_GET['videos'])) {
    $channelId = $_GET['videos'];
    // Obtener los últimos videos subidos por el canal
    $API_URL = "https://www.googleapis.com/youtube/v3/search?key=$API_KEY&channelId=$channelId&part=snippet&type=video&order=date&maxResults=3";
}

elseif (isset($_GET['videoGallery'])) {
    $channelId = $_GET['videoGallery'];
    // 1. Obtener los últimos videos con search
    $API_URL_SEARCH = "https://www.googleapis.com/youtube/v3/search?key=$API_KEY&channelId=$channelId&part=snippet&type=video&order=date&maxResults=32";
    $response_search = file_get_contents($API_URL_SEARCH);

    if ($response_search === false) {
        echo json_encode(["error" => "Error al obtener datos de YouTube API (search)"]);
        exit;
    }

    $data_search = json_decode($response_search, true);
    $videoIds = [];

    // Extraer los videoIds de la respuesta
    foreach ($data_search['items'] as $item) {
        if (isset($item['id']['videoId'])) {
            $videoIds[] = $item['id']['videoId'];
        }
    }

    // Verifica que se hayan obtenido IDs
    if (empty($videoIds)) {
        echo json_encode(["error" => "No se encontraron videos en la búsqueda."]);
        exit;
    }

    $videoIdsString = implode(",", $videoIds);

    // 2. Obtener los detalles (snippet y statistics) de los videos usando el endpoint "videos"
    $API_URL_VIDEOS = "https://www.googleapis.com/youtube/v3/videos?key=$API_KEY&id=$videoIdsString&part=snippet,statistics";
    $response_videos = file_get_contents($API_URL_VIDEOS);

    if ($response_videos === false) {
        
        echo json_encode(["error" => "Error al obtener datos de YouTube API (videos)"]);
        exit;
    }

    echo $response_videos;
    exit;
}


$response = file_get_contents($API_URL);

if ($response === false) {
    echo json_encode(["error" => "Error al obtener datos de YouTube API"]);
    exit;
}


echo $response;
?>