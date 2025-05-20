from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime

from .database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)

    prompt_text = Column(Text, nullable=False)
    generated_report_path = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Report(id={self.id}, created_at={self.created_at}, updated_at={self.updated_at})>"
