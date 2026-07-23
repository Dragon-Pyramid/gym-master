const LEGACY_SENSITIVE_CACHE_NAMES = new Set([
  'start-url',
  'apis',
  'others',
  'cross-origin',
  'next-data',
  'next-image',
  'static-data-assets',
  'static-image-assets',
  'static-audio-assets',
  'static-video-assets',
]);

const SENSITIVE_CACHE_PREFIXES = [
  'gym-master-private-',
  'gm-private-',
];

function isSensitiveCacheName(cacheName: string) {
  return (
    LEGACY_SENSITIVE_CACHE_NAMES.has(cacheName) ||
    SENSITIVE_CACHE_PREFIXES.some((prefix) => cacheName.startsWith(prefix))
  );
}

export async function clearSensitivePwaCaches(): Promise<string[]> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return [];
  }

  try {
    const cacheNames = await window.caches.keys();
    const sensitiveCacheNames = cacheNames.filter(isSensitiveCacheName);

    const deletionResults = await Promise.all(
      sensitiveCacheNames.map(async (cacheName) => ({
        cacheName,
        deleted: await window.caches.delete(cacheName),
      })),
    );

    return deletionResults
      .filter(({ deleted }) => deleted)
      .map(({ cacheName }) => cacheName);
  } catch {
    // Cache Storage is an optimization boundary. Failure to clean it must not
    // block authentication, logout or the rest of the application.
    return [];
  }
}
