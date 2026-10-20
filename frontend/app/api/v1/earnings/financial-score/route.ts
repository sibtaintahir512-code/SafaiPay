import { NextRequest, NextResponse } from 'next/server';

const NON_BANKING_DISCLAIMER =
  'DISCLAIMER: SafaiPay is an informal circular-economy marketplace technology platform, NOT a bank, microfinance institution, lender, insurer, or payment system operator. Credit readiness indicators are algorithmically generated voluntary estimates for sharing with licensed financial partners.';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const consent = searchParams.get('consent');

  if (consent === 'false') {
    return NextResponse.json(
      { detail: 'Explicit user consent is required to process and access Digital Financial Identity scoring.' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    collector_id: 'col-current',
    collector_name: 'Rashid Khan',
    credit_score: 785,
    score_grade: 'AAA (Excellent)',
    monthly_moving_avg_pkr: 44200.0,
    total_verified_kg: 1250.0,
    dispute_free_rate: 100.0,
    customer_rating_avg: 4.95,
    eligible_micro_loan_pkr: 150000.0,
    eligible_financing_product: 'Electric Loader Rickshaw / Motorbike Lease Financing',
    consent_granted: true,
    disclaimer: NON_BANKING_DISCLAIMER,
    pillars: [
      {
        pillar_name: 'Collection Volume Regularity',
        weight_percentage: 40,
        score_earned: 38.5,
        max_score: 40.0,
        description: 'Verified monthly recyclable collection volume consistency.',
      },
      {
        pillar_name: 'IoT Calibrated Scale Verification',
        weight_percentage: 30,
        score_earned: 30.0,
        max_score: 30.0,
        description: 'Use of tamper-evident digital scales with LCD photo capture.',
      },
      {
        pillar_name: 'Dispute-Free Fulfillment Rate',
        weight_percentage: 20,
        score_earned: 20.0,
        max_score: 20.0,
        description: 'Transaction history free from customer weight or pricing disputes.',
      },
      {
        pillar_name: 'Customer Trust & Service Rating',
        weight_percentage: 10,
        score_earned: 9.8,
        max_score: 10.0,
        description: '5-star ratings from verified household and enterprise pickups.',
      },
    ],
  });
}
