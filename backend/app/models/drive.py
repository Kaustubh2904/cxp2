from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

# Import base from database connection to use the same instance
from app.database.connection import Base

class Drive(Base):
    __tablename__ = "drives"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False)  # Technical MCQ, Aptitude MCQ, HR MCQ, Coding MCQ
    
    # Window times (scheduled by company)
    window_start = Column(DateTime, nullable=True)  # Scheduled start of active window
    window_end = Column(DateTime, nullable=True)  # Scheduled end of active window
    
    # Actual window times (when manually started/ended)
    actual_window_start = Column(DateTime, nullable=True)  # When window actually opened
    actual_window_end = Column(DateTime, nullable=True)  # When window actually closed
    
    # Exam duration per student
    exam_duration_minutes = Column(Integer, nullable=False)  # How long each student gets
    
    # Legacy fields for backward compatibility
    duration_minutes = Column(Integer, nullable=True)  # Old field, kept for migration
    scheduled_start = Column(DateTime, nullable=True)  # Old field, kept for migration
    actual_start = Column(DateTime, nullable=True)  # Old field, kept for migration
    actual_end = Column(DateTime, nullable=True)  # Old field, kept for migration
    question_type = Column(String, nullable=True)  # Old field, kept for migration
    
    status = Column(String, default="draft")  # draft, submitted, approved, rejected, upcoming, live, completed, suspended
    is_approved = Column(Boolean, default=False)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="company_drives")
    questions = relationship("Question", back_populates="drive", cascade="all, delete-orphan")
    targets = relationship("DriveTarget", back_populates="drive", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="drive", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Drive(id={self.id}, title='{self.title}', status='{self.status}')>"