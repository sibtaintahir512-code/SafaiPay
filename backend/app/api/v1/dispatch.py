import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.dispatch import DispatchRecord
from app.schemas.dispatch import DispatchCreate, DispatchResponse
from app.api.deps import require_roles

router = APIRouter(prefix="/dispatch", tags=["Indus Logistics & Freight Dispatch"])

@router.get("", response_model=List[DispatchResponse])
async def list_dispatches(
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List freight dispatch manifest records with weighbridge and vehicle telemetry."""
    query = select(DispatchRecord).order_by(DispatchRecord.created_at.desc()).offset(skip).limit(limit)
    if status_filter:
        query = query.where(DispatchRecord.status == status_filter)

    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{id}", response_model=DispatchResponse)
async def get_dispatch_details(
    id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get single dispatch tracking manifest by ID."""
    query = select(DispatchRecord).where(DispatchRecord.id == id)
    result = await db.execute(query)
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dispatch record '{id}' not found."
        )
    return record
