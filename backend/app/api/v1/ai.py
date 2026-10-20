"""AI Computer Vision Classification & Human-In-The-Loop Verification Routes."""
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.core.database import get_db
from app.models.ai import AIPrediction, AIModelVersion
from app.models.user import User
from app.schemas.ai import (
    PredictionResponse,
    PredictionCorrectionRequest,
    PredictionVerificationRequest,
    ModelVersionResponse,
)
from app.api.deps import get_current_user, require_roles
from app.services.ai_service import AIService
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/ai", tags=["AI Classification & Model Governance"])

@router.post("/classify", response_model=PredictionResponse, status_code=status.HTTP_200_OK)
async def classify_waste_image(
    file: UploadFile = File(..., description="Recyclable waste photo file (JPEG, PNG, WebP, max 10MB)"),
    pickup_id: Optional[str] = Form(None),
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload waste photo for automated computer vision pre-screening.
    Enforces file type and size constraints with low-confidence fallback.
    """
    file_bytes = await file.read()
    filename = file.filename or "upload.jpg"
    mime_type = file.content_type or "image/jpeg"

    try:
        AIService.validate_image_file(file_bytes, filename, mime_type)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # Execute classification
    pred_data = AIService.classify_waste_image(file_bytes, filename, mime_type)
    image_hash = AIService.compute_sha256(file_bytes)

    # Persist prediction in database audit trail
    pred_record = AIPrediction(
        id=uuid.uuid4(),
        user_id=current_user.id,
        pickup_id=uuid.UUID(pickup_id) if pickup_id else None,
        image_url=f"/uploads/{image_hash[:16]}_{filename}",
        image_hash=image_hash,
        file_name=filename,
        file_size_bytes=len(file_bytes),
        mime_type=mime_type,
        predicted_material=pred_data["material"],
        confidence=pred_data["confidence"],
        requires_manual_verification=pred_data["requires_manual_verification"],
        status="FLAGGED" if pred_data["requires_manual_verification"] else "PREDICTED",
        model_version=pred_data["model_version"]
    )
    db.add(pred_record)
    await db.commit()
    await db.refresh(pred_record)

    client_ip = request.client.host if request and request.client else None
    await log_audit_event(
        db=db,
        action_name="AI_IMAGE_CLASSIFIED",
        entity_name="ai_predictions",
        actor_id=str(current_user.id),
        entity_id=str(pred_record.id),
        details=(
            f"Classified {filename} as '{pred_data['material']}' with confidence {pred_data['confidence']} "
            f"(verification_required={pred_data['requires_manual_verification']}, model={pred_data['model_version']})"
        ),
        ip_address=client_ip
    )

    return PredictionResponse(
        id=str(pred_record.id),
        material=pred_record.predicted_material,
        confidence=pred_record.confidence,
        requires_manual_verification=pred_record.requires_manual_verification,
        model_version=pred_record.model_version,
        status=pred_record.status,
        verified_material=pred_record.verified_material,
        is_corrected=pred_record.is_corrected,
        disclaimer=pred_data["disclaimer"],
        created_at=pred_record.created_at
    )

@router.get("/predictions", response_model=List[PredictionResponse])
async def list_prediction_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    requires_verification: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve history of AI classifications and verification statuses."""
    query = select(AIPrediction).order_by(AIPrediction.created_at.desc()).offset(skip).limit(limit)

    # Customers/Collectors see their own unless admin
    if "ADMIN" not in current_user.role_names:
        query = query.where(AIPrediction.user_id == current_user.id)

    if requires_verification is not None:
        query = query.where(AIPrediction.requires_manual_verification == requires_verification)

    result = await db.execute(query)
    records = result.scalars().all()

    return [
        PredictionResponse(
            id=str(r.id),
            material=r.predicted_material,
            confidence=r.confidence,
            requires_manual_verification=r.requires_manual_verification,
            model_version=r.model_version,
            status=r.status,
            verified_material=r.verified_material,
            is_corrected=r.is_corrected,
            created_at=r.created_at
        )
        for r in records
    ]

@router.get("/predictions/low-confidence", response_model=List[PredictionResponse])
async def list_low_confidence_predictions(
    current_user: User = Depends(require_roles(["ADMIN", "COLLECTOR"])),
    db: AsyncSession = Depends(get_db)
):
    """Admin / Collector: Retrieve records flagged for human-in-the-loop manual review."""
    query = select(AIPrediction).where(
        or_(
            AIPrediction.requires_manual_verification == True,
            AIPrediction.status == "FLAGGED"
        )
    ).order_by(AIPrediction.created_at.desc())
    result = await db.execute(query)
    records = result.scalars().all()

    return [
        PredictionResponse(
            id=str(r.id),
            material=r.predicted_material,
            confidence=r.confidence,
            requires_manual_verification=r.requires_manual_verification,
            model_version=r.model_version,
            status=r.status,
            verified_material=r.verified_material,
            is_corrected=r.is_corrected,
            created_at=r.created_at
        )
        for r in records
    ]

@router.post("/predictions/{id}/correct", response_model=PredictionResponse)
async def correct_ai_prediction(
    id: str,
    payload: PredictionCorrectionRequest,
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Customer or Collector: Manually correct an erroneous AI prediction."""
    query = select(AIPrediction).where(AIPrediction.id == id)
    record = (await db.execute(query)).scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AI prediction record not found.")

    # Only record owner or admin/collector can correct
    is_owner = record.user_id == current_user.id
    is_authorized = any(r in current_user.role_names for r in ["ADMIN", "COLLECTOR"])
    if not (is_owner or is_authorized):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to correct this record.")

    record.verified_material = payload.corrected_material
    record.is_corrected = True
    record.corrected_by_user_id = current_user.id
    record.status = "CORRECTED"
    record.requires_manual_verification = False

    await db.commit()
    await db.refresh(record)

    client_ip = request.client.host if request and request.client else None
    await log_audit_event(
        db=db,
        action_name="AI_PREDICTION_CORRECTED",
        entity_name="ai_predictions",
        actor_id=str(current_user.id),
        entity_id=str(record.id),
        details=f"User corrected AI material '{record.predicted_material}' -> '{payload.corrected_material}'",
        ip_address=client_ip
    )

    return PredictionResponse(
        id=str(record.id),
        material=record.predicted_material,
        confidence=record.confidence,
        requires_manual_verification=record.requires_manual_verification,
        model_version=record.model_version,
        status=record.status,
        verified_material=record.verified_material,
        is_corrected=record.is_corrected,
        created_at=record.created_at
    )

@router.post("/predictions/{id}/verify", response_model=PredictionResponse)
async def verify_human_in_the_loop(
    id: str,
    payload: PredictionVerificationRequest,
    request: Request = None,
    current_user: User = Depends(require_roles(["ADMIN", "COLLECTOR"])),
    db: AsyncSession = Depends(get_db)
):
    """Admin / Collector: Human-in-the-loop manual review and verification."""
    query = select(AIPrediction).where(AIPrediction.id == id)
    record = (await db.execute(query)).scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AI prediction record not found.")

    record.verified_material = payload.verified_material
    record.verified_by_user_id = current_user.id
    record.verification_notes = payload.verification_notes
    record.status = "VERIFIED"
    record.requires_manual_verification = False

    await db.commit()
    await db.refresh(record)

    client_ip = request.client.host if request and request.client else None
    await log_audit_event(
        db=db,
        action_name="AI_PREDICTION_VERIFIED",
        entity_name="ai_predictions",
        actor_id=str(current_user.id),
        entity_id=str(record.id),
        details=f"Human verified prediction {record.id} as '{payload.verified_material}'",
        ip_address=client_ip
    )

    return PredictionResponse(
        id=str(record.id),
        material=record.predicted_material,
        confidence=record.confidence,
        requires_manual_verification=record.requires_manual_verification,
        model_version=record.model_version,
        status=record.status,
        verified_material=record.verified_material,
        is_corrected=record.is_corrected,
        created_at=record.created_at
    )

@router.get("/model-info", response_model=ModelVersionResponse)
async def get_active_model_info():
    """Retrieve active ML model version, architecture, and future training evaluation plan."""
    meta = AIService.get_model_metadata()
    return ModelVersionResponse(**meta)
