export const DEFAULT_PROFILE_IMAGE = '/gm_logo.svg';

const DEFAULT_PROFILE_IMAGE_ALIASES = new Set([
  '/gm_logo.svg',
  'gm_logo.svg',
  '/gm_logo.png',
  'gm_logo.png',
]);

function normalizePhotoValue(value?: string | null) {
  return String(value ?? '').trim();
}

export function isDefaultProfilePhoto(value?: string | null) {
  const photo = normalizePhotoValue(value);
  if (!photo) return true;

  const lower = photo.toLowerCase();
  if (DEFAULT_PROFILE_IMAGE_ALIASES.has(lower)) return true;

  return (
    lower.endsWith('/gm_logo.svg') ||
    lower.endsWith('/gm_logo.png') ||
    lower.includes('imagen-generica') ||
    lower.includes('gym_master/socio/profile/1754954108698')
  );
}

export function getProfilePhotoOrDefault(value?: string | null) {
  return isDefaultProfilePhoto(value) ? DEFAULT_PROFILE_IMAGE : normalizePhotoValue(value);
}
