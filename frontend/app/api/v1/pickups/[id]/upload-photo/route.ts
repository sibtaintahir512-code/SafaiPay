import { NextRequest, NextResponse } from 'next/server';
import { updatePickup, findOrCreatePickup } from '@/lib/pickupStore';
import { WasteImage } from '@/lib/types';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_FILE_SIZE = 50; // 50 bytes

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pickupId = params.id;
    if (!pickupId) {
      return NextResponse.json({ detail: 'Pickup ID is required.' }, { status: 400 });
    }

    const contentType = req.headers.get('content-type') || '';
    let imageUrl = '';
    let imageType = 'scale_display';
    let caption = 'On-site scale photo evidence';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = (formData.get('file') || formData.get('photo') || formData.get('image')) as File | null;
      imageType = (formData.get('image_type') as string) || imageType;
      caption = (formData.get('caption') as string) || caption;

      if (!file) {
        return NextResponse.json({ detail: 'No image file provided in upload request.' }, { status: 400 });
      }

      if (file.size < MIN_FILE_SIZE) {
        return NextResponse.json(
          { detail: 'Invalid file: Image file is empty or corrupted (minimum size 50 bytes).' },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { detail: `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of 10 MB.` },
          { status: 400 }
        );
      }

      const mime = (file.type || '').split(';')[0].trim().toLowerCase();
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      if (!ALLOWED_MIME_TYPES.has(mime) && !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        return NextResponse.json(
          { detail: `Unsupported image format '${file.type || ext}'. Only JPG, JPEG, PNG, and WebP are accepted.` },
          { status: 400 }
        );
      }

      // Generate deterministic storage URL for the uploaded photo proof
      const fileId = `proof-${pickupId}-${Date.now()}`;
      imageUrl = `/uploads/proofs/${fileId}.${ext || 'jpg'}`;
    } else {
      // Support JSON payload containing pre-uploaded or converted image URL / data URL
      let jsonBody: any = {};
      try {
        jsonBody = await req.json();
      } catch {
        return NextResponse.json({ detail: 'Expected multipart/form-data or JSON with image_url.' }, { status: 400 });
      }
      imageUrl = jsonBody.image_url || jsonBody.photo_url || '';
      imageType = jsonBody.image_type || imageType;
      caption = jsonBody.caption || caption;

      if (!imageUrl) {
        return NextResponse.json({ detail: 'image_url is required.' }, { status: 400 });
      }
    }

    const pickup = findOrCreatePickup(pickupId);
    const newImage: WasteImage = {
      id: `img-${Date.now()}`,
      image_type: imageType,
      image_url: imageUrl,
      caption,
    };

    const existingImages = pickup.images || [];
    const updatedImages = [...existingImages.filter((img) => img.image_type !== imageType), newImage];

    const updated = updatePickup(pickupId, {
      images: updatedImages,
      // Record scale_photo_url so it is accessible directly
      scale_photo_url: imageUrl,
      // If pickup is currently in_progress, transition to photo_uploaded
      status: pickup.status === 'accepted' ? 'in_progress' : pickup.status,
    });

    return NextResponse.json(
      {
        ...updated,
        uploaded_image: newImage,
        message: 'Photo proof uploaded and verified successfully.',
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || 'Failed to process photo upload.' },
      { status: 500 }
    );
  }
}
