import { NextRequest, NextResponse } from 'next/server';

const MOCK_LOW_CONFIDENCE = [
  {
    id: 'pred-low-001',
    user_id: 'usr-customer-001',
    image_url: '/uploads/debris_sample.jpg',
    material: 'other/unknown',
    confidence: 0.52,
    requires_manual_verification: true,
    status: 'PENDING',
    verified_material: null,
    is_corrected: false,
    model_version: 'demo-v1',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    disclaimer: 'DEMO CLASSIFIER (demo-v1): Requires supervisor review.'
  },
  {
    id: 'pred-low-002',
    user_id: 'usr-customer-002',
    image_url: '/uploads/mixed_packaging.jpg',
    material: 'other/unknown',
    confidence: 0.58,
    requires_manual_verification: true,
    status: 'PENDING',
    verified_material: null,
    is_corrected: false,
    model_version: 'demo-v1',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    disclaimer: 'DEMO CLASSIFIER (demo-v1): Requires supervisor review.'
  }
];

export async function GET(req: NextRequest) {
  return NextResponse.json(MOCK_LOW_CONFIDENCE);
}
