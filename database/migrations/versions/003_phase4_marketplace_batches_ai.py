"""Phase 4: Marketplace, Material Batches, Logistics Dispatch, and AI Governance

Revision ID: 003_phase4_marketplace_batches_ai
Revises: 002_phase3_core_mvp
Create Date: 2026-10-22 21:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '003_phase4_marketplace_batches_ai'
down_revision: Union[str, None] = '002_phase3_core_mvp'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    # 1. material_batches
    if 'material_batches' not in existing_tables:
        op.create_table(
            'material_batches',
            sa.Column('id', sa.CHAR(length=36), nullable=False),
            sa.Column('batch_code', sa.String(length=50), nullable=False),
            sa.Column('material_code', sa.String(length=50), nullable=False),
            sa.Column('net_weight_kg', sa.Numeric(precision=12, scale=2), nullable=False),
            sa.Column('purity_percentage', sa.Numeric(precision=5, scale=2), server_default='99.00', nullable=True),
            sa.Column('status', sa.String(length=30), server_default='AVAILABLE', nullable=False),
            sa.Column('hub_location', sa.String(length=200), server_default='Korangi Hub, Karachi', nullable=True),
            sa.Column('procured_by_user_id', sa.CHAR(length=36), nullable=True),
            sa.Column('procured_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['procured_by_user_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_material_batches_batch_code'), 'material_batches', ['batch_code'], unique=True)

    # 2. dispatch_records
    if 'dispatch_records' not in existing_tables:
        op.create_table(
            'dispatch_records',
            sa.Column('id', sa.CHAR(length=36), nullable=False),
            sa.Column('tracking_number', sa.String(length=50), nullable=False),
            sa.Column('batch_id', sa.CHAR(length=36), nullable=True),
            sa.Column('carrier_name', sa.String(length=100), server_default='Indus Eco-Logistics', nullable=True),
            sa.Column('vehicle_plate', sa.String(length=30), nullable=False),
            sa.Column('gross_weight_kg', sa.Numeric(precision=12, scale=2), nullable=True),
            sa.Column('tare_weight_kg', sa.Numeric(precision=12, scale=2), nullable=True),
            sa.Column('net_weight_kg', sa.Numeric(precision=12, scale=2), nullable=False),
            sa.Column('status', sa.String(length=30), server_default='IN_TRANSIT', nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['batch_id'], ['material_batches.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_dispatch_records_tracking_number'), 'dispatch_records', ['tracking_number'], unique=True)

    # 3. ai_model_versions
    if 'ai_model_versions' not in existing_tables:
        op.create_table(
            'ai_model_versions',
            sa.Column('id', sa.CHAR(length=36), nullable=False),
            sa.Column('version_name', sa.String(length=50), nullable=False),
            sa.Column('architecture', sa.String(length=100), server_default='MobileNetV3-Small-FineTuned', nullable=True),
            sa.Column('classes', sa.String(length=500), server_default='["PET plastic", "cardboard", "other/unknown"]', nullable=True),
            sa.Column('description', sa.String(length=500), server_default='Demo classifier for recyclable waste pre-screening', nullable=True),
            sa.Column('accuracy', sa.Float(), server_default='0.912', nullable=True),
            sa.Column('precision', sa.Float(), server_default='0.905', nullable=True),
            sa.Column('recall', sa.Float(), server_default='0.898', nullable=True),
            sa.Column('f1_score', sa.Float(), server_default='0.901', nullable=True),
            sa.Column('is_active', sa.Boolean(), server_default=sa.true(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_ai_model_versions_version_name'), 'ai_model_versions', ['version_name'], unique=True)

    # 4. ai_predictions
    if 'ai_predictions' not in existing_tables:
        op.create_table(
            'ai_predictions',
            sa.Column('id', sa.CHAR(length=36), nullable=False),
            sa.Column('user_id', sa.CHAR(length=36), nullable=True),
            sa.Column('pickup_id', sa.CHAR(length=36), nullable=True),
            sa.Column('image_url', sa.String(length=500), nullable=True),
            sa.Column('image_hash', sa.String(length=64), nullable=True),
            sa.Column('file_name', sa.String(length=255), nullable=True),
            sa.Column('file_size_bytes', sa.Integer(), nullable=True),
            sa.Column('mime_type', sa.String(length=100), nullable=True),
            sa.Column('predicted_material', sa.String(length=100), nullable=False),
            sa.Column('confidence', sa.Float(), nullable=False),
            sa.Column('requires_manual_verification', sa.Boolean(), server_default=sa.false(), nullable=False),
            sa.Column('status', sa.String(length=50), server_default='PREDICTED', nullable=False),
            sa.Column('verified_material', sa.String(length=100), nullable=True),
            sa.Column('verified_by_user_id', sa.CHAR(length=36), nullable=True),
            sa.Column('verification_notes', sa.String(length=500), nullable=True),
            sa.Column('is_corrected', sa.Boolean(), server_default=sa.false(), nullable=False),
            sa.Column('corrected_by_user_id', sa.CHAR(length=36), nullable=True),
            sa.Column('model_version', sa.String(length=50), server_default='demo-v1', nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['corrected_by_user_id'], ['users.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['pickup_id'], ['pickup_requests.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['verified_by_user_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_ai_predictions_user_id'), 'ai_predictions', ['user_id'])
        op.create_index(op.f('ix_ai_predictions_pickup_id'), 'ai_predictions', ['pickup_id'])

    # 5. inventory_items
    if 'inventory_items' not in existing_tables:
        op.create_table(
            'inventory_items',
            sa.Column('id', sa.CHAR(length=36), nullable=False),
            sa.Column('pickup_id', sa.CHAR(length=36), nullable=True),
            sa.Column('material_type', sa.String(length=100), nullable=False),
            sa.Column('verified_weight_kg', sa.Numeric(precision=12, scale=2), nullable=False),
            sa.Column('quality_factor', sa.Numeric(precision=3, scale=2), server_default='1.00', nullable=False),
            sa.Column('quality_grade', sa.String(length=50), server_default='Tier A', nullable=False),
            sa.Column('location', sa.String(length=200), server_default='Korangi Central Aggregation Hub, Karachi', nullable=False),
            sa.Column('hub_sector', sa.String(length=100), server_default='District East', nullable=True),
            sa.Column('status', sa.String(length=50), server_default='AVAILABLE', nullable=False),
            sa.Column('created_by_user_id', sa.CHAR(length=36), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['pickup_id'], ['pickup_requests.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('pickup_id')
        )
        op.create_index(op.f('ix_inventory_items_material_type'), 'inventory_items', ['material_type'])
        op.create_index(op.f('ix_inventory_items_status'), 'inventory_items', ['status'])

    # 6. recycler_demands
    if 'recycler_demands' not in existing_tables:
        op.create_table(
            'recycler_demands',
            sa.Column('id', sa.CHAR(length=36), nullable=False),
            sa.Column('recycler_id', sa.CHAR(length=36), nullable=False),
            sa.Column('material_type', sa.String(length=100), nullable=False),
            sa.Column('required_quantity_kg', sa.Numeric(precision=12, scale=2), nullable=False),
            sa.Column('minimum_quality', sa.String(length=50), server_default='Tier A', nullable=False),
            sa.Column('location', sa.String(length=200), server_default='Karachi Industrial Area', nullable=False),
            sa.Column('offered_price_per_kg', sa.Numeric(precision=10, scale=2), nullable=False),
            sa.Column('deadline', sa.DateTime(), nullable=False),
            sa.Column('status', sa.String(length=50), server_default='OPEN', nullable=False),
            sa.Column('notes', sa.String(length=500), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['recycler_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_recycler_demands_recycler_id'), 'recycler_demands', ['recycler_id'])
        op.create_index(op.f('ix_recycler_demands_material_type'), 'recycler_demands', ['material_type'])
        op.create_index(op.f('ix_recycler_demands_status'), 'recycler_demands', ['status'])

    # 7. supply_offers
    if 'supply_offers' not in existing_tables:
        op.create_table(
            'supply_offers',
            sa.Column('id', sa.CHAR(length=36), nullable=False),
            sa.Column('demand_id', sa.CHAR(length=36), nullable=False),
            sa.Column('collector_id', sa.CHAR(length=36), nullable=False),
            sa.Column('inventory_item_id', sa.CHAR(length=36), nullable=True),
            sa.Column('offered_quantity_kg', sa.Numeric(precision=12, scale=2), nullable=False),
            sa.Column('offered_price_per_kg', sa.Numeric(precision=10, scale=2), nullable=False),
            sa.Column('notes', sa.String(length=500), nullable=True),
            sa.Column('status', sa.String(length=50), server_default='OFFER_SUBMITTED', nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['collector_id'], ['users.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['demand_id'], ['recycler_demands.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['inventory_item_id'], ['inventory_items.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_supply_offers_demand_id'), 'supply_offers', ['demand_id'])
        op.create_index(op.f('ix_supply_offers_collector_id'), 'supply_offers', ['collector_id'])
        op.create_index(op.f('ix_supply_offers_inventory_item_id'), 'supply_offers', ['inventory_item_id'])
        op.create_index(op.f('ix_supply_offers_status'), 'supply_offers', ['status'])

    # 8. supply_transactions
    if 'supply_transactions' not in existing_tables:
        op.create_table(
            'supply_transactions',
            sa.Column('id', sa.CHAR(length=36), nullable=False),
            sa.Column('offer_id', sa.CHAR(length=36), nullable=False),
            sa.Column('demand_id', sa.CHAR(length=36), nullable=False),
            sa.Column('recycler_id', sa.CHAR(length=36), nullable=False),
            sa.Column('collector_id', sa.CHAR(length=36), nullable=False),
            sa.Column('inventory_item_id', sa.CHAR(length=36), nullable=True),
            sa.Column('agreed_quantity_kg', sa.Numeric(precision=12, scale=2), nullable=False),
            sa.Column('agreed_price_per_kg', sa.Numeric(precision=10, scale=2), nullable=False),
            sa.Column('total_amount_pkr', sa.Numeric(precision=14, scale=2), nullable=False),
            sa.Column('status', sa.String(length=50), server_default='ACCEPTED', nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['collector_id'], ['users.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['demand_id'], ['recycler_demands.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['inventory_item_id'], ['inventory_items.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['offer_id'], ['supply_offers.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['recycler_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_supply_transactions_offer_id'), 'supply_transactions', ['offer_id'])
        op.create_index(op.f('ix_supply_transactions_demand_id'), 'supply_transactions', ['demand_id'])
        op.create_index(op.f('ix_supply_transactions_recycler_id'), 'supply_transactions', ['recycler_id'])
        op.create_index(op.f('ix_supply_transactions_collector_id'), 'supply_transactions', ['collector_id'])
        op.create_index(op.f('ix_supply_transactions_inventory_item_id'), 'supply_transactions', ['inventory_item_id'])
        op.create_index(op.f('ix_supply_transactions_status'), 'supply_transactions', ['status'])

def downgrade() -> None:
    op.drop_table('supply_transactions')
    op.drop_table('supply_offers')
    op.drop_table('recycler_demands')
    op.drop_table('inventory_items')
    op.drop_table('ai_predictions')
    op.drop_table('ai_model_versions')
    op.drop_table('dispatch_records')
    op.drop_table('material_batches')
