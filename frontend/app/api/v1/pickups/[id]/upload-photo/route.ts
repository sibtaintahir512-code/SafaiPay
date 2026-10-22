import { NextRequest, NextResponse } from 'next/server';
import { getJobById, attachJobImage, updateJobStatus } from '@/lib/db';
import { findOrCreatePickup } from '@/lib/pickupStore';
import { processAndSaveUploadedFile } from '@/lib/storageEngine';
import { WasteImage } from '@/lib/types';
import { verifyJwt } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

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

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const decoded = token ? verifyJwt(token) : null;
    const actorRole = decoded?.role || 'collector';
    const actorUserId = decoded?.sub || decoded?.id || 'usr_guest_coll';

    // Ensure pickup exists
    findOrCreatePickup(pickupId, actorUserId);

    const contentType = req.headers.get('content-type') || '';
    let imageUrl = '';
    let imageType = actorRole === 'customer' ? 'customer_upload' : actorRole === 'recycler' ? 'recycler_proof' : 'scale_display';
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

      // Process and store in backend storage
      const uploadResult = await processAndSaveUploadedFile(file, {
        uploaded_by_user_id: actorUserId,
        uploaded_by_role: actorRole,
        job_id: pickupId,
      });

      imageUrl = uploadResult.file_url;
    } else {
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

    const newImage: WasteImage = {
      id: `img-${Date.now()}`,
      image_type: imageType,
      image_url: imageUrl,
      caption,
    };

    const updated = attachJobImage(pickupId, newImage, { user_id: actorUserId, user_role: actorRole });

    return NextResponse.json(
      {
        ...updated,
        uploaded_image: newImage,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || 'Failed to upload photo proof.' },
      { status: 500 }
    );
  }
}
