// Mapa Geográfico Oficial e Interactivo de Antioquia con Leaflet.js y DANE GeoJSON
// 125 Municipios y 9 Subregiones

const SUBREGION_COLORS = {
  "URABÁ": { fill: "#2e7d32", border: "#1b5e20" },
  "BAJO CAUCA": { fill: "#00897b", border: "#004d40" },
  "NORTE": { fill: "#43a047", border: "#1b5e20" },
  "NORDESTE": { fill: "#0288d1", border: "#01579b" },
  "OCCIDENTE": { fill: "#7cb342", border: "#33691e" },
  "VALLE DE ABURRÁ": { fill: "#f59e0b", border: "#b45309" },
  "ORIENTE": { fill: "#00acc1", border: "#006064" },
  "SUROESTE": { fill: "#8d6e63", border: "#4e342e" },
  "MAGDALENA MEDIO": { fill: "#e53935", border: "#b71c1c" }
};

let mapInstance = null;
let geojsonLayer = null;
let currentStats = {};
let onSubregionSelectCallback = null;
let activeSelectedSubregion = "ALL";

function initAntioquiaLeafletMap(containerId, onSelectSubregion) {
  onSubregionSelectCallback = onSelectSubregion;

  const container = document.getElementById(containerId);
  if (!container) return;

  // Limpiar contenido previo y crear contenedor de mapa
  container.innerHTML = `
    <div class="map-controls-bar">
      <div class="map-legend-pills" id="mapLegendPills">
        <!-- Píldoras de subregiones -->
      </div>
      <button class="btn-reset-map-view" id="btnResetMapView" title="Centrar mapa en Antioquia">🎯 Centrar</button>
    </div>
    <div id="antioquiaLeafletMap" class="leaflet-map-frame"></div>
  `;

  // Renderizar píldoras de convenciones
  const legendContainer = document.getElementById("mapLegendPills");
  let legendHtml = `<button class="subreg-pill active" data-sub="ALL">Todas</button>`;
  for (const [subreg, colors] of Object.entries(SUBREGION_COLORS)) {
    legendHtml += `
      <button class="subreg-pill" data-sub="${subreg}">
        <span class="pill-dot" style="background-color: ${colors.fill};"></span>
        ${subreg}
      </button>
    `;
  }
  legendContainer.innerHTML = legendHtml;

  // Eventos de las píldoras
  legendContainer.querySelectorAll(".subreg-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      const sub = pill.dataset.sub;
      if (typeof onSubregionSelectCallback === "function") {
        onSubregionSelectCallback(sub);
      }
    });
  });

  document.getElementById("btnResetMapView").addEventListener("click", () => {
    if (mapInstance && geojsonLayer) {
      mapInstance.fitBounds(geojsonLayer.getBounds(), { padding: [15, 15] });
    }
  });

  // Inicializar Leaflet centrado en Antioquia
  mapInstance = L.map('antioquiaLeafletMap', {
    center: [7.0, -75.5],
    zoom: 7,
    zoomControl: true,
    scrollWheelZoom: true
  });

  // Capa base limpia y elegante de OpenStreetMap / CartoDB Positron
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abcd',
    maxZoom: 18,
    minZoom: 6
  }).addTo(mapInstance);

  // Cargar capa GeoJSON de los 125 municipios
  renderGeoJsonLayer();
}

function renderGeoJsonLayer() {
  if (!mapInstance || typeof ANTIOQUIA_GEOJSON === "undefined") return;

  if (geojsonLayer) {
    mapInstance.removeLayer(geojsonLayer);
  }

  geojsonLayer = L.geoJSON(ANTIOQUIA_GEOJSON, {
    style: styleFeature,
    onEachFeature: onEachFeatureHandler
  }).addTo(mapInstance);

  // Ajustar la vista para encuadrar todo el departamento de Antioquia
  mapInstance.fitBounds(geojsonLayer.getBounds(), { padding: [10, 10] });
}

function styleFeature(feature) {
  const subreg = feature.properties.subregion;
  const colors = SUBREGION_COLORS[subreg] || { fill: "#64748b", border: "#334155" };
  
  const isSelected = (activeSelectedSubregion === "ALL" || activeSelectedSubregion === subreg);

  return {
    fillColor: colors.fill,
    weight: isSelected ? 1.2 : 0.8,
    opacity: 1,
    color: '#ffffff',
    fillOpacity: isSelected ? (activeSelectedSubregion === subreg ? 0.85 : 0.65) : 0.15
  };
}

function onEachFeatureHandler(feature, layer) {
  const muni = feature.properties.municipio;
  const subreg = feature.properties.subregion;

  layer.on({
    mouseover: (e) => {
      const l = e.target;
      l.setStyle({
        weight: 3,
        color: '#f59e0b',
        fillOpacity: 0.95
      });
      l.bringToFront();

      // Consultar estadísticas de la subregión y del municipio
      const sStats = currentStats[subreg] || { count: 0, total: 0, km: 0 };
      const mStats = currentStats.municipios ? (currentStats.municipios[muni] || { count: 0, total: 0 }) : { count: 0, total: 0 };

      const formattedTotalMuni = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(mStats.total);
      const formattedTotalSub = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(sStats.total);

      const tooltipContent = `
        <div class="map-tt-container">
          <div class="map-tt-header">${muni}</div>
          <div class="map-tt-sub">Subregión: <strong>${subreg}</strong></div>
          <div class="map-tt-divider"></div>
          <div class="map-tt-line"><span>Proyectos en ${muni}:</span> <strong>${mStats.count}</strong></div>
          <div class="map-tt-line"><span>Inversión en ${muni}:</span> <strong>${mStats.total > 0 ? formattedTotalMuni : '$ 0'}</strong></div>
          <div class="map-tt-divider"></div>
          <div class="map-tt-line"><span>Total Subregión:</span> <strong>${sStats.count} proy. (${formattedTotalSub})</strong></div>
          <div class="map-tt-action">👆 Clic para filtrar ${subreg}</div>
        </div>
      `;

      layer.bindTooltip(tooltipContent, {
        sticky: true,
        className: 'leaflet-custom-tooltip',
        offset: [15, 0]
      }).openTooltip();
    },

    mouseout: (e) => {
      geojsonLayer.resetStyle(e.target);
    },

    click: (e) => {
      if (typeof onSubregionSelectCallback === "function") {
        onSubregionSelectCallback(subreg);
      }
    }
  });
}

// Actualizar estadísticas del mapa
function updateMapStats(subregionStats, muniStats) {
  currentStats = subregionStats || {};
  if (muniStats) currentStats.municipios = muniStats;
}

// Resaltar subregión seleccionada en el mapa
function highlightSubregionInMap(selectedSubregion) {
  activeSelectedSubregion = selectedSubregion || "ALL";

  if (geojsonLayer) {
    geojsonLayer.eachLayer(layer => {
      const sub = layer.feature.properties.subregion;
      const isMatch = (activeSelectedSubregion === "ALL" || activeSelectedSubregion === sub);
      const colors = SUBREGION_COLORS[sub] || { fill: "#64748b", border: "#334155" };

      layer.setStyle({
        fillColor: colors.fill,
        fillOpacity: isMatch ? (activeSelectedSubregion === sub ? 0.85 : 0.65) : 0.15,
        weight: activeSelectedSubregion === sub ? 2.5 : 1,
        color: activeSelectedSubregion === sub ? '#d97706' : '#ffffff'
      });
    });
  }

  // Actualizar píldoras activas
  document.querySelectorAll("#mapLegendPills .subreg-pill").forEach(p => {
    if (p.dataset.sub === activeSelectedSubregion) {
      p.classList.add("active");
    } else {
      p.classList.remove("active");
    }
  });
}
