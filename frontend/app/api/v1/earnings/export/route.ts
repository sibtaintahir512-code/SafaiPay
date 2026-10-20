import { NextRequest, NextResponse } from 'next/server';

const NON_BANKING_DISCLAIMER =
  'DISCLAIMER: SafaiPay is an informal circular-economy marketplace technology platform, NOT a bank, microfinance institution, lender, insurer, or payment system operator.';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'json';

  if (format === 'csv') {
    const csvData = [
      'SafaiPay Verified Digital Earnings Ledger',
      `Disclaimer,${NON_BANKING_DISCLAIMER}`,
      '',
      'Transaction ID,Pickup ID,Earned Date,Gross Amount PKR,Net Earnings PKR',
      'txn-001,sp-req-001,2026-10-18,2280.00,2280.00',
      'txn-002,sp-req-002,2026-10-17,1575.00,1575.00',
      'txn-003,sp-req-003,2026-10-15,2160.00,2160.00',
    ].join('\n');

    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=safaipay_ledger.csv',
      },
    });
  }

  return NextResponse.json({
    collector_id: 'col-current',
    collector_name: 'Rashid Khan',
    disclaimer: NON_BANKING_DISCLAIMER,
    exported_at: new Date().toISOString(),
    total_records: 3,
    records: [
      { id: 'txn-001', pickup_id: 'sp-req-001', earned_date: '2026-10-18', gross_amount_pkr: 2280.0, net_earnings_pkr: 2280.0 },
      { id: 'txn-002', pickup_id: 'sp-req-002', earned_date: '2026-10-17', gross_amount_pkr: 1575.0, net_earnings_pkr: 1575.0 },
      { id: 'txn-003', pickup_id: 'sp-req-003', earned_date: '2026-10-15', gross_amount_pkr: 2160.0, net_earnings_pkr: 2160.0 },
    ],
  });
}
