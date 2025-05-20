from fastapi import Depends, FastAPI, APIRouter, HTTPException, Response, status
from fastapi.responses import FileResponse
from fastapi.concurrency import run_in_threadpool
from api.models import Report
from api import schemas
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from pathlib import Path

from medical_report_generator.main import run
from .database import Base, get_db, engine

Base.metadata.create_all(bind=engine)

project_root = Path(__file__).resolve().parent.parent

app = FastAPI()

api_router = APIRouter(prefix="/api/v1")


@api_router.get("/")
async def root():
    return {"message": "Hello To The Medical Report Generator API"}


@api_router.get("/reports", response_model=List[schemas.ReportResponse])
async def get_reports(db: Session = Depends(get_db)):
    reports = db.query(Report).all()
    return reports


@api_router.post("/generate", response_model=schemas.ReportResponse)
async def generate_report(prompt_text: str, db: Session = Depends(get_db)):
    report = Report(prompt_text=prompt_text)
    generate_report_result = await run_in_threadpool(run, prompt_text)
    if generate_report_result["is_generated"]:
        report.generated_report_path = str(generate_report_result["filename"])
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


@api_router.get("/reports/{report_id}/download")
async def download_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if not report.generated_report_path:
        raise HTTPException(
            status_code=404, detail="Report file not available for download"
        )

    file_path = project_root / report.generated_report_path

    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Report file not found on server")

    return FileResponse(
        path=file_path,
        filename=file_path.name,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )


@api_router.delete("/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.generated_report_path:
        file_path = project_root / report.generated_report_path

        if file_path.is_file():
            file_path.unlink()

    db.delete(report)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@api_router.delete("/reports", status_code=status.HTTP_204_NO_CONTENT)
async def delete_all_reports(db: Session = Depends(get_db)):
    reports = db.query(Report).all()
    for report_item in reports:
        if report_item.generated_report_path:
            file_path = project_root / report_item.generated_report_path

            if file_path.is_file():
                file_path.unlink()

        db.delete(report_item)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


app.include_router(api_router)
