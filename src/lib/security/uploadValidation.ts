const MIME_ALIASES: Record<string, string> = {
  'image/jpg': 'image/jpeg',
};

const SAFE_UPLOAD_MIME_TYPES = new Set([
  'application/pdf',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function normalizeMimeType(value: string) {
  const normalized = value.trim().toLowerCase();
  return MIME_ALIASES[normalized] ?? normalized;
}

function startsWithBytes(buffer: Buffer, expected: number[]) {
  if (buffer.length < expected.length) return false;
  return expected.every((value, index) => buffer[index] === value);
}

function hasAscii(buffer: Buffer, offset: number, value: string) {
  if (buffer.length < offset + value.length) return false;
  return buffer.subarray(offset, offset + value.length).toString('ascii') === value;
}

function isHeifFamily(buffer: Buffer) {
  if (!hasAscii(buffer, 4, 'ftyp') || buffer.length < 12) return false;

  const majorBrand = buffer.subarray(8, 12).toString('ascii').toLowerCase();
  return new Set([
    'heic',
    'heix',
    'hevc',
    'hevx',
    'heim',
    'heis',
    'hevm',
    'hevs',
    'mif1',
    'msf1',
  ]).has(majorBrand);
}

export function isSafeUploadMimeType(mimeType: string) {
  return SAFE_UPLOAD_MIME_TYPES.has(normalizeMimeType(mimeType));
}

export function hasSafeUploadSignature(buffer: Buffer, mimeType: string) {
  const normalizedMimeType = normalizeMimeType(mimeType);

  if (!isSafeUploadMimeType(normalizedMimeType)) return false;

  switch (normalizedMimeType) {
    case 'application/pdf':
      return hasAscii(buffer, 0, '%PDF-');
    case 'image/png':
      return startsWithBytes(buffer, [
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
      ]);
    case 'image/jpeg':
      return startsWithBytes(buffer, [0xff, 0xd8, 0xff]);
    case 'image/gif':
      return hasAscii(buffer, 0, 'GIF87a') || hasAscii(buffer, 0, 'GIF89a');
    case 'image/webp':
      return hasAscii(buffer, 0, 'RIFF') && hasAscii(buffer, 8, 'WEBP');
    case 'image/heic':
    case 'image/heif':
      return isHeifFamily(buffer);
    default:
      return false;
  }
}
