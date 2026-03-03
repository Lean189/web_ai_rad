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

app = FastAPI(title="Radiology AI API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
app.mount("/images", StaticFiles(directory=ANONYMIZED_DIR), name="images")

@app.get("/")
async def root():
    return {"message": "Radiology AI Backend is running and connected to DB"}

@app.post("/process-study")
async def process_study(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # 1. Save Original
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    original_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    
    with open(original_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # 2. Anonymize (if DICOM)
    anonymized_path = os.path.join(ANONYMIZED_DIR, f"{file_id}{ext}")
    is_dicom = ext.lower() == ".dcm"
    if is_dicom:
        success = anonymize_dicom(original_path, anonymized_path)
        if not success:
            anonymized_path = original_path # Fallback or error
    else:
        shutil.copy(original_path, anonymized_path)

    # 3. AI Analysis
    ai_results = analyze_image(anonymized_path)
    
    # 4. Generate Report Draft
    report_draft = generate_report(ai_results["pathology"], ai_results["findings"])
    if "Error" in report_draft: # Fallback
        report_draft = get_mock_report(ai_results["pathology"], ai_results["findings"])

    # 5. Save to DB
    new_study = Study(
        filename=file.filename,
        modality=ai_results["modality"],
        original_path=original_path,
        anonymized_path=anonymized_path,
        status="Analyzed",
        pathology_detected=ai_results["pathology"],
        confidence=ai_results["confidence"],
        ai_report_draft=report_draft
    )
    db.add(new_study)
    db.commit()
    db.refresh(new_study)
    
    return new_study

@app.get("/history")
async def get_history(db: Session = Depends(get_db)):
    return db.query(Study).order_by(Study.created_at.desc()).all()

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
