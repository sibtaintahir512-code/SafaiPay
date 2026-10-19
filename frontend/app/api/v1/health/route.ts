import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'SafaiPay Web Gateway',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: {
      auth: true,
      pickups: true,
      pricing: true,
      materials: true,
      offline_demo_mode: true,
    },
  });
}
