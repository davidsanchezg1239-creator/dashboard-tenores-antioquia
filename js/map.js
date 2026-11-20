// Mapa Geográfico Oficial e Interactivo de Antioquia con Leaflet.js
// Basado directamente en el Shapefile Oficial de Subregiones de la Gobernación de Antioquia (Subregiones.shp)

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

const SUBREGION_CENTROIDS = {
  "VALLE DE ABURRÁ": [6.28, -75.45],
  "BAJO CAUCA": [7.65, -75.12],
  "MAGDALENA MEDIO": [6.55, -74.60],
  "NORDESTE": [6.95, -74.85],
  "NORTE": [7.00, -75.48],
  "OCCIDENTE": [6.74, -76.05],
  "ORIENTE": [6.05, -75.25],
  "SUROESTE": [5.90, -75.80],
  "URABÁ": [7.60, -76.65]
};

let mapInstance = null;
let subregOfficialLayer = null;
let muniLayer = null;
let labelMarkersGroup = null;
let currentStats = {};
let onSubregionSelectCallback = null;
let activeSelectedSubregion = "ALL";
let currentViewMode = "subregiones"; // 'subregiones' (Shapefile puro por defecto) | 'con_municipios'

function initAntioquiaLeafletMap(containerId, onSelectSubregion) {
  onSubregionSelectCallback = onSelectSubregion;

  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="map-controls-bar">
      <div class="map-layer-switcher">
        <span class="layer-switch-label">Capa Activa:</span>
        <button class="layer-btn active" id="btnLayerSubregiones" title="Shapefile Oficial de la Gobernación de Antioquia">🗺️ Shapefile Subregiones</button>
        <button class="layer-btn" id="btnLayerConMunicipios" title="Subregiones con subdivisión municipal">🏛️ Con Municipios</button>
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

  // Switcher de capas
  document.getElementById("btnLayerSubregiones").addEventListener("click", () => setViewMode("subregiones"));
  document.getElementById("btnLayerConMunicipios").addEventListener("click", () => setViewMode("con_municipios"));

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

  // Capa base limpia CARTO Voyager
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CARTO &copy; OpenStreetMap',
    subdomains: 'abcd',
    maxZoom: 18,
    minZoom: 6
  }).addTo(mapInstance);

  labelMarkersGroup = L.layerGroup().addTo(mapInstance);

  renderLayers();
}

function setViewMode(mode) {
  currentViewMode = mode;
  document.querySelectorAll(".layer-btn").forEach(b => b.classList.remove("active"));
  if (mode === "subregiones") document.getElementById("btnLayerSubregiones").classList.add("active");
  if (mode === "con_municipios") document.getElementById("btnLayerConMunicipios").classList.add("active");

  renderLayers();
}

function renderLayers() {
  if (!mapInstance) return;

  if (muniLayer) mapInstance.removeLayer(muniLayer);
  if (subregOfficialLayer) mapInstance.removeLayer(subregOfficialLayer);
  if (labelMarkersGroup) labelMarkersGroup.clearLayers();

  // 1. Capa Oficial del Shapefile de Subregiones
  if (currentViewMode === "subregiones") {
    if (typeof SUBREGIONES_OFICIALES_GEOJSON !== "undefined") {
      subregOfficialLayer = L.geoJSON(SUBREGIONES_OFICIALES_GEOJSON, {
        style: styleOfficialSubregion,
        onEachFeature: onEachOfficialSubregionHandler
      }).addTo(mapInstance);

      mapInstance.fitBounds(subregOfficialLayer.getBounds(), { padding: [10, 10] });
      renderSubregionCentroidLabels();
    }
  }

  // 2. Capa Con Municipios (Shapefile contornos + Municipios)
  if (currentViewMode === "con_municipios") {
    if (typeof ANTIOQUIA_GEOJSON !== "undefined") {
      muniLayer = L.geoJSON(ANTIOQUIA_GEOJSON, {
        style: styleMuniFeature,
        onEachFeature: onEachMuniFeatureHandler
      }).addTo(mapInstance);
    }

    if (typeof SUBREGIONES_OFICIALES_GEOJSON !== "undefined") {
      subregOfficialLayer = L.geoJSON(SUBREGIONES_OFICIALES_GEOJSON, {
        style: () => ({
          fill: false,
          color: '#0f172a',
          weight: 2.5,
          opacity: 0.9,
          dashArray: '3, 2'
        }),
        interactive: false
      }).addTo(mapInstance);
    }

    if (muniLayer) {
      mapInstance.fitBounds(muniLayer.getBounds(), { padding: [10, 10] });
    }
  }
}

// Rótulos con nombres de las subregiones en el mapa
function renderSubregionCentroidLabels() {
  if (!labelMarkersGroup) return;
  labelMarkersGroup.clearLayers();

  for (const [subreg, coords] of Object.entries(SUBREGION_CENTROIDS)) {
    const sStats = currentStats[subreg] || { count: 0, total: 0 };
    const labelHtml = `
      <div class="subregion-map-badge" data-sub="${subreg}">
        <span>${subreg}</span>
        ${sStats.count > 0 ? `<small class="badge-subcount">${sStats.count} proy.</small>` : ''}
      </div>
    `;

    const icon = L.divIcon({
      html: labelHtml,
      className: 'custom-subreg-div-icon',
      iconSize: [110, 24],
      iconAnchor: [55, 12]
    });

    const marker = L.marker(coords, { icon: icon, interactive: false });
    labelMarkersGroup.addLayer(marker);
  }
}

// Estilos del Shapefile Oficial de Subregiones
function styleOfficialSubregion(feature) {
  const subreg = feature.properties.subregion;
  const colors = SUBREGION_COLORS[subreg] || { fill: "#64748b", border: "#334155" };
  const isSelected = (activeSelectedSubregion === "ALL" || activeSelectedSubregion === subreg);

  return {
    fillColor: colors.fill,
    weight: isSelected ? 2.5 : 1.2,
    opacity: 1,
    color: isSelected ? (activeSelectedSubregion === subreg ? '#f59e0b' : '#ffffff') : '#e2e8f0',
    fillOpacity: isSelected ? (activeSelectedSubregion === subreg ? 0.88 : 0.70) : 0.20
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
          <div class="map-tt-header" style="font-size: 0.95rem;">SUBREGIÓN ${subreg}</div>
          <div class="map-tt-sub">Shapefile Oficial Gobernación de Antioquia</div>
          <div class="map-tt-divider"></div>
          <div class="map-tt-line"><span>Contratos / Proyectos:</span> <strong>${sStats.count}</strong></div>
          <div class="map-tt-line"><span>Inversión Contratada:</span> <strong>${formattedSub}</strong></div>
          <div class="map-tt-line"><span>Longitud Vial Intervenida:</span> <strong>${sStats.km.toFixed(2)} km</strong></div>
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

// Estilos de Municipios
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

// Actualizar estadísticas del mapa
function updateMapStats(subregionStats, muniStats) {
  currentStats = subregionStats || {};
  if (muniStats) currentStats.municipios = muniStats;
  if (currentViewMode === "subregiones") {
    renderSubregionCentroidLabels();
  }
}

// Resaltar subregión seleccionada en el mapa
function highlightSubregionInMap(selectedSubregion) {
  activeSelectedSubregion = selectedSubregion || "ALL";

  if (subregOfficialLayer && currentViewMode === "subregiones") {
    subregOfficialLayer.eachLayer(layer => {
      const sub = layer.feature.properties.subregion;
      const isMatch = (activeSelectedSubregion === "ALL" || activeSelectedSubregion === sub);
      const colors = SUBREGION_COLORS[sub] || { fill: "#64748b", border: "#334155" };
      layer.setStyle({
        fillColor: colors.fill,
        fillOpacity: isMatch ? (activeSelectedSubregion === sub ? 0.90 : 0.70) : 0.20,
        weight: activeSelectedSubregion === sub ? 3.5 : 1.2,
        color: activeSelectedSubregion === sub ? '#f59e0b' : '#ffffff'
      });
    });
  }

  if (muniLayer && currentViewMode === "con_municipios") {
    muniLayer.eachLayer(layer => {
      const sub = layer.feature.properties.subregion;
      const isMatch = (activeSelectedSubregion === "ALL" || activeSelectedSubregion === sub);
      const colors = SUBREGION_COLORS[sub] || { fill: "#64748b", border: "#334155" };
      layer.setStyle({
        fillColor: colors.fill,
        fillOpacity: isMatch ? (activeSelectedSubregion === sub ? 0.85 : 0.65) : 0.15,
        weight: activeSelectedSubregion === sub ? 2.5 : 1,
        color: activeSelectedSubregion === sub ? '#f59e0b' : '#ffffff'
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
