import fs from 'fs';
import path from 'path';
import { storeFileRecord, getFileRecord, StoredFile } from './db';

const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
const ALLOWED_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp'];

const ALLOWED_CHAT_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'image/gif',
  'audio/webm',
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/m4a',
  'audio/aac',
  'audio/mp4',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]);

const ALLOWED_CHAT_EXTS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'webm',
  'mp3',
  'wav',
  'ogg',
  'm4a',
  'aac',
  'mp4',
  'pdf',
  'txt',
  'csv',
  'docx',
  'doc',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_FILE_SIZE = 10; // 10 bytes for audio chunks or files

export interface UploadResult {
  file_id: string;
  file_url: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
}

export async function processAndSaveUploadedFile(
  file: File | { name: string; type: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> },
  meta: { uploaded_by_user_id?: string; uploaded_by_role?: string; job_id?: string; conversation_id?: string } = {},
  options: { allowChatMedia?: boolean } = {}
): Promise<UploadResult> {
  if (!file) {
    throw new Error('No file provided in upload request.');
  }

  if (file.size < (options.allowChatMedia ? 10 : 50)) {
    throw new Error('Invalid file: File is empty or corrupted (minimum size 50 bytes).');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of 10 MB.`);
  }

  const rawMime = (file.type || '').split(';')[0].trim().toLowerCase();
  const ext = file.name?.split('.').pop()?.toLowerCase() || (options.allowChatMedia ? 'bin' : 'jpg');

  if (options.allowChatMedia) {
    const isMimeAllowed = ALLOWED_CHAT_MIMES.has(rawMime);
    const isExtAllowed = ALLOWED_CHAT_EXTS.includes(ext);
    if (!isMimeAllowed && !isExtAllowed) {
      throw new Error(`Unsupported file type '${file.type || ext}'. Allowed types are images, audio voice notes, PDFs and documents up to 10MB.`);
    }
  } else {
    if (!ALLOWED_IMAGE_MIMES.has(rawMime) && !ALLOWED_IMAGE_EXTS.includes(ext)) {
      throw new Error(`Unsupported image format '${file.type || ext}'. Only JPG, JPEG, PNG, and WebP are accepted.`);
    }
  }

  let normalizedMime = rawMime;
  if (!normalizedMime || normalizedMime === 'application/octet-stream') {
    if (['jpg', 'jpeg'].includes(ext)) normalizedMime = 'image/jpeg';
    else if (ext === 'png') normalizedMime = 'image/png';
    else if (ext === 'webp') normalizedMime = 'image/webp';
    else if (ext === 'gif') normalizedMime = 'image/gif';
    else if (ext === 'webm') normalizedMime = 'audio/webm';
    else if (ext === 'mp3') normalizedMime = 'audio/mpeg';
    else if (ext === 'wav') normalizedMime = 'audio/wav';
    else if (ext === 'ogg') normalizedMime = 'audio/ogg';
    else if (ext === 'pdf') normalizedMime = 'application/pdf';
    else if (ext === 'txt') normalizedMime = 'text/plain';
    else normalizedMime = 'application/octet-stream';
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const dataBase64 = buffer.toString('base64');

  const safeName = path.basename(file.name || 'attachment').replace(/[^a-zA-Z0-9_.-]/g, '_');
  const safeFilename = safeName.endsWith(`.${ext}`) ? safeName : `${safeName}.${ext}`;

  const stored = storeFileRecord({
    filename: safeFilename,
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
