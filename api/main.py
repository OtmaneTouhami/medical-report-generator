from fastapi import Depends, FastAPI, APIRouter
from api.models import Report
from sqlalchemy.orm import Session
from datetime import datetime

from medical_report_generator.main import run
from .database import Base, get_db, engine

Base.metadata.create_all(bind=engine)

app = FastAPI()

api_router = APIRouter(prefix="/api/v1")


@api_router.get("/")
async def root():
    return {"message": "Hello World"}


@api_router.get("/reports")
async def get_reports(db: Session = Depends(get_db)):
    reports = db.query(Report).all()
    return reports


@api_router.post("/generate")
async def generate_report(prompt_text: str, db: Session = Depends(get_db)):
    report = Report(prompt_text=prompt_text)
    generate_report_result = run(prompt_text)
    if generate_report_result["is_generated"]:
        report.generated_report_path = str(
            generate_report_result["filename"]
        )
    else:
        report.error_message = generate_report_result.get(
            "error", "Error generating report"
        )

    report.created_at = datetime.utcnow()
    report.updated_at = datetime.utcnow()  

    db.add(report)
    db.commit()
    db.refresh(report)
    return report


app.include_router(api_router)
