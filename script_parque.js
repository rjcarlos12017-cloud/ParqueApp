// --- CONFIGURACIÓN DE LAS ZONAS DEL PARQUE (GEOCERCAS) ---
// Las coordenadas deben ser listas de [Latitud, Longitud]
const ZONES = [
    {
        name: "Jaula de los Leones (Zona África)",
        color: "#FFA500", // Naranja
        coordinates: [ 
            [-12.0725, -77.0848],
            [-12.0725, -77.0840],
            [-12.0718, -77.0840],
            [-12.0718, -77.0848]
        ]
    },
    {
        name: "Zona Selva",
        color: "#008000", // Verde
        coordinates: [
            [-12.0740, -77.0860],
            [-12.0740, -77.0850],
            [-12.0730, -77.0850],
            [-12.0730, -77.0860]
        ]
    }
    // Añade más zonas aquí si lo deseas
];

// --- 1. Inicialización del Mapa Leaflet ---
// Lima (coordenadas aproximadas del Parque de las Leyendas)
const initialCoords = [-12.0735, -77.0850]; 
const map = L.map('map').setView(initialCoords, 16); // 16 es el nivel de zoom

// Agrega la capa de tiles (el fondo del mapa, de OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Inicializa el marcador de ubicación
let userMarker = null;

// --- 2. Dibuja las Geocercas en el Mapa ---
ZONES.forEach(zone => {
    L.polygon(zone.coordinates, {
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: 0.3
    }).addTo(map)
      .bindTooltip(zone.name); // Muestra el nombre al pasar el ratón
});

// --- 3. Lógica de Verificación (Punto dentro de Polígono) ---
function isPointInPolygon(point, polygon) {
    // Implementación del algoritmo Ray Casting (o Winding Number) para saber si un punto está dentro de un polígono.
    // Usaremos un método simplificado de GeoJSON/Leaflet para simplificar la lógica.
    let x = point.lat;
    let y = point.lng;
    
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = polygon[i][0], yi = polygon[i][1];
        let xj = polygon[j][0], yj = polygon[j][1];
        
        let intersect = ((yi > y) !== (yj > y))
            && (y < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// --- 4. Obtener Ubicación Real del Usuario ---
function onLocationFound(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    
    // Si ya existe un marcador, lo mueve. Si no, lo crea.
    if (userMarker) {
        userMarker.setLatLng(e.latlng);
    } else {
        userMarker = L.marker(e.latlng).addTo(map)
            .bindPopup("¡Tu Posición!").openPopup();
    }
    
    // Mueve la vista del mapa a la ubicación del usuario
    map.setView(e.latlng, 17);

    // Ejecuta la verificación de geocerca
    checkGeofence({ lat, lng });
}

function onLocationError(e) {
    document.getElementById('status-message').innerHTML = `<span class="outside-zone">ERROR: ${e.message}. Asegúrate de habilitar el GPS.</span>`;
    console.error(e);
}

// Escucha los eventos de ubicación del navegador
map.on('locationfound', onLocationFound);
map.on('locationerror', onLocationError);

// Inicia la búsqueda de la ubicación (usa el GPS del navegador)
map.locate({setView: true, maxZoom: 16, watch: true, enableHighAccuracy: true});


// --- 5. Función que verifica la ubicación con las Zonas ---
function checkGeofence(currentLocation) {
    let statusElement = document.getElementById('status-message');
    let foundZone = false;
    let message = "Estás en el Parque, pero fuera de una zona definida.";
    statusElement.className = "outside-zone";

    ZONES.forEach(zone => {
        // La librería Leaflet almacena las coordenadas como [Lat, Lng].
        // Usamos el punto actual y las coordenadas de la zona para la verificación
        if (isPointInPolygon(currentLocation, zone.coordinates)) {
            message = `¡Estás en la ${zone.name}! 🐅`;
            statusElement.className = "inside-zone";
            foundZone = true;
        }
    });

    if (!foundZone) {
        // Verifica si está cerca del parque si no está en una zona definida
        message = "Parece que estás fuera de las zonas específicas. Asegúrate de estar dentro del Parque.";
    }

    statusElement.innerHTML = message;
}