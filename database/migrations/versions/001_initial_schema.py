"""Initial schema migration for SafaiPay Foundation

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-19 21:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 0. Enable PostGIS spatial extension on PostgreSQL if available
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        try:
            op.execute(sa.text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        except Exception:
            pass  # Extension may require manual cloud dashboard toggle or already exist

    # 1. roles table
    op.create_table(
        'roles',
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('name')
    )

    # 2. users table
    op.create_table(
        'users',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('phone_number', sa.String(length=20), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('full_name', sa.String(length=150), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='ACTIVE'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('is_phone_verified', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_phone_number'), 'users', ['phone_number'], unique=True)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 3. user_roles table
    op.create_table(
        'user_roles',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('user_id', sa.CHAR(length=36), nullable=False),
        sa.Column('role_name', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['role_name'], ['roles.name'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_roles_user_id'), 'user_roles', ['user_id'])
    op.create_index(op.f('ix_user_roles_role_name'), 'user_roles', ['role_name'])

    # 4. customer_profiles
    op.create_table(
        'customer_profiles',
        sa.Column('user_id', sa.CHAR(length=36), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('organization_name', sa.String(length=200), nullable=True),
        sa.Column('street_address', sa.String(length=500), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False, server_default='Karachi'),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('contact_person', sa.String(length=150), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id')
    )

    # 5. collector_profiles
    op.create_table(
        'collector_profiles',
        sa.Column('user_id', sa.CHAR(length=36), nullable=False),
        sa.Column('cnic_number', sa.String(length=15), nullable=False),
        sa.Column('vehicle_type', sa.String(length=50), nullable=False),
        sa.Column('kyc_status', sa.String(length=30), nullable=False, server_default='SUBMITTED'),
        sa.Column('digital_scale_id', sa.String(length=50), nullable=True),
        sa.Column('is_online', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('current_latitude', sa.Float(), nullable=True),
        sa.Column('current_longitude', sa.Float(), nullable=True),
        sa.Column('rating_average', sa.Numeric(precision=3, scale=2), nullable=False, server_default='5.00'),
        sa.Column('total_pickups_completed', sa.Numeric(precision=10, scale=0), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id')
    )
    op.create_index(op.f('ix_collector_profiles_cnic_number'), 'collector_profiles', ['cnic_number'], unique=True)

    # 6. recycler_profiles
    op.create_table(
        'recycler_profiles',
        sa.Column('user_id', sa.CHAR(length=36), nullable=False),
        sa.Column('company_name', sa.String(length=200), nullable=False),
        sa.Column('ntn_number', sa.String(length=30), nullable=False),
        sa.Column('factory_address', sa.String(length=500), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False, server_default='Karachi'),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('verification_status', sa.String(length=30), nullable=False, server_default='VERIFIED'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id')
    )
    op.create_index(op.f('ix_recycler_profiles_ntn_number'), 'recycler_profiles', ['ntn_number'], unique=True)

    # 7. admin_profiles
    op.create_table(
        'admin_profiles',
        sa.Column('user_id', sa.CHAR(length=36), nullable=False),
        sa.Column('department', sa.String(length=100), nullable=False),
        sa.Column('employee_id', sa.String(length=50), nullable=True),
        sa.Column('permissions_level', sa.String(length=50), nullable=False, server_default='SUPERADMIN'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id')
    )

    # 8. materials
    op.create_table(
        'materials',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('unit', sa.String(length=20), nullable=False, server_default='kg'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('benchmark_rate_pkr', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('tier_a_factor', sa.Numeric(precision=4, scale=2), nullable=False, server_default='1.00'),
        sa.Column('tier_b_factor', sa.Numeric(precision=4, scale=2), nullable=False, server_default='0.90'),
        sa.Column('tier_c_factor', sa.Numeric(precision=4, scale=2), nullable=False, server_default='0.75'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_materials_code'), 'materials', ['code'], unique=True)

    # 9. material_price_history
    op.create_table(
        'material_price_history',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('material_id', sa.CHAR(length=36), nullable=False),
        sa.Column('benchmark_rate_pkr', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('changed_by_user_id', sa.CHAR(length=36), nullable=True),
        sa.Column('notes', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['changed_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['material_id'], ['materials.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_material_price_history_material_id'), 'material_price_history', ['material_id'])

    # 10. audit_logs
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('actor_id', sa.CHAR(length=36), nullable=True),
        sa.Column('action_name', sa.String(length=100), nullable=False),
        sa.Column('entity_name', sa.String(length=100), nullable=False),
        sa.Column('entity_id', sa.String(length=100), nullable=True),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_actor_id'), 'audit_logs', ['actor_id'])
    op.create_index(op.f('ix_audit_logs_action_name'), 'audit_logs', ['action_name'])
    op.create_index(op.f('ix_audit_logs_created_at'), 'audit_logs', ['created_at'])

def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('material_price_history')
    op.drop_table('materials')
    op.drop_table('admin_profiles')
    op.drop_table('recycler_profiles')
    op.drop_table('collector_profiles')
    op.drop_table('customer_profiles')
    op.drop_table('user_roles')
    op.drop_table('users')
    op.drop_table('roles')
