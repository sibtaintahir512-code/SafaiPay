import { NextRequest, NextResponse } from 'next/server';
import { retrieveFile } from '@/lib/storageEngine';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const fileId = params.id;
  if (!fileId) {
    return new NextResponse('File ID required', { status: 400 });
  }

  const file = retrieveFile(fileId);
  if (!file) {
    return new NextResponse('File not found', { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.buffer), {
    status: 200,
    headers: {
      'Content-Type': file.mime_type,
      'Content-Length': file.buffer.length.toString(),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': `inline; filename="${file.filename}"`,
    },
  });
}
