import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.material import Material, MaterialPriceHistory
from app.models.user import User
from app.schemas.material import MaterialCreate, MaterialResponse, BenchmarkRateUpdate
from app.api.deps import require_roles
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/materials", tags=["Waste Categories & Benchmark Pricing"])

@router.get("", response_model=List[MaterialResponse])
async def list_materials(db: AsyncSession = Depends(get_db)):
    """List all active recyclable materials with benchmark scrap rates."""
    query = select(Material).where(Material.is_active == True)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def create_material(
    payload: MaterialCreate,
    current_admin: User = Depends(require_roles(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Admin-only: Register a new recyclable waste category."""
    query = select(Material).where(Material.code == payload.code)
    existing = await db.execute(query)
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Material with code '{payload.code}' already exists."
        )

    new_mat = Material(
        id=uuid.uuid4(),
        code=payload.code,
        name=payload.name,
        unit=payload.unit,
        description=payload.description,
        benchmark_rate_pkr=payload.benchmark_rate_pkr,
        tier_a_factor=payload.tier_a_factor,
        tier_b_factor=payload.tier_b_factor,
        tier_c_factor=payload.tier_c_factor,
        is_active=payload.is_active
    )
    db.add(new_mat)
    await db.commit()
    await db.refresh(new_mat)
    return new_mat

@router.patch("/{code}/rate", response_model=MaterialResponse)
async def update_benchmark_rate(
    code: str,
    payload: BenchmarkRateUpdate,
    request: Request,
    current_admin: User = Depends(require_roles(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """Admin-only: Update material benchmark rate and log price audit history."""
    query = select(Material).where(Material.code == code)
    result = await db.execute(query)
    mat = result.scalar_one_or_none()

    if not mat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Material category '{code}' not found."
        )

    old_rate = float(mat.benchmark_rate_pkr)
    mat.benchmark_rate_pkr = payload.benchmark_rate_pkr

    history = MaterialPriceHistory(
        id=uuid.uuid4(),
        material_id=mat.id,
        benchmark_rate_pkr=payload.benchmark_rate_pkr,
        changed_by_user_id=current_admin.id,
        notes=payload.notes or f"Rate updated from PKR {old_rate} to PKR {payload.benchmark_rate_pkr}"
    )
    db.add(history)
    await db.commit()
    await db.refresh(mat)

    client_ip = request.client.host if request.client else None
    await log_audit_event(
        db=db,
        action_name="PRICE_RATE_UPDATED",
        entity_name="materials",
        actor_id=str(current_admin.id),
        entity_id=str(mat.id),
        details=f"Admin updated {code} rate to PKR {payload.benchmark_rate_pkr}/kg",
        ip_address=client_ip
    )

    return mat
