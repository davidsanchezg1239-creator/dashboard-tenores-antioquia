// Lógica Principal de la Aplicación del Dashboard de Tenores
// Secretaría de Infraestructura - Gobernación de Antioquia

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});

const App = {
  data: null,
  filteredProjects: [],
  selectedProject: null,
  activeFilters: {
    search: "",
    year: "ALL",
    tipologia: "ALL",
    subregion: "ALL",
    municipio: "ALL"
  },
  adminPassword: "Antioquia2025*",

  init() {
    this.loadData();
    this.initFilterSelectors();
    this.setupEventListeners();
    this.initMap();
    this.applyFilters();
    this.renderSpecialTenores();
  },

  // Inicializar mapa geográfico interactivo Leaflet
  initMap() {
    initAntioquiaLeafletMap("vectorMapContainer", (clickedSubregion) => {
      if (this.activeFilters.subregion === clickedSubregion) {
        this.activeFilters.subregion = "ALL";
      } else {
        this.activeFilters.subregion = clickedSubregion;
      }
      document.getElementById("filterSubregion").value = this.activeFilters.subregion;
      this.updateMunicipioSelector();
      this.applyFilters();
    });
  },

  // Carga de datos (con soporte de persistencia local si el admin actualizó)
  loadData() {
    this.data = DB_INITIAL_DATA;
    const saved = localStorage.getItem("antioquia_infraestructura_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.projects && parsed.projects.length >= DB_INITIAL_DATA.projects.length) {
          this.data = parsed;
        } else {
          localStorage.removeItem("antioquia_infraestructura_data");
        }
      } catch (e) {
        this.data = DB_INITIAL_DATA;
      }
    }
  },

  // Inicializar desplegables de filtros con opciones únicas de la BD
  initFilterSelectors() {
    const years = new Set();
    const tipologias = new Set();
    const subregiones = new Set();

    this.data.projects.forEach(p => {
      if (p.year) years.add(p.year);
      if (p.tipologia && p.tipologia.trim()) tipologias.add(p.tipologia.trim());
      if (p.subregion && p.subregion.trim()) subregiones.add(p.subregion.trim());
    });

    // Llenar select de Años
    const yearSelect = document.getElementById("filterYear");
    yearSelect.innerHTML = '<option value="ALL">Todos los años</option>';
    Array.from(years).sort((a, b) => b - a).forEach(y => {
      yearSelect.innerHTML += `<option value="${y}">${y}</option>`;
    });

    // Llenar select de Tipologías
    const tipologiaSelect = document.getElementById("filterTipologia");
    tipologiaSelect.innerHTML = '<option value="ALL">Todas las tipologías</option>';
    Array.from(tipologias).sort().forEach(t => {
      tipologiaSelect.innerHTML += `<option value="${t}">${t}</option>`;
    });

    // Llenar select de Subregiones
    const subregionSelect = document.getElementById("filterSubregion");
    subregionSelect.innerHTML = '<option value="ALL">Todas las subregiones</option>';
    Array.from(subregiones).sort().forEach(s => {
      subregionSelect.innerHTML += `<option value="${s}">${s}</option>`;
    });

    this.updateMunicipioSelector();
  },

  // Actualizar selector de municipios dependiente de la subregión
  updateMunicipioSelector() {
    const muniSelect = document.getElementById("filterMunicipio");
    muniSelect.innerHTML = '<option value="ALL">Todos los municipios</option>';

    const municipios = new Set();
    const selectedSub = this.activeFilters.subregion;

    this.data.projects.forEach(p => {
      if (p.municipio && p.municipio.trim() && p.municipio !== "GENERAL") {
        if (selectedSub === "ALL" || p.subregion === selectedSub) {
          municipios.add(p.municipio.trim());
        }
      }
    });

    Array.from(municipios).sort().forEach(m => {
      muniSelect.innerHTML += `<option value="${m}">${m}</option>`;
    });

    muniSelect.value = this.activeFilters.municipio;
  },

  // Configuración de escuchadores de eventos
  setupEventListeners() {
    // Buscador
    const searchInput = document.getElementById("filterSearch");
    searchInput.addEventListener("input", (e) => {
      this.activeFilters.search = e.target.value.toLowerCase().trim();
      this.applyFilters();
    });

    // Año
    document.getElementById("filterYear").addEventListener("change", (e) => {
      this.activeFilters.year = e.target.value;
      this.applyFilters();
    });

    // Tipología
    document.getElementById("filterTipologia").addEventListener("change", (e) => {
      this.activeFilters.tipologia = e.target.value;
      this.applyFilters();
    });

    // Subregión
    document.getElementById("filterSubregion").addEventListener("change", (e) => {
      this.activeFilters.subregion = e.target.value;
      this.activeFilters.municipio = "ALL";
      this.updateMunicipioSelector();
      this.applyFilters();
      highlightSubregionInMap(this.activeFilters.subregion);
    });

    // Municipio
    document.getElementById("filterMunicipio").addEventListener("change", (e) => {
      this.activeFilters.municipio = e.target.value;
      this.applyFilters();
    });

    // Limpiar Filtros
    document.getElementById("btnResetFilters").addEventListener("click", () => {
      this.resetFilters();
    });

    // Botón Ver Informe Completo
    document.getElementById("btnViewFullReport").addEventListener("click", () => {
      this.openFullReportModal();
    });

    // Cerrar Modales
    document.querySelectorAll(".modal-close-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const modal = e.target.closest(".modal-overlay");
        if (modal) modal.style.display = "none";
      });
    });

    // Click fuera de modal para cerrar
    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-overlay")) {
        e.target.style.display = "none";
      }
    });

    // Botón Admin
    document.getElementById("btnAdminLogin").addEventListener("click", () => {
      this.openAdminModal();
    });

    // Autenticar Admin
    document.getElementById("btnSubmitAdminAuth").addEventListener("click", () => {
      this.handleAdminAuth();
    });

    // Carga de Excel en Admin
    document.getElementById("excelFileInput").addEventListener("change", (e) => {
      this.handleExcelUpload(e);
    });

    // Exportar data.json desde Admin
    document.getElementById("btnExportDataJson").addEventListener("click", () => {
      this.exportDataJson();
    });

    // Resetear a datos originales
    document.getElementById("btnResetDbDefaults").addEventListener("click", () => {
      if (confirm("¿Deseas restaurar la base de datos original? Se perderán las cargas locales no exportadas.")) {
        localStorage.removeItem("antioquia_infraestructura_data");
        this.loadData();
        this.initFilterSelectors();
        this.applyFilters();
        this.renderSpecialTenores();
        alert("Base de datos restaurada con éxito.");
      }
    });
  },

  // Aplicar filtros a los proyectos
  applyFilters() {
    const { search, year, tipologia, subregion, municipio } = this.activeFilters;

    this.filteredProjects = this.data.projects.filter(p => {
      // Búsqueda por texto (nombre de proyecto o municipio)
      if (search) {
        const matchName = p.proyecto.toLowerCase().includes(search);
        const matchMuni = p.municipio.toLowerCase().includes(search);
        if (!matchName && !matchMuni) return false;
      }

      // Filtro Año
      if (year !== "ALL" && p.year !== parseInt(year)) {
        return false;
      }

      // Filtro Tipología
      if (tipologia !== "ALL" && p.tipologia !== tipologia) {
        return false;
      }

      // Filtro Subregión
      if (subregion !== "ALL" && p.subregion !== subregion) {
        return false;
      }

      // Filtro Municipio
      if (municipio !== "ALL" && p.municipio !== municipio) {
        return false;
      }

      return true;
    });

    // Si había un proyecto seleccionado pero ya no está en los filtrados, deseleccionarlo
    if (this.selectedProject && !this.filteredProjects.some(p => p.id === this.selectedProject.id)) {
      this.selectedProject = null;
    }

    this.renderInfoPanel();
    this.renderMapStats();
    this.renderProjectsListPreview();
  },

  // Renderizar información en el panel central (General o Proyecto Seleccionado)
  renderInfoPanel() {
    const container = document.getElementById("generalInfoContent");
    const countBadge = document.getElementById("filteredCountBadge");
    countBadge.textContent = `${this.filteredProjects.length} proyectos`;

    if (this.selectedProject) {
      // Vista detallada del proyecto individual
      const p = this.selectedProject;
      const formattedInversion = p.valorInvertido 
        ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p.valorInvertido)
        : "No especificado";

      container.innerHTML = `
        <div class="selected-project-banner">
          <button class="btn-clear-selection" id="btnClearSelection" title="Volver al consolidado">← Ver resumen consolidado</button>
          <span class="project-tag-pill">${p.tipologia}</span>
        </div>
        <h3 class="project-title-display">${p.proyecto}</h3>

        <div class="project-metadata-grid">
          <div class="meta-item">
            <span class="meta-label">Subregión:</span>
            <strong class="meta-value">${p.subregion}</strong>
          </div>
          <div class="meta-item">
            <span class="meta-label">Municipio:</span>
            <strong class="meta-value">${p.municipio}</strong>
          </div>
          <div class="meta-item">
            <span class="meta-label">Fecha / Año:</span>
            <strong class="meta-value">${p.fecha || p.year || "N/A"}</strong>
          </div>
          <div class="meta-item">
            <span class="meta-label">Inversión Asignada:</span>
            <strong class="meta-value highlight-green">${formattedInversion}</strong>
          </div>
        </div>

        <h4 class="tenores-title">Tenores y Dimensiones de Obra</h4>
        <div class="tenores-grid">
          <div class="tenor-card">
            <div class="tenor-name">Longitud de Vía</div>
            <div class="tenor-val">${p.longitudKm !== null ? p.longitudKm + " km" : "—"}</div>
          </div>
          <div class="tenor-card">
            <div class="tenor-name">Tenor Placa Huella</div>
            <div class="tenor-val">${p.tenorPlacaHuellaKm ? this.formatCurrency(p.tenorPlacaHuellaKm) + "/km" : "—"}</div>
          </div>
          <div class="tenor-card">
            <div class="tenor-name">Pavimento Flexible</div>
            <div class="tenor-val">${p.tenorPavimentoFlexibleKm ? this.formatCurrency(p.tenorPavimentoFlexibleKm) + "/km" : "—"}</div>
          </div>
          <div class="tenor-card">
            <div class="tenor-name">Pavimento Rígido</div>
            <div class="tenor-val">${p.pavimentoRigidoKm ? this.formatCurrency(p.pavimentoRigidoKm) + "/km" : (p.pavimentoRigidoLiquidadoKm ? this.formatCurrency(p.pavimentoRigidoLiquidadoKm) + "/km (Liq.)" : "—")}</div>
          </div>
          ${p.pavimentoRigidoLiquidadoKm ? `
          <div class="tenor-card">
            <div class="tenor-name">Pav. Rígido Liquidado</div>
            <div class="tenor-val">${this.formatCurrency(p.pavimentoRigidoLiquidadoKm)}/km</div>
          </div>` : ''}
          <div class="tenor-card">
            <div class="tenor-name">Tenor Puente</div>
            <div class="tenor-val">${p.tenorPuenteMl ? this.formatCurrency(p.tenorPuenteMl) + "/mL" : "—"}</div>
          </div>
          <div class="tenor-card">
            <div class="tenor-name">Estabilización</div>
            <div class="tenor-val">${p.tenorEstabilizacionKm ? this.formatCurrency(p.tenorEstabilizacionKm) + "/km" : "—"}</div>
          </div>
        </div>
      `;

      document.getElementById("btnClearSelection").addEventListener("click", () => {
        this.selectedProject = null;
        this.renderInfoPanel();
      });

    } else {
      // Vista consolidada de la selección filtrada
      let totalInversion = 0;
      let totalKm = 0;
      let countKm = 0;
      let placaHuellaVals = [];
      let pavFlexVals = [];
      let puenteVals = [];

      this.filteredProjects.forEach(p => {
        if (p.valorInvertido) totalInversion += p.valorInvertido;
        if (p.longitudKm) {
          totalKm += p.longitudKm;
          countKm++;
        }
        if (p.tenorPlacaHuellaKm) placaHuellaVals.push(p.tenorPlacaHuellaKm);
        if (p.tenorPavimentoFlexibleKm) pavFlexVals.push(p.tenorPavimentoFlexibleKm);
        if (p.tenorPuenteMl) puenteVals.push(p.tenorPuenteMl);
      });

      const avgPlacaHuella = placaHuellaVals.length ? (placaHuellaVals.reduce((a, b) => a + b, 0) / placaHuellaVals.length) : null;
      const avgPavFlex = pavFlexVals.length ? (pavFlexVals.reduce((a, b) => a + b, 0) / pavFlexVals.length) : null;
      const avgPuente = puenteVals.length ? (puenteVals.reduce((a, b) => a + b, 0) / puenteVals.length) : null;

      container.innerHTML = `
        <div class="consolidated-header">
          <div class="status-indicator"></div>
          <span>Mostrando análisis consolidado para los criterios seleccionados:</span>
        </div>

        <div class="kpi-cards-grid">
          <div class="kpi-card main-kpi">
            <div class="kpi-label">Inversión Total Contratada</div>
            <div class="kpi-value">${this.formatSmartCurrency(totalInversion)}</div>
            <div class="kpi-subvalue">${totalInversion > 0 ? this.formatCurrency(totalInversion) : ""}</div>
            <div class="kpi-footnote">${this.filteredProjects.length} contratos analizados</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Longitud Total Intervenida</div>
            <div class="kpi-value">${totalKm.toFixed(2)} <span class="unit">km</span></div>
            <div class="kpi-footnote">en proyectos con metraje reportado</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Tenor Prom. Placa Huella</div>
            <div class="kpi-value">${avgPlacaHuella ? this.formatCompactCurrency(avgPlacaHuella) + "/km" : "N/D"}</div>
            <div class="kpi-footnote">${placaHuellaVals.length} tramos evaluados</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Tenor Prom. Pavimento</div>
            <div class="kpi-value">${avgPavFlex ? this.formatCompactCurrency(avgPavFlex) + "/km" : "N/D"}</div>
            <div class="kpi-footnote">vías departamentales</div>
          </div>
        </div>

        <div class="selection-callout">
          <em>Seleccione cualquier proyecto del listado o una subregión del mapa para consultar su ficha técnica y tenores individuales.</em>
        </div>
      `;
    }
  },

  // Lista previa rápida de proyectos
  renderProjectsListPreview() {
    const listContainer = document.getElementById("projectsListPreview");
    if (!listContainer) return;

    if (this.filteredProjects.length === 0) {
      listContainer.innerHTML = `<div class="empty-list-msg">No se encontraron proyectos con los filtros actuales.</div>`;
      return;
    }

    let html = "";
    this.filteredProjects.slice(0, 15).forEach(p => {
      const isSelected = this.selectedProject && this.selectedProject.id === p.id;
      html += `
        <div class="project-list-item ${isSelected ? 'selected' : ''}" data-id="${p.id}">
          <div class="item-title">${p.proyecto}</div>
          <div class="item-meta">
            <span class="subreg-tag">${p.subregion}</span>
            <span class="muni-tag">${p.municipio}</span>
            <span class="val-tag">${p.valorInvertido ? this.formatCompactCurrency(p.valorInvertido) : "N/D"}</span>
          </div>
        </div>
      `;
    });

    if (this.filteredProjects.length > 15) {
      html += `<div class="more-items-notice">Mostrando 15 de ${this.filteredProjects.length} proyectos. Haz clic en "Ir a ver informe completo" para ver la totalidad.</div>`;
    }

    listContainer.innerHTML = html;

    listContainer.querySelectorAll(".project-list-item").forEach(item => {
      item.addEventListener("click", () => {
        const id = parseInt(item.dataset.id);
        this.selectedProject = this.data.projects.find(p => p.id === id);
        this.renderInfoPanel();
        this.renderProjectsListPreview();
      });
    });
  },

  // Calcular estadísticas para el mapa interactivo y actualizarlo
  renderMapStats() {
    const stats = {};
    const muniStats = {};
    for (const sub of Object.keys(SUBREGION_COLORS)) {
      stats[sub] = { count: 0, total: 0, km: 0 };
    }

    this.filteredProjects.forEach(p => {
      const s = p.subregion;
      if (stats[s]) {
        stats[s].count++;
        if (p.valorInvertido) stats[s].total += p.valorInvertido;
        if (p.longitudKm) stats[s].km += p.longitudKm;
      }
      const m = p.municipio;
      if (m && m !== "GENERAL") {
        if (!muniStats[m]) muniStats[m] = { count: 0, total: 0 };
        muniStats[m].count++;
        if (p.valorInvertido) muniStats[m].total += p.valorInvertido;
      }
    });

    updateMapStats(stats, muniStats);
    highlightSubregionInMap(this.activeFilters.subregion);
  },

  // Renderizado de las tablas de tenores especializados (Alcantarillas, Box Culvert, Muros)
  renderSpecialTenores() {
    // 1. Alcantarillas
    const alcContainer = document.getElementById("tableAlcantarillasBody");
    if (alcContainer && this.data.alcantarillas) {
      let alcHtml = "";
      this.data.alcantarillas.forEach(item => {
        alcHtml += `
          <tr>
            <td><strong>${item.proyecto}</strong></td>
            <td class="text-center">${item.year}</td>
            <td class="text-right highlight-cell">${this.formatCurrency(item.tenorMl)}/mL</td>
          </tr>
        `;
      });
      alcContainer.innerHTML = alcHtml;
    }

    // 2. Box Culvert
    const boxContainer = document.getElementById("tableBoxCulvertBody");
    if (boxContainer && this.data.boxCulverts) {
      let boxHtml = "";
      this.data.boxCulverts.forEach(item => {
        boxHtml += `
          <tr>
            <td><strong>${item.proyecto}</strong></td>
            <td class="text-center badge-cell"><span class="section-pill">${item.seccion}</span></td>
            <td class="text-center">${item.year || "—"}</td>
            <td class="text-right">${this.formatCurrency(item.tenorM3)}</td>
            <td class="text-right">${this.formatCurrency(item.tenorUnd)}</td>
            <td class="text-right highlight-cell"><strong>${this.formatCurrency(item.tenorMl)}</strong></td>
          </tr>
        `;
      });
      boxContainer.innerHTML = boxHtml;
    }

    // 3. Muros de Contención
    const murosContainer = document.getElementById("tableMurosBody");
    if (murosContainer && this.data.muros) {
      let murosHtml = "";
      this.data.muros.forEach(item => {
        murosHtml += `
          <tr>
            <td><strong>${item.proyecto}</strong></td>
            <td class="text-center">${item.year}</td>
            <td class="text-right">${this.formatCurrency(item.tenorUnd)}</td>
            <td class="text-right highlight-cell"><strong>${this.formatCurrency(item.tenorM3)}/m³</strong></td>
          </tr>
        `;
      });
      murosContainer.innerHTML = murosHtml;
    }
  },

  // Modal de Informe Completo
  openFullReportModal() {
    const modal = document.getElementById("fullReportModal");
    const countSpan = document.getElementById("reportModalCount");
    const tableBody = document.getElementById("reportTableBody");

    countSpan.textContent = `(${this.filteredProjects.length} registros)`;

    let html = "";
    this.filteredProjects.forEach((p, idx) => {
      html += `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${p.proyecto}</strong></td>
          <td>${p.subregion}</td>
          <td>${p.municipio}</td>
          <td>${p.tipologia}</td>
          <td class="text-center">${p.year || "N/A"}</td>
          <td class="text-right">${p.valorInvertido ? this.formatCurrency(p.valorInvertido) : "—"}</td>
          <td class="text-center">${p.longitudKm !== null ? p.longitudKm + " km" : "—"}</td>
          <td class="text-right">${p.tenorPlacaHuellaKm ? this.formatCompactCurrency(p.tenorPlacaHuellaKm) : "—"}</td>
          <td class="text-right">${p.tenorPavimentoFlexibleKm ? this.formatCompactCurrency(p.tenorPavimentoFlexibleKm) : "—"}</td>
          <td class="text-right">${p.pavimentoRigidoKm ? this.formatCompactCurrency(p.pavimentoRigidoKm) : (p.pavimentoRigidoLiquidadoKm ? this.formatCompactCurrency(p.pavimentoRigidoLiquidadoKm) + " (Liq.)" : "—")}</td>
          <td class="text-right">${p.tenorPuenteMl ? this.formatCompactCurrency(p.tenorPuenteMl) : "—"}</td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
    modal.style.display = "flex";

    // Exportar tabla a CSV
    document.getElementById("btnExportReportCsv").onclick = () => {
      this.exportFilteredToCsv();
    };
  },

  // Exportar proyectos filtrados a CSV
  exportFilteredToCsv() {
    const headers = ["ID", "PROYECTO", "SUBREGION", "MUNICIPIO", "TIPOLOGIA", "AÑO", "VALOR INVERTIDO (COP)", "LONGITUD (KM)", "TENOR PLACA HUELLA ($/KM)", "TENOR PAVIMENTO FLEXIBLE ($/KM)", "PAVIMENTO RIGIDO ($/KM)", "TENOR PUENTE ($/ML)"];
    const rows = this.filteredProjects.map((p, idx) => [
      idx + 1,
      `"${p.proyecto.replace(/"/g, '""')}"`,
      p.subregion,
      p.municipio,
      `"${p.tipologia}"`,
      p.year || "",
      p.valorInvertido || "",
      p.longitudKm || "",
      p.tenorPlacaHuellaKm || "",
      p.tenorPavimentoFlexibleKm || "",
      p.pavimentoRigidoKm || p.pavimentoRigidoLiquidadoKm || "",
      p.tenorPuenteMl || ""
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `informe_tenores_antioquia_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Administración
  openAdminModal() {
    document.getElementById("adminAuthModal").style.display = "flex";
    document.getElementById("adminPasswordInput").value = "";
    document.getElementById("adminAuthError").style.display = "none";
  },

  handleAdminAuth() {
    const pass = document.getElementById("adminPasswordInput").value;
    if (pass === this.adminPassword) {
      document.getElementById("adminAuthModal").style.display = "none";
      document.getElementById("adminControlPanelModal").style.display = "flex";
    } else {
      document.getElementById("adminAuthError").style.display = "block";
    }
  },

  // Carga y lectura de archivo Excel (.xlsx / .xls / .csv)
  handleExcelUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonRows.length < 2) {
          alert("El archivo no contiene suficientes filas de datos.");
          return;
        }

        const headers = jsonRows[0].map(h => String(h || "").trim().toUpperCase());
        const newProjects = [];

        for (let i = 1; i < jsonRows.length; i++) {
          const row = jsonRows[i];
          if (!row || !row.length || !row[0]) continue;

          // Mapeo básico inteligente de columnas
          const projObj = {
            id: this.data.projects.length + newProjects.length + 1,
            proyecto: String(row[0] || "").trim(),
            fecha: String(row[1] || "").trim(),
            year: this.extractYearFromStr(String(row[1] || "")),
            valorInvertido: this.cleanNumber(row[2]),
            tipologia: String(row[3] || "No especificada").trim(),
            subregion: String(row[4] || "GENERAL").trim().toUpperCase(),
            municipio: String(row[5] || "GENERAL").trim().toUpperCase(),
            longitudKm: this.cleanNumber(row[6]),
            tenorPuenteMl: this.cleanNumber(row[7]),
            tenorPavimentoFlexibleKm: this.cleanNumber(row[8]),
            tenorPlacaHuellaKm: this.cleanNumber(row[9]),
            pavimentoRigidoKm: this.cleanNumber(row[10]),
            tenorEstabilizacionKm: this.cleanNumber(row[11]),
            valorPagado: null,
            tenorContractual: null
          };
          newProjects.push(projObj);
        }

        if (newProjects.length > 0) {
          this.data.projects = [...this.data.projects, ...newProjects];
          localStorage.setItem("antioquia_infraestructura_data", JSON.stringify(this.data));
          this.initFilterSelectors();
          this.applyFilters();
          alert(`¡Éxito! Se cargaron ${newProjects.length} nuevos proyectos a la base de datos.`);
          document.getElementById("adminControlPanelModal").style.display = "none";
        }
      } catch (err) {
        console.error(err);
        alert("Ocurrió un error al procesar el archivo Excel. Asegúrate de que tenga el formato de columnas indicado.");
      }
    };
    reader.readAsArrayBuffer(file);
  },

  // Exportar data.json para sincronizar GitHub Pages
  exportDataJson() {
    const jsonStr = `// Base de datos de Proyectos y Tenores - Secretaría de Infraestructura de Antioquia\nconst DB_INITIAL_DATA = ${JSON.stringify(this.data, null, 2)};\n`;
    const blob = new Blob([jsonStr], { type: "application/javascript;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "data.js");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert("Se descargó el archivo 'data.js' actualizado. Para que los cambios queden fijos en GitHub Pages para todos los visitantes del mundo, simplemente reemplaza este archivo en la carpeta 'js/' de tu repositorio en GitHub.");
  },

  // Limpiar filtros
  resetFilters() {
    this.activeFilters = {
      search: "",
      year: "ALL",
      tipologia: "ALL",
      subregion: "ALL",
      municipio: "ALL"
    };

    document.getElementById("filterSearch").value = "";
    document.getElementById("filterYear").value = "ALL";
    document.getElementById("filterTipologia").value = "ALL";
    document.getElementById("filterSubregion").value = "ALL";
    this.updateMunicipioSelector();
    this.selectedProject = null;

    this.applyFilters();
    highlightSubregionInMap("ALL");
  },

  // Funciones de formato
  formatSmartCurrency(val) {
    if (val === null || val === undefined || isNaN(val)) return "—";
    if (val === 0) return "$ 0 COP";
    if (val >= 1e12) {
      return "$" + (val / 1e12).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " Billones COP";
    }
    if (val >= 1e9) {
      return "$" + (val / 1e9).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " Mil Millones COP";
    }
    if (val >= 1e6) {
      return "$" + (val / 1e6).toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + " Millones COP";
    }
    return this.formatCurrency(val);
  },

  formatCurrency(val) {
    if (val === null || val === undefined || isNaN(val)) return "—";
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val);
  },

  formatCompactCurrency(val) {
    if (val === null || val === undefined || isNaN(val)) return "—";
    if (val >= 1e9) {
      return "$" + (val / 1e9).toFixed(2) + " Mil Millones";
    }
    if (val >= 1e6) {
      return "$" + (val / 1e6).toFixed(1) + "M";
    }
    return this.formatCurrency(val);
  },

  extractYearFromStr(str) {
    const match = str.match(/\b(202[4-9])\b/);
    return match ? parseInt(match[1]) : null;
  },

  cleanNumber(val) {
    if (val === null || val === undefined || val === "") return null;
    if (typeof val === "number") return val;
    const str = String(val).replace(/\$/g, "").replace(/\s/g, "").replace(/,/g, ".");
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  }
};

