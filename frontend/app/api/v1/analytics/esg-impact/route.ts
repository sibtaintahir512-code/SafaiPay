import { NextRequest, NextResponse } from 'next/server';

const ESG_DISCLAIMER =
  'Estimated Environmental Impact: CO2 equivalent reductions are computed based on EPA WARM circular diversion standards (1.35 kg CO2e abated per kg diverted recyclable). Values represent algorithmic estimates and are not certified carbon credits.';

export async function GET(req: NextRequest) {
  const effectiveKg = 18450.0;
  const co2Offset = Math.round(effectiveKg * 1.35 * 100) / 100;

  return NextResponse.json({
    total_diverted_kg: effectiveKg,
    diverted_tonnage: effectiveKg / 1000.0,
    total_co2_offset_kg: co2Offset,
    active_collectors_count: 24,
    partner_enterprises_count: 18,
    total_disbursed_pkr: 842000.0,
    material_breakdown: {
      PET_PLASTIC: Math.round(effectiveKg * 0.45 * 10) / 10,
      CARDBOARD_OCC: Math.round(effectiveKg * 0.35 * 10) / 10,
      MIXED_METAL: Math.round(effectiveKg * 0.12 * 10) / 10,
      HDPE_PLASTIC: Math.round(effectiveKg * 0.08 * 10) / 10,
    },
    disclaimer: ESG_DISCLAIMER,
  });
}
