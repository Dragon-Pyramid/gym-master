export function sanitizeDownloadFileName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function getDownloadTimestamp(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}${month}${day}-${hours}${minutes}`;
}

export function buildTimestampedDownloadFileName(
  baseName: string,
  extension?: string,
  date = new Date()
): string {
  const safeBaseName = sanitizeDownloadFileName(baseName || 'archivo');
  const safeExtension = extension?.replace(/^\./, '').trim();
  const name = `${getDownloadTimestamp(date)}-${safeBaseName}`;

  return safeExtension ? `${name}.${safeExtension}` : name;
}
