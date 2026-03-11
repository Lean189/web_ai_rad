from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os
import shutil
import uuid
from typing import List, Optional

from database import SessionLocal, Study, Feedback
from utils_anonymize import anonymize_dicom
from service_ai import analyze_image
from service_report import generate_report, get_mock_report

app = FastAPI(
    title="RadAI Rx API",
    version="0.1.0-beta",
    description="Backend para análisis interactivo de imágenes médicas con IA. AVISO: Prototipo de investigación, NO apto para uso clínico."
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
    return response

# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dirs
UPLOAD_DIR = "uploads"
ANONYMIZED_DIR = "anonymized"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(ANONYMIZED_DIR, exist_ok=True)

# Mount static files to serve images to Cornerstone
app.mount("/images", StaticFiles(directory=os.path.abspath(ANONYMIZED_DIR)), name="images")

@app.get("/")
async def root():
    return {"message": "Radiology AI Backend is running and connected to DB"}

@app.post("/process-study")
async def process_study(files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    batch_id = str(uuid.uuid4())
    processed_studies = []
    
    print(f"Processing Batch {batch_id} with {len(files)} files...")
    
    # Representative results for the whole stack
    # We will sample up to 10 slices to analyze
    num_samples = min(10, len(files))
    sample_indices = [int(i * (len(files) - 1) / (num_samples - 1)) for i in range(num_samples)] if num_samples > 1 else [0]
    
    aggregated_results = []
    
    for i, file in enumerate(files):
        # 1. Save Original
        file_id = str(uuid.uuid4())
        ext = os.path.splitext(file.filename)[1] or ".dcm"
        original_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
        
        with open(original_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 2. Anonymize (if DICOM)
        anonymized_path = os.path.join(ANONYMIZED_DIR, f"{file_id}{ext}")
        is_dicom = ext.lower() == ".dcm"
        if is_dicom:
            success = anonymize_dicom(original_path, anonymized_path)
            if not success:
                anonymized_path = original_path
        else:
            shutil.copy(original_path, anonymized_path)

        # 3. AI Analysis (Sampled slices)
        results = None
        if i in sample_indices:
            print(f"Running AI analysis on slice {i}/{len(files)} ({file.filename})")
            results = analyze_image(anonymized_path)
            aggregated_results.append(results)

        # 4. Save to DB with batch_id
        # We'll use a placeholder for now and update with aggregated results
        new_study = Study(
            filename=file.filename,
            modality="Unknown",
            original_path=original_path,
            anonymized_path=anonymized_path,
            status="Analyzed",
            pathology_detected="Processing...",
            confidence=0.0,
            ai_report_draft="",
            study_type=batch_id
        )
        db.add(new_study)
        processed_studies.append(new_study)
    
    # 5. Aggregate Findings
    # We pick the "most serious" finding or the first one detected
    final_res = aggregated_results[0] if aggregated_results else {"modality": "CT", "pathology": "Sin hallazgos", "findings": [], "confidence": 0.8}
    for res in aggregated_results:
        if "Sin hallazgos" not in res["pathology"]:
            final_res = res
            break
            
    report_draft = generate_report(final_res["pathology"], final_res["findings"])
    if "Error" in report_draft:
        report_draft = get_mock_report(final_res["pathology"], final_res["findings"])

    # Update all slices in DB with the final representative data
    for s in processed_studies:
        s.modality = final_res["modality"]
        s.pathology_detected = final_res["pathology"]
        s.confidence = final_res["confidence"]
    
    # Only put the full report in the middle slice to avoid DB bloat
    middle_idx = len(processed_studies) // 2
    processed_studies[middle_idx].ai_report_draft = report_draft

    db.commit()
    return [{"id": s.id, "filename": s.filename, "anonymized_path": s.anonymized_path.replace("\\", "/"), 
             "study_type": s.study_type, "modality": s.modality, "pathology_detected": s.pathology_detected,
             "status": s.status, "created_at": s.created_at, "confidence": s.confidence,
             "ai_report_draft": s.ai_report_draft, "final_report": s.final_report, "is_verified": s.is_verified} 
            for s in processed_studies]

@app.get("/history")
async def get_history(db: Session = Depends(get_db)):
    studies = db.query(Study).order_by(Study.id.desc()).all()
    return [{"id": s.id, "filename": s.filename, "anonymized_path": s.anonymized_path.replace("\\", "/"), 
             "study_type": s.study_type, "modality": s.modality, "pathology_detected": s.pathology_detected, 
             "status": s.status, "created_at": s.created_at, "confidence": s.confidence,
             "ai_report_draft": s.ai_report_draft, "final_report": s.final_report, "is_verified": s.is_verified} 
            for s in studies]

@app.post("/feedback")
async def save_feedback(
    study_id: int, 
    expert_correction: str, 
    notes: str, 
    annotation_data: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    from service_ai import ai_engine
    
    # 1. Save deep feedback
    new_feedback = Feedback(
        study_id=study_id,
        expert_correction=expert_correction,
        annotation_data=annotation_data,
        correction_notes=notes
    )
    db.add(new_feedback)
    
    # 2. Update study status and mark as verified
    study = db.query(Study).filter(Study.id == study_id).first()
    if study:
        study.status = "Corrected"
        study.is_verified = True
        db.commit()
    
    # 3. Trigger AI Learning module
    ai_engine.learn_from_feedback(study_id, expert_correction)
    
    return {"status": "Feedback saved and AI updated"}

@app.post("/verify/{study_id}")
async def verify_study(study_id: int, db: Session = Depends(get_db)):
    study = db.query(Study).filter(Study.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    
    study.is_verified = True
    study.status = "Verified"
    db.commit()
    return {"status": "Study verified by expert"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
