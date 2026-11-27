# -*- coding: utf-8 -*-
import openpyxl
import json
import datetime
import re
import unicodedata

def clean_txt(s):
    if not s:
        return ""
    s = str(s).lower()
    s = unicodedata.normalize("NFKD", s)
    s = re.sub(r"[^\w\s]", "", s)
    return re.sub(r"\s+", " ", s).strip()

def parse_num(val):
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return round(float(val), 2)
    s = str(val).strip().replace("$", "").replace(" ", "")
    if not s or s.lower() == "nan" or s == "-":
        return None
    s = s.replace(",", ".")
    try:
        return round(float(s), 2)
    except:
        return None

def parse_date_and_year(val):
    if val is None:
        return "", None
    if isinstance(val, (datetime.datetime, datetime.date)):
        return val.strftime("%Y-%m-%d"), val.year
    s = str(val).strip()
    m = re.search(r"\b(202[4-9])\b", s)
    yr = int(m.group(1)) if m else None
    return s[:10], yr

def clean_subregion(sub):
    if not sub:
        return "GENERAL"
    s = str(sub).upper().strip()
    if "NORDESTE" in s: return "NORDESTE"
    if "ORIENTE" in s: return "ORIENTE"
    if "URAB" in s: return "URABÁ"
    if "OCCIDENTE" in s: return "OCCIDENTE"
    if "SUROESTE" in s: return "SUROESTE"
    if "NORTE" in s: return "NORTE"
    if "BAJO CAUCA" in s: return "BAJO CAUCA"
    if "MAGDALENA MEDIO" in s: return "MAGDALENA MEDIO"
    if "VALLE" in s or "ABURR" in s: return "VALLE DE ABURRÁ"
    return s if s else "GENERAL"

excel_file = r"c:\Users\TUF\Downloads\BASE DE DATOS SIF (3).xlsx"
wb = openpyxl.load_workbook(excel_file, data_only=True)

# 1. Projects from BD
ws_bd = wb["BD"]
excel_projects = []
for r in range(2, ws_bd.max_row + 1):
    name = ws_bd.cell(r, 1).value
    if not name or str(name).strip() == "":
        continue
    name_str = str(name).strip()
    fecha_str, yr = parse_date_and_year(ws_bd.cell(r, 2).value)
    val_inv = parse_num(ws_bd.cell(r, 3).value)
    tip = str(ws_bd.cell(r, 4).value or "No especificada").strip()
    sub = clean_subregion(ws_bd.cell(r, 5).value)
    muni = str(ws_bd.cell(r, 6).value or "GENERAL").strip().upper()
    
    long_km = parse_num(ws_bd.cell(r, 7).value)
    tenor_puente = parse_num(ws_bd.cell(r, 8).value)
    tenor_pav_flex = parse_num(ws_bd.cell(r, 9).value)
    tenor_placa_huella = parse_num(ws_bd.cell(r, 10).value)
    pav_rigido = parse_num(ws_bd.cell(r, 11).value)
    tenor_estab = parse_num(ws_bd.cell(r, 12).value)
    pav_rigido_liq = parse_num(ws_bd.cell(r, 13).value)
    
    excel_projects.append({
        "proyecto": name_str,
        "fecha": fecha_str,
        "year": yr,
        "valorInvertido": val_inv,
        "tipologia": tip,
        "subregion": sub,
        "municipio": muni,
        "longitudKm": long_km,
        "tenorPuenteMl": tenor_puente,
        "tenorPavimentoFlexibleKm": tenor_pav_flex,
        "tenorPlacaHuellaKm": tenor_placa_huella,
        "pavimentoRigidoKm": pav_rigido,
        "tenorEstabilizacionKm": tenor_estab,
        "pavimentoRigidoLiquidadoKm": pav_rigido_liq
    })

# Preservar registros unicos de la base previa si no estaban en el nuevo excel
old_path = r"C:\Users\TUF\.gemini\antigravity\scratch\dashboard-antioquia-infraestructura\js\data.js"
with open(old_path, "r", encoding="utf-8") as f:
    text = f.read()
start = text.find("{")
end = text.rfind("}") + 1
old_data = json.loads(text[start:end])

excel_norms = set(clean_txt(p["proyecto"])[:60] for p in excel_projects)
merged_projects = list(excel_projects)

appended_count = 0
for p in old_data.get("projects", []):
    norm = clean_txt(p["proyecto"])[:60]
    if norm not in excel_norms:
        p_copy = dict(p)
        if "id" in p_copy: del p_copy["id"]
        if "pavimentoRigidoLiquidadoKm" not in p_copy:
            p_copy["pavimentoRigidoLiquidadoKm"] = None
        merged_projects.append(p_copy)
        appended_count += 1

# Asignar IDs unicos y limpios
for idx, p in enumerate(merged_projects, 1):
    p["id"] = idx

# 2. Alcantarillas
ws_alc = wb["TENOR ALCANTARILLA"]
alcantarillas = []
for r in range(2, ws_alc.max_row + 1):
    p = ws_alc.cell(r, 1).value
    if not p: continue
    yr = int(ws_alc.cell(r, 2).value) if ws_alc.cell(r, 2).value else None
    tenor = parse_num(ws_alc.cell(r, 3).value)
    alcantarillas.append({
        "proyecto": str(p).strip(),
        "year": yr,
        "tenorMl": tenor
    })

# 3. Box Culverts
ws_box = wb["TENOR BOXCULVERT"]
box_culverts = []
for r in range(2, ws_box.max_row + 1):
    p = ws_box.cell(r, 1).value
    if not p: continue
    m3 = parse_num(ws_box.cell(r, 2).value)
    und = parse_num(ws_box.cell(r, 3).value)
    cant = int(ws_box.cell(r, 4).value) if ws_box.cell(r, 4).value else None
    long_prom = parse_num(ws_box.cell(r, 5).value)
    m3_ml = parse_num(ws_box.cell(r, 6).value)
    yr = int(ws_box.cell(r, 7).value) if ws_box.cell(r, 7).value else None
    tenor_ml = parse_num(ws_box.cell(r, 8).value)
    secc = str(ws_box.cell(r, 9).value or "").strip()
    long_m = parse_num(ws_box.cell(r, 10).value)
    box_culverts.append({
        "proyecto": str(p).strip(),
        "tenorM3": m3,
        "tenorUnd": und,
        "cantidadUnd": cant,
        "longPromUndM": long_prom,
        "m3PorMl": m3_ml,
        "year": yr,
        "tenorMl": tenor_ml,
        "seccion": secc,
        "longitudM": long_m
    })

# 4. Muros de Contención
ws_muros = wb["MURO DE CONTENCIÓN"]
muros = []
for r in range(2, ws_muros.max_row + 1):
    p = ws_muros.cell(r, 1).value
    if not p: continue
    yr = int(ws_muros.cell(r, 2).value) if ws_muros.cell(r, 2).value else None
    und = parse_num(ws_muros.cell(r, 3).value)
    m3 = parse_num(ws_muros.cell(r, 4).value)
    muros.append({
        "proyecto": str(p).strip(),
        "year": yr,
        "tenorUnd": und,
        "tenorM3": m3
    })

output_data = {
    "projects": merged_projects,
    "alcantarillas": alcantarillas,
    "boxCulverts": box_culverts,
    "muros": muros
}

js_content = f"// Base de datos de Proyectos y Tenores - Secretaría de Infraestructura de Antioquia\nconst DB_INITIAL_DATA = {json.dumps(output_data, ensure_ascii=False, indent=2)};\n"

with open(r"C:\Users\TUF\.gemini\antigravity\scratch\dashboard-antioquia-infraestructura\js\data.js", "w", encoding="utf-8") as out:
    out.write(js_content)

print(f"Data generation complete:")
print(f"  - Projects: {len(merged_projects)} (Excel: {len(excel_projects)}, Unique old preserved: {appended_count})")
print(f"  - Alcantarillas: {len(alcantarillas)}")
print(f"  - Box Culverts: {len(box_culverts)}")
print(f"  - Muros de Contención: {len(muros)}")
