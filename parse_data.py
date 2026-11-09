# -*- coding: utf-8 -*-
import json
import re
import csv

def parse_num(val):
    if not val or val.strip() == "" or val.strip().lower() == "nan":
        return None
    cleaned = val.replace("$", "").replace(" ", "").replace(",", ".")
    try:
        return float(cleaned)
    except:
        return None

def extract_year(date_str):
    if not date_str:
        return None
    match = re.search(r'\b(202[4-9])\b', str(date_str))
    if match:
        return int(match.group(1))
    return None

projects = []
with open(r"C:\Users\TUF\.gemini\antigravity\scratch\dashboard-antioquia-infraestructura\assets\proyectos_base.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    header = next(reader)
    for idx, row in enumerate(reader):
        if not row or not any(row):
            continue
        name = row[0].strip() if len(row) > 0 else ""
        if not name:
            continue
        fecha = row[1].strip() if len(row) > 1 else ""
        valor_inv = parse_num(row[2]) if len(row) > 2 else None
        tipologia = row[3].strip() if len(row) > 3 else "No especificada"
        subregion = row[4].strip() if len(row) > 4 else "GENERAL"
        municipio = row[5].strip() if len(row) > 5 else "GENERAL"
        longitud = parse_num(row[6]) if len(row) > 6 else None
        tenor_puente = parse_num(row[7]) if len(row) > 7 else None
        tenor_pav_flex = parse_num(row[8]) if len(row) > 8 else None
        tenor_placa_huella = parse_num(row[9]) if len(row) > 9 else None
        pav_rigido = parse_num(row[10]) if len(row) > 10 else None
        tenor_estab = parse_num(row[11]) if len(row) > 11 else None
        
        valor_pagado = None
        tenor_contractual = None
        if len(row) > 14 and row[14].strip():
            valor_pagado = parse_num(row[14])
        if len(row) > 15 and row[15].strip():
            tenor_contractual = parse_num(row[15])

        year = extract_year(fecha)
        subregion_clean = subregion.upper().strip()
        if not subregion_clean:
            subregion_clean = "GENERAL"
        if "NORDESTE" in subregion_clean: subregion_clean = "NORDESTE"
        elif "ORIENTE" in subregion_clean: subregion_clean = "ORIENTE"
        elif "URABÁ" in subregion_clean or "URABA" in subregion_clean: subregion_clean = "URABÁ"
        elif "OCCIDENTE" in subregion_clean: subregion_clean = "OCCIDENTE"
        elif "SUROESTE" in subregion_clean: subregion_clean = "SUROESTE"
        elif "NORTE" in subregion_clean: subregion_clean = "NORTE"
        elif "BAJO CAUCA" in subregion_clean: subregion_clean = "BAJO CAUCA"
        elif "MAGDALENA MEDIO" in subregion_clean: subregion_clean = "MAGDALENA MEDIO"
        elif "VALLE DE ABURRÁ" in subregion_clean or "VALLE DE ABURRA" in subregion_clean: subregion_clean = "VALLE DE ABURRÁ"

        municipio_clean = municipio.upper().strip()
        if not municipio_clean:
            municipio_clean = "GENERAL"

        projects.append({
            "id": idx + 1,
            "proyecto": name,
            "fecha": fecha,
            "year": year,
            "valorInvertido": valor_inv,
            "tipologia": tipologia,
            "subregion": subregion_clean,
            "municipio": municipio_clean,
            "longitudKm": longitud,
            "tenorPuenteMl": tenor_puente,
            "tenorPavimentoFlexibleKm": tenor_pav_flex,
            "tenorPlacaHuellaKm": tenor_placa_huella,
            "pavimentoRigidoKm": pav_rigido,
            "tenorEstabilizacionKm": tenor_estab,
            "valorPagado": valor_pagado,
            "tenorContractual": tenor_contractual
        })

alcantarillas = [
    {"proyecto": "Ppto San Rafael - San Rafael", "year": 2026, "tenorMl": 4163093.0},
    {"proyecto": "Ppto Yondo Cantagallo", "year": 2026, "tenorMl": 5658201.31},
    {"proyecto": "Ppto La Lorena-Maraton", "year": 2025, "tenorMl": 4922219.03},
    {"proyecto": "Ppto Liborina-Sabanalarga", "year": 2025, "tenorMl": 5349669.51},
    {"proyecto": "Ppto Anori-Sabanalarga", "year": 2025, "tenorMl": 4767206.96},
    {"proyecto": "Ppto Buenos aires - Andes", "year": 2025, "tenorMl": 3991801.45},
    {"proyecto": "Ppto OCAD PAZ San Pedro de Urabá", "year": 2025, "tenorMl": 3939486.90},
    {"proyecto": "Ppto OCAD PAZ Tarazá", "year": 2025, "tenorMl": 3410528.98},
    {"proyecto": "Ppto OCAD PAZ Pte Raudal", "year": 2025, "tenorMl": 6145361.40},
    {"proyecto": "Ppto PAP Heliconia3", "year": 2025, "tenorMl": 3745091.66}
]

box_culverts = [
    {"proyecto": "Ppto San Rafael - San Roque (2026)", "tenorM3": 4282901.22, "tenorUnd": 85658024.38, "cantidadUnd": 4, "longPromUndM": 7.895, "m3PorMl": 1.605, "year": 2026, "tenorMl": 6874056.46, "seccion": "0,25m x 1,5m", "longitudM": 8.335},
    {"proyecto": "Ppto San Rafael - San Roque (2026)", "tenorM3": 4282901.22, "tenorUnd": 85658024.38, "cantidadUnd": 4, "longPromUndM": 8.895, "m3PorMl": 2.16, "year": 2026, "tenorMl": 9251066.63, "seccion": "2,1m x 1,5m", "longitudM": 7.85},
    {"proyecto": "Ppto San Rafael - San Roque (2026)", "tenorM3": 4282901.22, "tenorUnd": 85658024.38, "cantidadUnd": 4, "longPromUndM": 9.895, "m3PorMl": 2.955, "year": 2026, "tenorMl": 12657553.18, "seccion": "3,1m x 2m", "longitudM": 7.5},
    {"proyecto": "Ppto Yondo Cantagallo (2026)", "tenorM3": 2978982.60, "tenorUnd": 57593663.67, "cantidadUnd": 9, "longPromUndM": 12.93, "m3PorMl": 1.5, "year": 2026, "tenorMl": 4468473.91, "seccion": "2m x 1m", "longitudM": 12.93},
    {"proyecto": "Ppto OCAD PAZ Tarazá (2025)", "tenorM3": 3294562.27, "tenorUnd": 63281613.50, "cantidadUnd": 16, "longPromUndM": 10.8, "m3PorMl": 1.66, "year": 2025, "tenorMl": 5468973.37, "seccion": "1m x 1m", "longitudM": 10.8},
    {"proyecto": "Ppto OCAD PAZ Tarazá (2025)", "tenorM3": 3294562.27, "tenorUnd": 63281613.50, "cantidadUnd": 16, "longPromUndM": 11.8, "m3PorMl": 2.912, "year": 2025, "tenorMl": 9593277.24, "seccion": "2m x 2m", "longitudM": 10.8},
    {"proyecto": "Ppto OCAD PAZ Tarazá (2025)", "tenorM3": 3294562.27, "tenorUnd": 63281613.50, "cantidadUnd": 16, "longPromUndM": 12.8, "m3PorMl": 4.864, "year": 2025, "tenorMl": 16023774.71, "seccion": "4m x 3m", "longitudM": 10.8},
    {"proyecto": "Ppto OCAD PAZ Tarazá (2025)", "tenorM3": 3294562.27, "tenorUnd": 63281613.50, "cantidadUnd": 16, "longPromUndM": 13.8, "m3PorMl": 6.140, "year": 2025, "tenorMl": 20227392.12, "seccion": "5m x 4m", "longitudM": 10.8},
    {"proyecto": "Ppto OCAD PAZ Tarazá (2025)", "tenorM3": 3294562.27, "tenorUnd": 63281613.50, "cantidadUnd": 16, "longPromUndM": 14.8, "m3PorMl": 6.778, "year": 2025, "tenorMl": 22329200.82, "seccion": "5m x 5m", "longitudM": 10.8},
    {"proyecto": "Ppto San Fermin - Briceño (2025)", "tenorM3": 2653968.64, "tenorUnd": 76702471.50, "cantidadUnd": 8, "longPromUndM": 10.093, "m3PorMl": 2.283, "year": 2025, "tenorMl": 6057683.43, "seccion": "1,5m x 1,5m", "longitudM": 10.185},
    {"proyecto": "Ppto San Fermin - Briceño (2025)", "tenorM3": 2653968.64, "tenorUnd": 76702471.50, "cantidadUnd": 8, "longPromUndM": 11.093, "m3PorMl": 2.91, "year": 2025, "tenorMl": 7723048.75, "seccion": "2m x 2m", "longitudM": 10.0},
    {"proyecto": "Ppto San Fermin Oxi (2024)", "tenorM3": 3125810.27, "tenorUnd": 84663265.50, "cantidadUnd": 8, "longPromUndM": 10.388, "m3PorMl": 2.283, "year": 2024, "tenorMl": 7134661.94, "seccion": "1,5m x 1,5m", "longitudM": 10.185},
    {"proyecto": "Ppto San Fermin Oxi (2024)", "tenorM3": 3125810.27, "tenorUnd": 84663265.50, "cantidadUnd": 8, "longPromUndM": 11.388, "m3PorMl": 2.63, "year": 2024, "tenorMl": 8220881.01, "seccion": "2m x 1,5m", "longitudM": 10.98},
    {"proyecto": "Ppto San Fermin Oxi (2024)", "tenorM3": 3125810.27, "tenorUnd": 84663265.50, "cantidadUnd": 8, "longPromUndM": 12.388, "m3PorMl": 2.91, "year": 2024, "tenorMl": 9096107.89, "seccion": "2m x 2m", "longitudM": 10.0},
    {"proyecto": "Ppto La lorena - Maratón (2024)", "tenorM3": 3623108.76, "tenorUnd": 48203099.12, "cantidadUnd": 23, "longPromUndM": 7.0, "m3PorMl": 1.56, "year": 2024, "tenorMl": 5652049.66, "seccion": "1m x 1m", "longitudM": 7.0},
    {"proyecto": "Ppto La lorena - Maratón (2024)", "tenorM3": 3623108.76, "tenorUnd": 48203099.12, "cantidadUnd": 23, "longPromUndM": 7.0, "m3PorMl": 2.16, "year": 2024, "tenorMl": 7825914.92, "seccion": "1,5m x 1,5m", "longitudM": 7.0},
    {"proyecto": "Ppto La lorena - Maratón (2024)", "tenorM3": 3623108.76, "tenorUnd": 48203099.12, "cantidadUnd": 23, "longPromUndM": 7.0, "m3PorMl": 2.76, "year": 2024, "tenorMl": 9999780.17, "seccion": "2m x 2m", "longitudM": 7.0},
    {"proyecto": "Ppto La lorena - Maratón (2024)", "tenorM3": 3623108.76, "tenorUnd": 48203099.12, "cantidadUnd": 23, "longPromUndM": 7.0, "m3PorMl": 3.36, "year": 2024, "tenorMl": 12173645.42, "seccion": "2,5m x 2,5m", "longitudM": 7.0},
    {"proyecto": "Ppto OCAD PAZ San Pedro de Urabá (2024)", "tenorM3": 4148321.30, "tenorUnd": 62284045.60, "cantidadUnd": 107, "longPromUndM": 6.0, "m3PorMl": 0.78, "year": 2024, "tenorMl": 3235690.61, "seccion": "2,6m x 0,3m", "longitudM": 6.0},
    {"proyecto": "Ppto OCAD PAZ San José de Ure_Tarazá (2024)", "tenorM3": 2127111.85, "tenorUnd": 64063603.96, "cantidadUnd": 17, "longPromUndM": 10.8, "m3PorMl": 1.66, "year": 2024, "tenorMl": 3531005.67, "seccion": "1m x 1m", "longitudM": 10.8},
    {"proyecto": "Ppto OCAD PAZ San José de Ure_Tarazá (2024)", "tenorM3": 2127111.85, "tenorUnd": 64063603.96, "cantidadUnd": 17, "longPromUndM": 11.8, "m3PorMl": 2.912, "year": 2024, "tenorMl": 6193834.58, "seccion": "2m x 2m", "longitudM": 10.8},
    {"proyecto": "Ppto OCAD PAZ San José de Ure_Tarazá (2024)", "tenorM3": 2127111.85, "tenorUnd": 64063603.96, "cantidadUnd": 17, "longPromUndM": 12.8, "m3PorMl": 4.864, "year": 2024, "tenorMl": 10345641.78, "seccion": "4m x 3m", "longitudM": 10.8},
    {"proyecto": "Ppto OCAD PAZ San José de Ure_Tarazá (2024)", "tenorM3": 2127111.85, "tenorUnd": 64063603.96, "cantidadUnd": 17, "longPromUndM": 13.8, "m3PorMl": 6.140, "year": 2024, "tenorMl": 13059678.94, "seccion": "5m x 4m", "longitudM": 10.8},
    {"proyecto": "Ppto OCAD PAZ San José de Ure_Tarazá (2024)", "tenorM3": 2127111.85, "tenorUnd": 64063603.96, "cantidadUnd": 17, "longPromUndM": 14.8, "m3PorMl": 6.778, "year": 2024, "tenorMl": 14416697.52, "seccion": "5m x 5m", "longitudM": 10.8}
]

muros = [
    {"proyecto": "Ppto La lorena Maratón", "year": 2024, "tenorUnd": 254121193.50, "tenorM3": 1585784.42},
    {"proyecto": "Ppto Jardin Rio Sucio", "year": 2024, "tenorUnd": 236900374.80, "tenorM3": 1982629.01},
    {"proyecto": "Ppto Pte el volcan La Loma Urrao", "year": 2025, "tenorUnd": 152215315.00, "tenorM3": 1268460.96},
    {"proyecto": "Ppto Pap Tarazá", "year": 2025, "tenorUnd": 274689944.15, "tenorM3": 1674011.32},
    {"proyecto": "Ppto Buenos Aires Andes", "year": 2025, "tenorUnd": 158440011.50, "tenorM3": 2076540.12},
    {"proyecto": "Ppto San Luis Choco", "year": 2025, "tenorUnd": 103134313.32, "tenorM3": 1753405.60},
    {"proyecto": "Ppto Yondo Cantagallo", "year": 2026, "tenorUnd": 129563096.45, "tenorM3": 2354984.27},
    {"proyecto": "Ppto San Rafael San Roque", "year": 2026, "tenorUnd": 183376390.35, "tenorM3": 1072307.09}
]

output_data = {
    "projects": projects,
    "alcantarillas": alcantarillas,
    "boxCulverts": box_culverts,
    "muros": muros
}

js_content = f"// Base de datos de Proyectos y Tenores - Secretaría de Infraestructura de Antioquia\nconst DB_INITIAL_DATA = {json.dumps(output_data, ensure_ascii=False, indent=2)};\n"

with open(r"C:\Users\TUF\.gemini\antigravity\scratch\dashboard-antioquia-infraestructura\js\data.js", "w", encoding="utf-8") as out:
    out.write(js_content)

print(f"Data parsed successfully: {len(projects)} projects, {len(alcantarillas)} alcantarillas, {len(box_culverts)} box culverts, {len(muros)} muros.")
