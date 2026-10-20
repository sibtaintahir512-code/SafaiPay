import asyncio
import os
import sys
import uuid

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal, init_db
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, Role, UserRole, RoleEnum
from app.models.profiles import CustomerProfile, CollectorProfile, RecyclerProfile, AdminProfile
from app.models.material import Material, MaterialPriceHistory
from app.models.audit import AuditLog

async def seed_database():
    print("🌱 Initializing SafaiPay database schema...")
    await init_db()

    async with AsyncSessionLocal() as session:
        print("🌱 Seeding Roles...")
        roles_data = [
            ("CUSTOMER", "Waste Generator (Households, Offices, Societies)"),
            ("COLLECTOR", "Informal Waste Collector / Kabari Worker"),
            ("RECYCLER", "Industrial B2B Scrap Processing Buyer"),
            ("ADMIN", "Platform Superadmin and Operations Lead")
        ]
        for role_name, desc in roles_data:
            q = select(Role).where(Role.name == role_name)
            res = await session.execute(q)
            if not res.scalar_one_or_none():
                session.add(Role(name=role_name, description=desc))
        await session.commit()

        demo_pwd_hash = get_password_hash(settings.DEFAULT_DEMO_PASSWORD)
        admin_pwd_hash = get_password_hash(settings.DEFAULT_ADMIN_PASSWORD)

        # 1. Admin
        print("🌱 Seeding Superadmin...")
        q_admin = select(User).where(User.phone_number == settings.DEFAULT_ADMIN_PHONE)
        res_admin = await session.execute(q_admin)
        admin_user = res_admin.scalar_one_or_none()
        if not admin_user:
            admin_user = User(
                id=uuid.uuid4(),
                phone_number=settings.DEFAULT_ADMIN_PHONE,
                email=settings.DEFAULT_ADMIN_EMAIL,
                full_name="SafaiPay Platform Superadmin",
                hashed_password=admin_pwd_hash,
                status="ACTIVE",
                is_active=True,
                is_phone_verified=True
            )
            session.add(admin_user)
            await session.flush()

            session.add(UserRole(user_id=admin_user.id, role_name="ADMIN"))
            session.add(AdminProfile(
                user_id=admin_user.id,
                department="Platform Operations",
                employee_id="ADM-001",
                permissions_level="SUPERADMIN"
            ))
            await session.commit()
            print(f"   ✓ Created Admin: {settings.DEFAULT_ADMIN_EMAIL} ({settings.DEFAULT_ADMIN_PHONE})")

        # 2. Customers (5 entities: 2 Housing Societies, 3 Commercial Offices)
        print("🌱 Seeding 5 Customers (Societies & Offices)...")
        customers_data = [
            (
                "+923001110001", "falcon@complex.pk", "Falcon Complex Management",
                "HOUSING_SOCIETY", "Falcon Complex Gated Society", "Falcon Complex, PECHS Block 6, Karachi",
                24.8640, 67.0600, "Squadron Leader (R) Tariq"
            ),
            (
                "+923001110002", "askari4@society.pk", "Askari IV Residents Directorate",
                "HOUSING_SOCIETY", "Askari IV Housing Society", "Askari IV, Main Rashid Minhas Road, Karachi",
                24.9080, 67.1120, "Major (R) Kamran"
            ),
            (
                "+923001110003", "facility@systemsltd.com", "Systems Limited Karachi Hub",
                "COMMERCIAL_OFFICE", "Systems Limited (Tech Park)", "Shahrah-e-Faisal Commercial Center, Karachi",
                24.8582, 67.0425, "Hassan Ali (Facilities Lead)"
            ),
            (
                "+923001110004", "greenops@engro.com", "Engro Polymer Corporate HQ",
                "COMMERCIAL_OFFICE", "Engro Polymer & Chemicals", "The Harbour Front, Clifton Block 4, Karachi",
                24.8150, 67.0300, "Sara Mansoor (Sustainability Manager)"
            ),
            (
                "+923001110005", "csr@nestle.pk", "Nestle Karachi Distribution Center",
                "COMMERCIAL_OFFICE", "Nestle Pakistan Corporate Hub", "KDA Scheme 1, Karsaz Road, Karachi",
                24.8820, 67.0870, "Zubair Siddiqui (Logistics Admin)"
            )
        ]

        for phone, email, name, ent_type, org, addr, lat, lng, contact in customers_data:
            q = select(User).where(User.phone_number == phone)
            if not (await session.execute(q)).scalar_one_or_none():
                u = User(
                    id=uuid.uuid4(),
                    phone_number=phone,
                    email=email,
                    full_name=name,
                    hashed_password=demo_pwd_hash,
                    status="ACTIVE",
                    is_active=True,
                    is_phone_verified=True
                )
                session.add(u)
                await session.flush()
                session.add(UserRole(user_id=u.id, role_name="CUSTOMER"))
                session.add(CustomerProfile(
                    user_id=u.id,
                    entity_type=ent_type,
                    organization_name=org,
                    street_address=addr,
                    city="Karachi",
                    latitude=lat,
                    longitude=lng,
                    contact_person=contact
                ))
                await session.commit()
                print(f"   ✓ Customer: {org} ({phone})")

        # 3. Collectors (10 verified informal collectors)
        print("🌱 Seeding 10 Verified Waste Collectors...")
        collectors_data = [
            ("+923002220001", "Muhammad Rafiq", "42101-1000001-1", "MOTOR_TRICYCLE", "SCALE-DIGI-01", 24.8607, 67.0011, 4.95),
            ("+923002220002", "Tariq Mehmood", "42101-1000002-1", "MOTOR_TRICYCLE", "SCALE-DIGI-02", 24.8620, 67.0120, 4.88),
            ("+923002220003", "Abdul Sattar", "42101-1000003-1", "HAND_CART", "SCALE-DIGI-03", 24.8550, 67.0340, 5.00),
            ("+923002220004", "Imran Khan Niazi", "42101-1000004-1", "MOTOR_TRICYCLE", "SCALE-DIGI-04", 24.8710, 67.0540, 4.90),
            ("+923002220005", "Gulzar Ahmed", "42101-1000005-1", "HAND_CART", "SCALE-DIGI-05", 24.8480, 67.0410, 4.85),
            ("+923002220006", "Naveed Akhtar", "42101-1000006-1", "PICKUP_TRUCK", "SCALE-DIGI-06", 24.8320, 67.0650, 4.92),
            ("+923002220007", "Bilal Hussain", "42101-1000007-1", "MOTOR_TRICYCLE", "SCALE-DIGI-07", 24.8890, 67.0720, 4.97),
            ("+923002220008", "Sher Ali", "42101-1000008-1", "HAND_CART", "SCALE-DIGI-08", 24.8210, 67.0280, 4.79),
            ("+923002220009", "Zahid Qureshi", "42101-1000009-1", "MOTOR_TRICYCLE", "SCALE-DIGI-09", 24.8640, 67.0890, 4.89),
            ("+923002220010", "Farooq Shah", "42101-1000010-1", "PICKUP_TRUCK", "SCALE-DIGI-10", 24.8950, 67.0980, 5.00),
        ]

        for phone, name, cnic, veh, scale, lat, lng, rating in collectors_data:
            q = select(User).where(User.phone_number == phone)
            if not (await session.execute(q)).scalar_one_or_none():
                u = User(
                    id=uuid.uuid4(),
                    phone_number=phone,
                    full_name=name,
                    hashed_password=demo_pwd_hash,
                    status="ACTIVE",
                    is_active=True,
                    is_phone_verified=True
                )
                session.add(u)
                await session.flush()
                session.add(UserRole(user_id=u.id, role_name="COLLECTOR"))
                session.add(CollectorProfile(
                    user_id=u.id,
                    cnic_number=cnic,
                    vehicle_type=veh,
                    kyc_status="VERIFIED",
                    digital_scale_id=scale,
                    is_online=True,
                    current_latitude=lat,
                    current_longitude=lng,
                    rating_average=rating,
                    total_pickups_completed=15
                ))
                await session.commit()
                print(f"   ✓ Collector: {name} ({phone}) - Scale: {scale}")

        # 4. Recyclers (2 Industrial Buyers)
        print("🌱 Seeding 2 Industrial Recycling Buyers...")
        recyclers_data = [
            (
                "+923003330001", "procurement@indusplastic.pk", "Indus Plastic Recycling Industries",
                "Indus Polymers Ltd", "NTN-4019283-1",
                "Plot 42, Sector 15, Korangi Industrial Area, Karachi", 24.8320, 67.1350
            ),
            (
                "+923003330002", "rawmaterials@sindhpaper.pk", "Sindh Paper & Packaging Board Mills",
                "Sindh Packaging Corp", "NTN-5928192-2",
                "Plot 118, Sector 7-A, Landhi Industrial Zone, Karachi", 24.8450, 67.1890
            )
        ]

        for phone, email, name, comp, ntn, addr, lat, lng in recyclers_data:
            q = select(User).where(User.phone_number == phone)
            if not (await session.execute(q)).scalar_one_or_none():
                u = User(
                    id=uuid.uuid4(),
                    phone_number=phone,
                    email=email,
                    full_name=name,
                    hashed_password=demo_pwd_hash,
                    status="ACTIVE",
                    is_active=True,
                    is_phone_verified=True
                )
                session.add(u)
                await session.flush()
                session.add(UserRole(user_id=u.id, role_name="RECYCLER"))
                session.add(RecyclerProfile(
                    user_id=u.id,
                    company_name=comp,
                    ntn_number=ntn,
                    factory_address=addr,
                    city="Karachi",
                    latitude=lat,
                    longitude=lng,
                    verification_status="VERIFIED"
                ))
                await session.commit()
                print(f"   ✓ Recycler: {comp} ({phone})")

        # 5. Materials & Benchmark Rates
        print("🌱 Seeding Recyclable Materials & Benchmark Rates...")
        materials_data = [
            (
                "PET_PLASTIC", "PET Plastic Bottles", "Cleaned clear and blue-tinted PET beverage containers",
                80.00, 1.00, 0.90, 0.75
            ),
            (
                "CARDBOARD_OCC", "Corrugated Cardboard", "Dry corrugated shipping boxes and packaging cardboard",
                35.00, 1.00, 0.90, 0.75
            )
        ]

        for code, name, desc, rate, ta, tb, tc in materials_data:
            q = select(Material).where(Material.code == code)
            mat = (await session.execute(q)).scalar_one_or_none()
            if not mat:
                mat = Material(
                    id=uuid.uuid4(),
                    code=code,
                    name=name,
                    description=desc,
                    unit="kg",
                    benchmark_rate_pkr=rate,
                    tier_a_factor=ta,
                    tier_b_factor=tb,
                    tier_c_factor=tc,
                    is_active=True
                )
                session.add(mat)
                await session.flush()

                session.add(MaterialPriceHistory(
                    id=uuid.uuid4(),
                    material_id=mat.id,
                    benchmark_rate_pkr=rate,
                    changed_by_user_id=admin_user.id if admin_user else None,
                    notes="Initial pilot benchmark wholesale scrap rate for Karachi"
                ))
                await session.commit()
                print(f"   ✓ Material: {name} ({code}) - Benchmark: PKR {rate}/kg")

        # 6. Material Batches for Recycler Marketplace
        print("🌱 Seeding Wholesale Material Batches...")
        from app.models.batch import MaterialBatch
        batches_data = [
            ("BATCH-PET-2026-041", "PET_PLASTIC", 12500.0, 99.10, "Korangi Industrial Area Hub, Karachi"),
            ("BATCH-OCC-2026-088", "CARDBOARD_OCC", 24000.0, 98.40, "SITE Area Central Hub, Karachi"),
        ]
        for bcode, mcode, net_kg, purity, hub in batches_data:
            q = select(MaterialBatch).where(MaterialBatch.batch_code == bcode)
            if not (await session.execute(q)).scalar_one_or_none():
                session.add(MaterialBatch(
                    id=uuid.uuid4(),
                    batch_code=bcode,
                    material_code=mcode,
                    net_weight_kg=net_kg,
                    purity_percentage=purity,
                    status="AVAILABLE",
                    hub_location=hub
                ))
        await session.commit()

        # 7. Initial Audit Log
        session.add(AuditLog(
            actor_id=admin_user.id if admin_user else None,
            action_name="DATABASE_SEEDED",
            entity_name="database",
            details="Phase 2 seed dataset loaded: 1 Admin, 5 Customers, 10 Collectors, 2 Recyclers, 2 Materials, 2 Batches",
            ip_address="127.0.0.1"
        ))
        await session.commit()

    print("✅ Database seeding successfully completed!")


if __name__ == "__main__":
    asyncio.run(seed_database())
