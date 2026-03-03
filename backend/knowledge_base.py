# Este es el Banco de Conocimiento General de RadAI Rx.
# Se puede expandir dinámicamente para "enseñar" al sistema nuevas patologías.

KNOWLEDGE_BASE = {
    "GENERAL": {
        "normal": {
            "pathology": "Sin hallazgos significativos",
            "findings": "El análisis preliminar no muestra anomalías agudas. Estructuras conservadas."
        },
        "suspicious": {
            "pathology": "Hallazgos a correlacionar",
            "findings": "Se detectan variaciones de señal/densidad que requieren correlación clínica detallada."
        }
    },
    "CR": { # Rayos X
        "description": "Radiología Convencional",
        "patterns": {
            "opacity": "Aumento de densidad en campos pulmonares.",
            "fracture": "Discontinuidad ósea sugerida.",
            "cardiomegaly": "Silueta cardíaca aumentada."
        }
    },
    "CT": { # Tomografía
        "description": "Tomografía Computarizada",
        "patterns": {
            "hemorrhage": "Áreas hiperdensas sugestivas de sangrado agudo.",
            "mass": "Efecto de masa o lesión ocupante de espacio.",
            "nodule": "Nódulo pulmonar detectado."
        }
    },
    "MR": { # Resonancia
        "description": "Resonancia Magnética",
        "patterns": {
            "edema": "Hipersensibilidad en T2/FLAIR compatible con edema.",
            "isquemia": "Restricción a la difusión sugerida.",
            "lesion": "Alteración de la señal en parénquima."
        }
    }
}

def get_pathology_info(modality, is_normal, filename_hint=""):
    """
    Retorna información general basada en la modalidad y el estado.
    Este es el punto de entrada para "enseñar" al sistema.
    """
    kb = KNOWLEDGE_BASE.get(modality, KNOWLEDGE_BASE["GENERAL"])
    
    if is_normal:
        return KNOWLEDGE_BASE["GENERAL"]["normal"]
    
    # Búsqueda simple de patrones en el nombre del archivo (para demostración/enseñanza rápida)
    for pattern, description in kb.get("patterns", {}).items():
        if pattern in filename_hint.lower():
            return {
                "pathology": pattern.upper(),
                "findings": description
            }
    
    return KNOWLEDGE_BASE["GENERAL"]["suspicious"]
