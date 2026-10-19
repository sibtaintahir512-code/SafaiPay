import uuid
from typing import Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.models.user import User, Role, UserRole, RoleEnum
from app.models.profiles import CustomerProfile, CollectorProfile, RecyclerProfile, AdminProfile
from app.schemas.auth import UserRegisterRequest
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from app.services.audit_service import log_audit_event

async def register_new_user(
    db: AsyncSession,
    data: UserRegisterRequest,
    ip_address: Optional[str] = None
) -> User:
    """Register a new user with secure password hash, role assignment, and role profile."""
    # Check duplicate phone
    query_phone = select(User).where(User.phone_number == data.phone_number)
    result_phone = await db.execute(query_phone)
    if result_phone.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with phone number '{data.phone_number}' already exists."
        )

    # Check duplicate email if provided
    if data.email:
        query_email = select(User).where(User.email == data.email)
        result_email = await db.execute(query_email)
        if result_email.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"User with email '{data.email}' already exists."
            )

    # Hash password securely
    hashed_pwd = get_password_hash(data.password)

    new_user = User(
        id=uuid.uuid4(),
        phone_number=data.phone_number,
        email=data.email,
        full_name=data.full_name,
        hashed_password=hashed_pwd,
        status="ACTIVE",
        is_active=True,
        is_phone_verified=False
    )
    db.add(new_user)
    await db.flush()

    # Ensure role exists in `roles` table
    role_name = data.role.value
    query_role = select(Role).where(Role.name == role_name)
    role_res = await db.execute(query_role)
    if not role_res.scalar_one_or_none():
        db.add(Role(name=role_name, description=f"Default {role_name} role"))
        await db.flush()

    # Assign role
    user_role = UserRole(user_id=new_user.id, role_name=role_name)
    db.add(user_role)

    # Create associated profile
    if data.role == RoleEnum.CUSTOMER:
        prof = data.customer_profile
        street = prof.street_address if prof else "Karachi Central"
        org = prof.organization_name if prof else None
        entity = prof.entity_type if prof else "COMMERCIAL_OFFICE"
        lat = prof.latitude if prof else 24.8607
        lng = prof.longitude if prof else 67.0011
        contact = prof.contact_person if prof else data.full_name
        db.add(CustomerProfile(
            user_id=new_user.id,
            entity_type=entity,
            organization_name=org,
            street_address=street,
            city="Karachi",
            latitude=lat,
            longitude=lng,
            contact_person=contact
        ))
    elif data.role == RoleEnum.COLLECTOR:
        prof = data.collector_profile
        cnic = prof.cnic_number if prof else f"42101-{str(new_user.id)[:7]}-1"
        veh = prof.vehicle_type if prof else "MOTOR_TRICYCLE"
        scale = prof.digital_scale_id if prof else "SCALE-PENDING"
        db.add(CollectorProfile(
            user_id=new_user.id,
            cnic_number=cnic,
            vehicle_type=veh,
            kyc_status="SUBMITTED",
            digital_scale_id=scale,
            is_online=False
        ))
    elif data.role == RoleEnum.RECYCLER:
        prof = data.recycler_profile
        company = prof.company_name if prof else data.full_name
        ntn = prof.ntn_number if prof else f"NTN-{str(new_user.id)[:8]}"
        factory = prof.factory_address if prof else "Korangi Industrial Area, Karachi"
        db.add(RecyclerProfile(
            user_id=new_user.id,
            company_name=company,
            ntn_number=ntn,
            factory_address=factory,
            city="Karachi",
            verification_status="VERIFIED"
        ))
    elif data.role == RoleEnum.ADMIN:
        prof = data.admin_profile
        dept = prof.department if prof else "Platform Operations"
        emp = prof.employee_id if prof else f"ADM-{str(new_user.id)[:6]}"
        db.add(AdminProfile(
            user_id=new_user.id,
            department=dept,
            employee_id=emp,
            permissions_level="SUPERADMIN"
        ))

    await db.commit()
    await db.refresh(new_user)

    # Log audit event
    await log_audit_event(
        db=db,
        action_name="USER_REGISTER",
        entity_name="users",
        actor_id=str(new_user.id),
        entity_id=str(new_user.id),
        details=f"User registered with role {role_name}",
        ip_address=ip_address
    )

    return new_user

async def authenticate_user(
    db: AsyncSession,
    identifier: str,
    password: str,
    ip_address: Optional[str] = None
) -> User:
    """Authenticate user by phone or email, verifying password and recording audit log."""
    # Look up by phone or email
    query = select(User).where(
        or_(User.phone_number == identifier, User.email == identifier)
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.hashed_password):
        # Log failure in audit log
        await log_audit_event(
            db=db,
            action_name="LOGIN_FAILURE",
            entity_name="users",
            details=f"Failed login attempt for identifier '{identifier}'",
            ip_address=ip_address
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials: Phone/email or password is incorrect."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact SafaiPay support."
        )

    # Log login success
    await log_audit_event(
        db=db,
        action_name="LOGIN_SUCCESS",
        entity_name="users",
        actor_id=str(user.id),
        entity_id=str(user.id),
        details="User successfully authenticated",
        ip_address=ip_address
    )

    return user

def generate_auth_tokens(user: User) -> Tuple[str, str]:
    """Generate signed access and refresh tokens for user."""
    roles = user.role_names
    access_token = create_access_token(
        subject=str(user.id),
        roles=roles,
        extra_claims={"phone": user.phone_number}
    )
    refresh_token = create_refresh_token(subject=str(user.id))
    return access_token, refresh_token
