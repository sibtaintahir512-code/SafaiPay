import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_FILE_SIZE = 100; // 100 bytes

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const pickupId = formData.get('pickup_id') as string | null;

    if (!file) {
      return NextResponse.json({ detail: 'No image file provided.' }, { status: 400 });
    }

    if (file.size < MIN_FILE_SIZE) {
      return NextResponse.json({
        detail: `Invalid file: image file is empty or corrupted (minimum size ${MIN_FILE_SIZE} bytes).`
      }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        detail: `Invalid file: file size ${file.size} bytes exceeds maximum allowed limit of 10MB.`
      }, { status: 400 });
    }

    const cleanMime = (file.type || '').split(';')[0].trim().toLowerCase();
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (!ALLOWED_MIME_TYPES.has(cleanMime) && !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      return NextResponse.json({
        detail: `Unsupported file format '${file.type}'. Supported image types are JPEG, PNG, and WebP.`
      }, { status: 400 });
    }

    const fn = file.name.toLowerCase();
    let material = 'PET plastic';
    let confidence = 0.91;

    if (fn.includes('cardboard') || fn.includes('carton') || fn.includes('box')) {
      material = 'cardboard';
      confidence = 0.94;
    } else if (fn.includes('metal') || fn.includes('can') || fn.includes('glass') || fn.includes('debris') || fn.includes('unknown')) {
      material = 'other/unknown';
      confidence = 0.52;
    }

    const requiresVerification = confidence < 0.70 || material === 'other/unknown';
    const predId = 'pred-' + Math.random().toString(36).substring(2, 10);

    return NextResponse.json({
      id: predId,
      user_id: 'usr-customer-001',
      pickup_id: pickupId || null,
      image_url: `/uploads/${predId}_${file.name}`,
      material: material,
      confidence: confidence,
      requires_manual_verification: requiresVerification,
      status: 'PENDING',
      verified_material: null,
      is_corrected: false,
      model_version: 'demo-v1',
      created_at: new Date().toISOString(),
      disclaimer: 'DEMO CLASSIFIER (demo-v1): Preliminary estimate for workflow demonstration. Final material payout requires calibrated scale physical verification.'
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error processing image classification.' }, { status: 500 });
  }
}
