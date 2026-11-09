# 🏛️ Dashboard de Consulta y Análisis de Tenores de Obra Civil
### Secretaría de Infraestructura Física — Gobernación de Antioquia
**Trabajo de Grado / Plan de Mejoramiento — Ingeniería Civil**

Este aplicativo web fue diseñado y desarrollado con tecnologías estándar abiertas (**HTML5, CSS3 y JavaScript Vanilla**), sin frameworks pesados ni dependencias de backend de pago, lo que permite su ejecución inmediata en cualquier navegador web y su despliegue gratuito de por vida en **GitHub Pages**.

---

## 🎯 Objetivos Específicos Cumplidos

1. **Identificación Técnica y Financiera:** Mapeo y análisis financiero de proyectos viales ejecutados por la Secretaría de Infraestructura por subregiones y tipologías de obra civil.
2. **Registro de Características Contractuales y Presupuestales:** Tipología, localización (subregión y municipio), inversión asignada, longitud vial y período de ejecución (2024 - 2026).
3. **Estructura Funcional y Metodológica:** Sistema interactivo que permite consultar, filtrar en tiempo real, consolidar y visualizar los **tenores por unidad de longitud y volumen**:
   * **Tenor de Placa Huella ($/km)**
   * **Tenor de Pavimento Flexible ($/km)**
   * **Tenor de Pavimento Rígido ($/km)**
   * **Tenor de Puentes Vehiculares ($/mL)**
   * **Tenor de Alcantarillas ($/mL)** (sin transporte)
   * **Tenor de Box Culvert ($/m³, $/und, $/mL)** según sección transversal
   * **Tenor de Muros de Contención ($/m³ y $/und)** (sin transporte)

---

## 🧭 Estructura de la Interfaz (Fiel al Boceto)

* **Barra de Filtros Multicriterio:**
  * Buscador predictivo por nombre de proyecto o municipio.
  * Selector por Año / Período (2024, 2025, 2026).
  * Selector por Tipología de Obra.
  * Selector por Subregión (las 9 subregiones de Antioquia).
  * Selector por Municipio (dinámico según la subregión seleccionada).
  * Botón para restablecer y limpiar filtros.
* **Panel Central de Información General:**
  * Indicadores consolidados clave (KPIs): Inversión total, longitud vial acumulada intervenida, tenores promedio.
  * Ficha técnica detallada al seleccionar un proyecto específico.
  * Botón **"Ir a ver informe completo"**: despliega modal tabular completo con opción de exportación a CSV / Excel.
  * Listado rápido previo de proyectos para selección inmediata.
* **Mapa Interactivo de Antioquia:**
  * Representación vectorial de las 9 subregiones: *Urabá, Bajo Cauca, Norte, Nordeste, Occidente, Valle de Aburrá, Oriente, Suroeste y Magdalena Medio*.
  * **Interacción Hover:** El cursor resalta la subregión y despliega una ventana flotante con el número de proyectos, inversión acumulada y kilometraje.
  * **Interacción Clic:** Al hacer clic en cualquier subregión, filtra automáticamente todo el dashboard.
* **Sección Especializada de Obras de Arte:**
  * Pestañas dinámicas para **Box Culvert**, **Alcantarillas** y **Muros de Contención**.

---

## 🔐 Modo Administrador y Actualización de Datos (Excel)

Para garantizar que **los visitantes comunes solo puedan consultar** y que **únicamente la persona encargada pueda actualizar los datos**:

1. En la esquina superior derecha, haz clic en **"🔐 Modo Administrador"**.
2. Ingresa la contraseña de seguridad:
   * **Contraseña por defecto:** `Antioquia2025*` (se puede cambiar fácilmente en `js/app.js`).
3. En el panel de administración puedes:
   * **Cargar nuevos proyectos desde Excel (`.xlsx` o `.csv`)**: El navegador procesa las filas al instante mediante *SheetJS*.
   * **Descargar Base de Datos Actualizada (`data.js`)**: Al hacer clic, descargas el archivo de datos listo. Simplemente reemplazas el archivo `js/data.js` en tu repositorio de GitHub para que el cambio quede visible para todo el mundo en GitHub Pages.

---

## 🚀 Cómo Publicar en GitHub Pages (Gratis y Permanente)

1. Crea una cuenta gratuita en [GitHub](https://github.com) si aún no tienes una.
2. Crea un nuevo repositorio público (ejemplo: `dashboard-tenores-antioquia`).
3. Sube todos los archivos y carpetas de este proyecto (`index.html`, carpeta `css/`, carpeta `js/`, carpeta `assets/`).
4. En tu repositorio, entra a **Settings** (Configuración) → **Pages** (en el menú lateral izquierdo).
5. En **Build and deployment > Branch**, selecciona la rama `main` (o `master`) y la carpeta `/ (root)`. Haz clic en **Save** (Guardar).
6. ¡Listo! En 1 a 2 minutos GitHub te dará un enlace público permanente del tipo:
   `https://tu-usuario.github.io/dashboard-tenores-antioquia/`

Puedes abrir este link desde cualquier computador, tablet o celular en cualquier lugar del mundo.

---

## 📂 Organización de Archivos

```
dashboard-antioquia-infraestructura/
│
├── index.html              # Estructura principal y maquetación del dashboard
├── README.md               # Documentación técnica y guía de despliegue
│
├── css/
│   └── style.css           # Estilos institucionales de la Gobernación de Antioquia
│
├── js/
│   ├── data.js             # Base de datos estructurada (184 proyectos + tenores)
│   ├── map.js              # Mapa vectorial interactivo de Antioquia y eventos hover/clic
│   └── app.js              # Lógica de filtros, KPIs, modales y panel de administración
│
└── assets/
    └── proyectos_base.csv  # Archivo CSV de respaldo de la base de datos suministrada
```

