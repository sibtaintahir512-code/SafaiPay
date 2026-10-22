import { NextRequest, NextResponse } from 'next/server';
import { processAndSaveUploadedFile } from '@/lib/storageEngine';
import { verifyJwt } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const user = token ? verifyJwt(token) : null;

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { detail: 'Invalid content type. Expected multipart/form-data.' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = (formData.get('file') || formData.get('photo') || formData.get('image')) as File | null;
    const jobId = (formData.get('job_id') as string) || undefined;

    if (!file) {
      return NextResponse.json(
        { detail: 'No image file provided in upload request.' },
        { status: 400 }
      );
    }

    const result = await processAndSaveUploadedFile(file, {
      uploaded_by_user_id: user?.sub || user?.id,
      uploaded_by_role: user?.role,
      job_id: jobId,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'File upload failed' }, { status: 400 });
  }
}
