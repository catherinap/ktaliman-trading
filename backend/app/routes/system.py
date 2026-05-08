from fastapi import APIRouter
from sqlalchemy import text
from app.db import engine

router = APIRouter()

@router.get("/system/status")
def system_status():
    with engine.connect() as conn:
        latest_date = conn.execute(text("""
            SELECT MAX(report_date) AS latest_report_date
            FROM cot_analytics
        """)).scalar()

        total_rows = conn.execute(text("""
            SELECT COUNT(*) FROM cot_analytics
        """)).scalar()

        asset_count = conn.execute(text("""
            SELECT COUNT(DISTINCT symbol) FROM cot_analytics
        """)).scalar()

    return {
        "latest_report_date": latest_date,
        "total_rows": total_rows,
        "asset_count": asset_count
    }