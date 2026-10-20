import { NextRequest, NextResponse } from 'next/server';

let TRANSACTIONS_STORE = [
  {
    id: 'txn-001',
    demand_id: 'dem-001',
    offer_id: 'off-001',
    collector_id: 'usr-coll-001',
    collector_name: 'Muhammad Rafiq (Korangi Aggregation)',
    recycler_id: 'usr-rec-001',
    recycler_name: 'Indus Polymer Industries Ltd',
    material_type: 'PET plastic',
    quantity_kg: 2500.0,
    agreed_price_per_kg: 85.0,
    total_amount_pkr: 212500.0,
    status: 'ACCEPTED',
    created_at: new Date(Date.now() - 43200000).toISOString()
  },
  {
    id: 'txn-002',
    demand_id: 'dem-002',
    offer_id: 'off-002',
    collector_id: 'usr-coll-002',
    collector_name: 'Tariq Mehmood (SITE Logistics Hub)',
    recycler_id: 'usr-rec-002',
    recycler_name: 'Pak Board & Paper Mills',
    material_type: 'cardboard',
    quantity_kg: 5000.0,
    agreed_price_per_kg: 42.0,
    total_amount_pkr: 210000.0,
    status: 'DELIVERED',
    delivery_proof_url: 'https://safaipay.org/proof/gatepass_88.jpg',
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let list = TRANSACTIONS_STORE;
  if (status) list = list.filter((t) => t.status.toUpperCase() === status.toUpperCase());

  return NextResponse.json(list);
}
