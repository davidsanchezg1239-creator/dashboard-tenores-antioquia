// Mapa Geográfico Oficial e Interactivo de Antioquia con Leaflet.js
// Soporta: Capa Municipal (125 municipios) y Capa Oficial Shapefile de Subregiones (Gobernación de Antioquia)

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
let muniLayer = null;
let subregOfficialLayer = null;
let currentStats = {};
let onSubregionSelectCallback = null;
let activeSelectedSubregion = "ALL";
let currentViewMode = "combined"; // 'combined' | 'subregiones' | 'municipios'

function initAntioquiaLeafletMap(containerId, onSelectSubregion) {
  onSubregionSelectCallback = onSelectSubregion;

  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="map-controls-bar">
      <div class="map-layer-switcher">
        <span class="layer-switch-label">Capas SIG:</span>
        <button class="layer-btn active" id="btnLayerCombined" title="Municipios con contorno de Subregión Shapefile">✨ Combinada</button>
        <button class="layer-btn" id="btnLayerSubregiones" title="Shapefile Oficial de Subregiones">🗺️ Shapefile Subregiones</button>
        <button class="layer-btn" id="btnLayerMunicipios" title="Detalle 125 Municipios">🏛️ Municipios</button>
      </div>
      <button class="btn-reset-map-view" id="btnResetMapView" title="Centrar mapa en Antioquia">🎯 Centrar</button>
    </div>
    <div class="map-legend-pills" id="mapLegendPills"></div>
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

  // Eventos de píldoras
  legendContainer.querySelectorAll(".subreg-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      const sub = pill.dataset.sub;
      if (typeof onSubregionSelectCallback === "function") {
        onSubregionSelectCallback(sub);
      }
    });
  });

  // Switcher de Capas
  const btnComb = document.getElementById("btnLayerCombined");
  const btnSub = document.getElementById("btnLayerSubregiones");
  const btnMun = document.getElementById("btnLayerMunicipios");

  btnComb.addEventListener("click", () => setViewMode("combined"));
  btnSub.addEventListener("click", () => setViewMode("subregiones"));
  btnMun.addEventListener("click", () => setViewMode("municipios"));

  document.getElementById("btnResetMapView").addEventListener("click", () => {
    if (mapInstance && (subregOfficialLayer || muniLayer)) {
      const targetLayer = subregOfficialLayer || muniLayer;
      mapInstance.fitBounds(targetLayer.getBounds(), { padding: [15, 15] });
    }
  });

  // Inicializar Leaflet centrado en Antioquia
  mapInstance = L.map('antioquiaLeafletMap', {
    center: [7.0, -75.5],
    zoom: 7,
    zoomControl: true,
    scrollWheelZoom: true
  });

  // Capa base limpia y elegante de CARTO Voyager
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CARTO &copy; OpenStreetMap',
    subdomains: 'abcd',
    maxZoom: 18,
    minZoom: 6
  }).addTo(mapInstance);

  // Renderizar capas GeoJSON
  renderAllLayers();
}

function setViewMode(mode) {
  currentViewMode = mode;
  document.querySelectorAll(".layer-btn").forEach(b => b.classList.remove("active"));
  if (mode === "combined") document.getElementById("btnLayerCombined").classList.add("active");
  if (mode === "subregiones") document.getElementById("btnLayerSubregiones").classList.add("active");
  if (mode === "municipios") document.getElementById("btnLayerMunicipios").classList.add("active");

  renderAllLayers();
}

function renderAllLayers() {
  if (!mapInstance) return;

  // Remover capas previas
  if (muniLayer) mapInstance.removeLayer(muniLayer);
  if (subregOfficialLayer) mapInstance.removeLayer(subregOfficialLayer);

  // 1. Modo Subregiones Oficiales (Shapefile puro)
  if (currentViewMode === "subregiones") {
    if (typeof SUBREGIONES_OFICIALES_GEOJSON !== "undefined") {
      subregOfficialLayer = L.geoJSON(SUBREGIONES_OFICIALES_GEOJSON, {
        style: styleOfficialSubregion,
        onEachFeature: onEachOfficialSubregionHandler
      }).addTo(mapInstance);
      mapInstance.fitBounds(subregOfficialLayer.getBounds(), { padding: [10, 10] });
    }
    return;
  }

  // 2. Modo Municipios
  if (currentViewMode === "municipios") {
    if (typeof ANTIOQUIA_GEOJSON !== "undefined") {
      muniLayer = L.geoJSON(ANTIOQUIA_GEOJSON, {
        style: styleMuniFeature,
        onEachFeature: onEachMuniFeatureHandler
      }).addTo(mapInstance);
      mapInstance.fitBounds(muniLayer.getBounds(), { padding: [10, 10] });
    }
    return;
  }

  // 3. Modo Combinado (Municipios detallados + Contorno grueso oficial de Subregiones)
  if (currentViewMode === "combined") {
    if (typeof ANTIOQUIA_GEOJSON !== "undefined") {
      muniLayer = L.geoJSON(ANTIOQUIA_GEOJSON, {
        style: styleMuniFeature,
        onEachFeature: onEachMuniFeatureHandler
      }).addTo(mapInstance);
    }
    if (typeof SUBREGIONES_OFICIALES_GEOJSON !== "undefined") {
      subregOfficialLayer = L.geoJSON(SUBREGIONES_OFICIALES_GEOJSON, {
        style: (f) => ({
          fill: false,
          color: '#0f172a',
          weight: 2.8,
          opacity: 0.85,
          dashArray: '4, 2'
        }),
        interactive: false
      }).addTo(mapInstance);
    }
    if (muniLayer) {
      mapInstance.fitBounds(muniLayer.getBounds(), { padding: [10, 10] });
    }
  }
}

// Estilos para Municipios
function styleMuniFeature(feature) {
  const subreg = feature.properties.subregion;
  const colors = SUBREGION_COLORS[subreg] || { fill: "#64748b", border: "#334155" };
  const isSelected = (activeSelectedSubregion === "ALL" || activeSelectedSubregion === subreg);

  return {
    fillColor: colors.fill,
    weight: isSelected ? 1 : 0.6,
    opacity: 1,
    color: '#ffffff',
    fillOpacity: isSelected ? (activeSelectedSubregion === subreg ? 0.85 : 0.65) : 0.15
  };
}

function onEachMuniFeatureHandler(feature, layer) {
  const muni = feature.properties.municipio;
  const subreg = feature.properties.subregion;

  layer.on({
    mouseover: (e) => {
      const l = e.target;
      l.setStyle({ weight: 3, color: '#f59e0b', fillOpacity: 0.95 });
      l.bringToFront();

      const sStats = currentStats[subreg] || { count: 0, total: 0, km: 0 };
      const mStats = currentStats.municipios ? (currentStats.municipios[muni] || { count: 0, total: 0 }) : { count: 0, total: 0 };
      const formattedMuni = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(mStats.total);
      const formattedSub = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(sStats.total);

      const html = `
        <div class="map-tt-container">
          <div class="map-tt-header">${muni}</div>
          <div class="map-tt-sub">Subregión: <strong>${subreg}</strong></div>
          <div class="map-tt-divider"></div>
          <div class="map-tt-line"><span>Proyectos en ${muni}:</span> <strong>${mStats.count}</strong></div>
          <div class="map-tt-line"><span>Inversión en ${muni}:</span> <strong>${mStats.total > 0 ? formattedMuni : '$ 0'}</strong></div>
          <div class="map-tt-divider"></div>
          <div class="map-tt-line"><span>Total Subregión:</span> <strong>${sStats.count} proy. (${formattedSub})</strong></div>
          <div class="map-tt-action">👆 Clic para filtrar ${subreg}</div>
        </div>
      `;
      layer.bindTooltip(html, { sticky: true, className: 'leaflet-custom-tooltip', offset: [15, 0] }).openTooltip();
    },
    mouseout: (e) => {
      if (muniLayer) muniLayer.resetStyle(e.target);
    },
    click: () => {
      if (typeof onSubregionSelectCallback === "function") {
        onSubregionSelectCallback(subreg);
      }
    }
  });
}

// Estilos para Subregiones Oficiales (Shapefile)
function styleOfficialSubregion(feature) {
  const subreg = feature.properties.subregion;
  const colors = SUBREGION_COLORS[subreg] || { fill: "#64748b", border: "#334155" };
  const isSelected = (activeSelectedSubregion === "ALL" || activeSelectedSubregion === subreg);

  return {
    fillColor: colors.fill,
    weight: isSelected ? 2.5 : 1.2,
    opacity: 1,
    color: isSelected ? (activeSelectedSubregion === subreg ? '#d97706' : '#ffffff') : '#cbd5e1',
    fillOpacity: isSelected ? (activeSelectedSubregion === subreg ? 0.85 : 0.65) : 0.2
  };
}

function onEachOfficialSubregionHandler(feature, layer) {
  const subreg = feature.properties.subregion;

  layer.on({
    mouseover: (e) => {
      const l = e.target;
      l.setStyle({ weight: 4, color: '#f59e0b', fillOpacity: 0.95 });
      l.bringToFront();

      const sStats = currentStats[subreg] || { count: 0, total: 0, km: 0 };
      const formattedSub = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(sStats.total);

      const html = `
        <div class="map-tt-container">
          <div class="map-tt-header" style="font-size: 1rem;">SUBREGIÓN ${subreg}</div>
          <div class="map-tt-sub">Shapefile Oficial Gobernación</div>
          <div class="map-tt-divider"></div>
          <div class="map-tt-line"><span>Contratos / Proyectos:</span> <strong>${sStats.count}</strong></div>
          <div class="map-tt-line"><span>Inversión Total:</span> <strong>${formattedSub}</strong></div>
          <div class="map-tt-line"><span>Longitud Vial:</span> <strong>${sStats.km.toFixed(2)} km</strong></div>
          <div class="map-tt-action">👆 Clic para filtrar toda la subregión</div>
        </div>
      `;
      layer.bindTooltip(html, { sticky: true, className: 'leaflet-custom-tooltip', offset: [15, 0] }).openTooltip();
    },
    mouseout: (e) => {
      if (subregOfficialLayer) subregOfficialLayer.resetStyle(e.target);
    },
    click: () => {
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

// Resaltar subregión seleccionada
function highlightSubregionInMap(selectedSubregion) {
  activeSelectedSubregion = selectedSubregion || "ALL";

  if (muniLayer && currentViewMode !== "subregiones") {
    muniLayer.eachLayer(layer => {
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

  if (subregOfficialLayer && currentViewMode === "subregiones") {
    subregOfficialLayer.eachLayer(layer => {
      const sub = layer.feature.properties.subregion;
      const isMatch = (activeSelectedSubregion === "ALL" || activeSelectedSubregion === sub);
      const colors = SUBREGION_COLORS[sub] || { fill: "#64748b", border: "#334155" };
      layer.setStyle({
        fillColor: colors.fill,
        fillOpacity: isMatch ? (activeSelectedSubregion === sub ? 0.85 : 0.65) : 0.2,
        weight: activeSelectedSubregion === sub ? 3.5 : 1.5,
        color: activeSelectedSubregion === sub ? '#d97706' : '#ffffff'
      });
    });
  }

  // Actualizar píldoras
  document.querySelectorAll("#mapLegendPills .subreg-pill").forEach(p => {
    if (p.dataset.sub === activeSelectedSubregion) {
      p.classList.add("active");
    } else {
      p.classList.remove("active");
    }
  });
}
