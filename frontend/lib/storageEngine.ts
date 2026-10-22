import fs from 'fs';
import path from 'path';
import { storeFileRecord, getFileRecord, StoredFile } from './db';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_FILE_SIZE = 50; // 50 bytes

export interface UploadResult {
  file_id: string;
  file_url: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
}

export async function processAndSaveUploadedFile(
  file: File | { name: string; type: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> },
  meta: { uploaded_by_user_id?: string; uploaded_by_role?: string; job_id?: string } = {}
): Promise<UploadResult> {
  if (!file) {
    throw new Error('No image file provided in upload request.');
  }

  if (file.size < MIN_FILE_SIZE) {
    throw new Error('Invalid file: Image file is empty or corrupted (minimum size 50 bytes).');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of 10 MB.`);
  }

  const rawMime = (file.type || '').split(';')[0].trim().toLowerCase();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';

  if (!ALLOWED_MIME_TYPES.has(rawMime) && !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
    throw new Error(`Unsupported image format '${file.type || ext}'. Only JPG, JPEG, PNG, and WebP are accepted.`);
  }

  const normalizedMime = rawMime && ALLOWED_MIME_TYPES.has(rawMime) ? rawMime : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const dataBase64 = buffer.toString('base64');

  const stored = storeFileRecord({
    filename: file.name || `photo.${ext}`,
    mime_type: normalizedMime,
    size_bytes: file.size,
    data_base64: dataBase64,
    uploaded_by_user_id: meta.uploaded_by_user_id,
    uploaded_by_role: meta.uploaded_by_role,
    job_id: meta.job_id,
  });

  // Also write to disk if possible for static serving / fast access
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'proofs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const diskPath = path.join(uploadDir, `${stored.id}.${ext}`);
    fs.writeFileSync(diskPath, buffer);
  } catch {
    // Read-only serverless environment fallback: already stored safely in memory/db
  }

  return {
    file_id: stored.id,
    file_url: `/api/v1/storage/files/${stored.id}`,
    filename: stored.filename,
    mime_type: stored.mime_type,
    size_bytes: stored.size_bytes,
  };
}

export function retrieveFile(id: string): { buffer: Buffer; mime_type: string; filename: string } | null {
  const record = getFileRecord(id);
  if (!record || !record.data_base64) {
    return null;
  }
  const buffer = Buffer.from(record.data_base64, 'base64');
  return {
    buffer,
    mime_type: record.mime_type || 'image/jpeg',
    filename: record.filename || 'image.jpg',
  };
}
