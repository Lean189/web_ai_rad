# RadAI Rx - Plataforma de IA para Radiología Interactiva (BETA)

RadAI Rx es una plataforma avanzada de análisis de imágenes médicas que utiliza Inteligencia Artificial para la detección de patologías en Rayos X, Tomografías (CT) y Resonancias Magnéticas (MR). El sistema está diseñado como una estación de trabajo interactiva que permite a los médicos validar, corregir y "enseñar" a la IA a través de un bucle de retroalimentación clínica.

> [!CAUTION]
>
> ### ⚖️ Aviso Legal / Clinical Disclaimer
>
> Este software es un **PROTOTIPO DE INVESTIGACIÓN** y se encuentra en fase **BETA**.
> **NO ESTÁ CERTIFICADO PARA USO CLÍNICO NI DIAGNÓSTICO**.
> Las predicciones de la IA deben ser validadas por profesionales médicos titulados. El autor no se responsabiliza por decisiones médicas tomadas basadas en este sistema.

## 🚀 Características Principales

- **Análisis Multi-Experto AI**: El sistema propone diagnósticos preliminares utilizando modelos especializados.
- **Estación de Trabajo HD-MPR**: Visor profesional basado en CornerstoneJS con reconstrucción multiplanar integrada (Axial, Sagital, Coronal).
- **Centro de Enseñanza (Feedback Loop)**: Módulo interactivo para capturar correcciones del especialista.
- **Privacidad Local**: Anonimización robusta de metadatos sensibles (PHI) en archivos DICOM localmente.

## 🛠️ Stack Tecnológico

- **Backend**: FastAPI (Python), SQLAlchemy (SQLite), PyTorch, PyDicom.
- **Frontend**: React + Vite, Tailwind CSS, CornerstoneJS.
- **IA**: Modelos basados en DenseNet121 con lógica experta modular.

## 🧠 Arquitectura del Sistema

El sistema opera bajo un esquema de **"Human-in-the-loop"**, donde la IA propone y el especialista dispone. Las correcciones realizadas en la interfaz quedan registradas para futuros procesos de re-entrenamiento (fine-tuning), cerrando el ciclo de aprendizaje clínico.

## 📦 Instalación y Uso

### Requisitos

- Python 3.10+
- Node.js 18+

### Configuración Rápida

1. **Backend**: `cd backend && pip install -r requirements.txt && python main.py`
2. **Frontend**: `cd frontend_vite && npm install && npm run dev`

## 🗺️ Roadmap de Desarrollo

- [ ] Implementación de Fine-Tuning en tiempo real.
- [ ] Integración con sistemas PACS mediante estándar DICOMweb.
- [ ] Reportes PDF generados automáticamente con firma digital.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.
