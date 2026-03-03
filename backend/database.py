from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./radiology_ai.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Study(Base):
    __tablename__ = "studies"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    modality = Column(String) # CR, CT, MR, etc.
    study_type = Column(String, default="General") # Chest, Brain, Spine, etc.
    original_path = Column(String)
    anonymized_path = Column(String)
    status = Column(String, default="Pending")
    pathology_detected = Column(String)
    confidence = Column(Float)
    ai_report_draft = Column(Text)
    final_report = Column(Text)
    is_verified = Column(Boolean, default=False) # True if a doctor confirmed/corrected it
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    feedbacks = relationship("Feedback", back_populates="study")

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey("studies.id"))
    expert_correction = Column(String) # The "labeled" truth for learning
    annotation_data = Column(Text)  # JSON string of coordinates/markings
    correction_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationship
    study = relationship("Study", back_populates="feedbacks")

# Create tables
Base.metadata.create_all(bind=engine)
