# RadAI Rx - Plataforma de IA para Radiología Interactiva

RadAI Rx es una plataforma avanzada de análisis de imágenes médicas que utiliza Inteligencia Artificial para la detección de patologías en Rayos X, Tomografías (CT) y Resonancias Magnéticas (MR). El sistema está diseñado como una estación de trabajo interactiva que permite a los médicos validar, corregir y "enseñar" a la IA a través de un bucle de retroalimentación clínica.

## 🚀 Características Principales

- **Análisis Multi-Experto AI**: El sistema utiliza expertos especializados según la modalidad (Tórax, Cerebro, General).
- **Visor DICOM Profesional**: Basado en CornerstoneJS, soporta:
  - Navegación por stacks (series completas).
  - Modo CINE (Auto-reproducción).
  - Herramientas de medición, zoom, pan y sonda.
  - Preajustes de ventana diagnóstica (Cerebro, Hueso, Pulmón, etc.).
- **Centro de Enseñanza (Feedback Loop)**: Módulo interactivo para que los expertos confirmen o corrijan los hallazgos de la IA, permitiendo el aprendizaje supervisado.
- **Procesamiento Masivo**: Soporte para subida de carpetas completas y procesamiento secuencial de series.
- **Base de Conocimiento Médica**: Diccionario de patologías y hallazgos modular y fácilmente expandible.
- **Anonimizado Automático**: Cumplimiento de privacidad mediante el anonimizado de metadatos sensibles en archivos DICOM.

## 🛠️ Stack Tecnológico

- **Backend**: FastAPI (Python), SQLAlchemy (SQLite), PyTorch, PyDicom.
- **Frontend**: React + Vite, Tailwind CSS, Lucide Icons, CornerstoneJS.
- **IA**: Modelos basados en DenseNet121 y lógica experta modular.

## 📦 Instalación y Uso

### Requisitos
- Python 3.10+
- Node.js 18+

### Backend
1. Navega a `/backend`.
2. Instala dependencias: `pip install -r requirements.txt`.
3. Inicia el servidor: `python main.py`.

### Frontend
1. Navega a `/frontend_vite`.
2. Instala dependencias: `npm install`.
3. Inicia el modo desarrollo: `npm run dev`.

## 🧠 Estructura del Proyecto

```text
/backend
  ├── main.py              # Orquestador API
  ├── database.py          # Modelos de datos y SQLite
  ├── service_ai.py        # Motor de IA Multi-Experto
  ├── knowledge_base.py    # Diccionario médico modular
  ├── service_report.py    # Generación de informes
  └── utils_anonymize.py   # Utilidades DICOM
/frontend_vite
  ├── src/components/      # Componentes UI de alto nivel
  ├── src/services/        # Capa de servicios / API
  └── src/types/           # Definiciones TypeScript
```

## 🤝 Contribuciones
Este es un proyecto en fase de aprendizaje activo. Las correcciones médicas realizadas a través de la interfaz alimentan directamente el futuro entrenamiento de los modelos.
