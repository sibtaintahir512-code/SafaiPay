"""Phase 3 Core MVP: Pickups, Pricing, Mock Payments, Earnings, Ratings, Disputes

Revision ID: 002_phase3_core_mvp
Revises: 001_initial_schema
Create Date: 2026-10-19 21:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002_phase3_core_mvp'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. pickup_requests
    op.create_table(
        'pickup_requests',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('tracking_number', sa.String(length=32), nullable=False),
        sa.Column('customer_id', sa.CHAR(length=36), nullable=False),
        sa.Column('assigned_collector_id', sa.CHAR(length=36), nullable=True),
        sa.Column('material_code', sa.String(length=50), nullable=False),
        sa.Column('estimated_quantity_kg', sa.Float(), nullable=False),
        sa.Column('street_address', sa.String(length=500), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False, server_default='Karachi'),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('preferred_time', sa.DateTime(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='requested'),
        sa.Column('cancellation_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assigned_collector_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pickup_requests_tracking_number'), 'pickup_requests', ['tracking_number'], unique=True)
    op.create_index(op.f('ix_pickup_requests_customer_id'), 'pickup_requests', ['customer_id'])
    op.create_index(op.f('ix_pickup_requests_assigned_collector_id'), 'pickup_requests', ['assigned_collector_id'])
    op.create_index(op.f('ix_pickup_requests_status'), 'pickup_requests', ['status'])

    # 2. pickup_assignments
    op.create_table(
        'pickup_assignments',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('pickup_id', sa.CHAR(length=36), nullable=False),
        sa.Column('collector_id', sa.CHAR(length=36), nullable=False),
        sa.Column('assigned_by', sa.CHAR(length=36), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='PENDING'),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['collector_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['pickup_id'], ['pickup_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assigned_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pickup_assignments_pickup_id'), 'pickup_assignments', ['pickup_id'])
    op.create_index(op.f('ix_pickup_assignments_collector_id'), 'pickup_assignments', ['collector_id'])

    # 3. waste_images
    op.create_table(
        'waste_images',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('pickup_id', sa.CHAR(length=36), nullable=False),
        sa.Column('uploaded_by_user_id', sa.CHAR(length=36), nullable=False),
        sa.Column('image_type', sa.String(length=30), nullable=False),
        sa.Column('image_url', sa.String(length=500), nullable=False),
        sa.Column('caption', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['pickup_id'], ['pickup_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_by_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_waste_images_pickup_id'), 'waste_images', ['pickup_id'])

    # 4. pickup_verifications
    op.create_table(
        'pickup_verifications',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('pickup_id', sa.CHAR(length=36), nullable=False),
        sa.Column('collector_id', sa.CHAR(length=36), nullable=False),
        sa.Column('gps_latitude', sa.Float(), nullable=False),
        sa.Column('gps_longitude', sa.Float(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['collector_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['pickup_id'], ['pickup_requests.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pickup_verifications_pickup_id'), 'pickup_verifications', ['pickup_id'])

    # 5. weight_records
    op.create_table(
        'weight_records',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('pickup_id', sa.CHAR(length=36), nullable=False),
        sa.Column('recorded_by_user_id', sa.CHAR(length=36), nullable=False),
        sa.Column('material_code', sa.String(length=50), nullable=False),
        sa.Column('verified_weight_kg', sa.Float(), nullable=False),
        sa.Column('scale_display_verified', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['pickup_id'], ['pickup_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['recorded_by_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_weight_records_pickup_id'), 'weight_records', ['pickup_id'])

    # 6. pricing_calculations
    op.create_table(
        'pricing_calculations',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('pickup_id', sa.CHAR(length=36), nullable=False),
        sa.Column('material_code', sa.String(length=50), nullable=False),
        sa.Column('verified_weight_kg', sa.Float(), nullable=False),
        sa.Column('material_rate_applied', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('quality_factor', sa.Float(), nullable=False),
        sa.Column('total_price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('calculation_breakdown', sa.Text(), nullable=False),
        sa.Column('is_estimated', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['pickup_id'], ['pickup_requests.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pricing_calculations_pickup_id'), 'pricing_calculations', ['pickup_id'])

    # 7. payments
    op.create_table(
        'payments',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('pickup_id', sa.CHAR(length=36), nullable=False),
        sa.Column('transaction_reference', sa.String(length=64), nullable=False),
        sa.Column('payer_id', sa.CHAR(length=36), nullable=False),
        sa.Column('payee_id', sa.CHAR(length=36), nullable=False),
        sa.Column('amount_pkr', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='pending'),
        sa.Column('failure_reason', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['payee_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['payer_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['pickup_id'], ['pickup_requests.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payments_transaction_reference'), 'payments', ['transaction_reference'], unique=True)
    op.create_index(op.f('ix_payments_pickup_id'), 'payments', ['pickup_id'])
    op.create_index(op.f('ix_payments_status'), 'payments', ['status'])

    # 8. collector_earnings
    op.create_table(
        'collector_earnings',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('collector_id', sa.CHAR(length=36), nullable=False),
        sa.Column('pickup_id', sa.CHAR(length=36), nullable=False),
        sa.Column('payment_id', sa.CHAR(length=36), nullable=False),
        sa.Column('gross_amount_pkr', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('net_earnings_pkr', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('earned_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['collector_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['payment_id'], ['payments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['pickup_id'], ['pickup_requests.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('payment_id')
    )
    op.create_index(op.f('ix_collector_earnings_collector_id'), 'collector_earnings', ['collector_id'])
    op.create_index(op.f('ix_collector_earnings_earned_date'), 'collector_earnings', ['earned_date'])

    # 9. ratings
    op.create_table(
        'ratings',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('pickup_id', sa.CHAR(length=36), nullable=False),
        sa.Column('rater_id', sa.CHAR(length=36), nullable=False),
        sa.Column('rated_user_id', sa.CHAR(length=36), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('review_text', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['pickup_id'], ['pickup_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['rated_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['rater_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ratings_pickup_id'), 'ratings', ['pickup_id'])

    # 10. disputes
    op.create_table(
        'disputes',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('pickup_id', sa.CHAR(length=36), nullable=False),
        sa.Column('raised_by_user_id', sa.CHAR(length=36), nullable=False),
        sa.Column('reason_category', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='OPEN'),
        sa.Column('resolution_notes', sa.Text(), nullable=True),
        sa.Column('resolved_by_admin_id', sa.CHAR(length=36), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['pickup_id'], ['pickup_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['raised_by_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['resolved_by_admin_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_disputes_pickup_id'), 'disputes', ['pickup_id'])

    # 11. notifications
    op.create_table(
        'notifications',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('user_id', sa.CHAR(length=36), nullable=False),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('notification_type', sa.String(length=50), nullable=False, server_default='INFO'),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('related_entity_id', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'])

def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('disputes')
    op.drop_table('ratings')
    op.drop_table('collector_earnings')
    op.drop_table('payments')
    op.drop_table('pricing_calculations')
    op.drop_table('weight_records')
    op.drop_table('pickup_verifications')
    op.drop_table('waste_images')
    op.drop_table('pickup_assignments')
    op.drop_table('pickup_requests')
