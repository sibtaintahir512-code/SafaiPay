from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models.payment import CollectorEarning
from app.models.pickup import WeightRecord
from app.models.user import User
from app.schemas.payment import CollectorEarningsSummary, CollectorEarningRecord
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/earnings", tags=["Collector Earnings & Financial History"])

@router.get("/summary", response_model=CollectorEarningsSummary)
async def get_collector_earnings_summary(
    collector_id: Optional[str] = None,
    current_user: User = Depends(require_roles(["COLLECTOR", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve daily, weekly, and monthly aggregated earnings.
    Security Rule: Collector cannot access another collector's earnings.
    """
    target_id = str(current_user.id)
    if collector_id:
        if "ADMIN" not in current_user.role_names and str(collector_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Collector cannot access another collector's earnings."
            )
        target_id = collector_id

    now_date = datetime.now(timezone.utc).date()
    week_ago = now_date - timedelta(days=7)
    month_ago = now_date - timedelta(days=30)

    # All earnings for collector
    query = select(CollectorEarning).where(CollectorEarning.collector_id == target_id)
    result = await db.execute(query)
    records = result.scalars().all()

    today_sum = sum(float(r.net_earnings_pkr) for r in records if r.earned_date == now_date)
    week_sum = sum(float(r.net_earnings_pkr) for r in records if r.earned_date >= week_ago)
    month_sum = sum(float(r.net_earnings_pkr) for r in records if r.earned_date >= month_ago)
    completed_count = len(records)

    # Verified kg recorded
    q_kg = select(func.sum(WeightRecord.verified_weight_kg)).where(
        WeightRecord.recorded_by_user_id == target_id
    )
    kg_res = (await db.execute(q_kg)).scalar() or 0.0

    return CollectorEarningsSummary(
        today_earnings_pkr=round(today_sum, 2),
        week_earnings_pkr=round(week_sum, 2),
        month_earnings_pkr=round(month_sum, 2),
        completed_jobs_count=completed_count,
        total_verified_kg=round(float(kg_res), 2)
    )

@router.get("/history", response_model=List[CollectorEarningRecord])
async def get_collector_earnings_history(
    collector_id: Optional[str] = None,
    current_user: User = Depends(require_roles(["COLLECTOR", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve completed pickup earning transaction history."""
    target_id = str(current_user.id)
    if collector_id:
        if "ADMIN" not in current_user.role_names and str(collector_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Collector cannot access another collector's earnings history."
            )
        target_id = collector_id

    query = select(CollectorEarning).where(
        CollectorEarning.collector_id == target_id
    ).order_by(CollectorEarning.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()
