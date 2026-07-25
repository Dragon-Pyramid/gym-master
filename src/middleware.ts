import { NextRequest, NextResponse } from 'next/server';

type RateLimitPolicy = {
  id: string;
  limit: number;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RuntimeRateLimitGlobal = typeof globalThis & {
  __gymMasterRuntimeRateLimitBuckets?: Map<string, RateLimitBucket>;
  __gymMasterRuntimeRateLimitLastSweep?: number;
};

const runtimeGlobal = globalThis as RuntimeRateLimitGlobal;
const buckets = runtimeGlobal.__gymMasterRuntimeRateLimitBuckets ?? new Map<string, RateLimitBucket>();
runtimeGlobal.__gymMasterRuntimeRateLimitBuckets = buckets;

const MINUTE = 60 * 1000;
const MAX_BUCKETS = 5000;

function getClientAddress(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const firstForwardedAddress = forwardedFor?.split(',')[0]?.trim();

  return (
    request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    firstForwardedAddress ||
    request.headers.get('cf-connecting-ip')?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'unknown-client'
  );
}

function getPolicy(request: NextRequest): RateLimitPolicy | null {
  const pathname = request.nextUrl.pathname;
  const method = request.method.toUpperCase();

  if (pathname === '/api/custom-login' && method === 'POST') {
    return { id: 'custom-login', limit: 20, windowMs: 10 * MINUTE };
  }

  if (pathname === '/api/auth/forgot-password' && method === 'POST') {
    return { id: 'forgot-password', limit: 6, windowMs: 15 * MINUTE };
  }

  if (pathname === '/api/auth/reset-password') {
    return method === 'POST'
      ? { id: 'reset-password-post', limit: 8, windowMs: 15 * MINUTE }
      : { id: 'reset-password-get', limit: 60, windowMs: 5 * MINUTE };
  }

  if (pathname === '/api/auth/terminal-session/refresh' && method === 'POST') {
    return { id: 'terminal-refresh', limit: 120, windowMs: 10 * MINUTE };
  }

  if (pathname.startsWith('/api/auth/') && method === 'POST') {
    return { id: 'next-auth', limit: 60, windowMs: 10 * MINUTE };
  }

  if (pathname.startsWith('/api/comercial/mobile-scanner/public/')) {
    return method === 'POST'
      ? { id: 'public-scanner-post', limit: 120, windowMs: MINUTE }
      : { id: 'public-scanner-get', limit: 180, windowMs: MINUTE };
  }

  if (/^\/api\/pagos\/[^/]+\/verificar$/.test(pathname) && method === 'GET') {
    return { id: 'payment-verification', limit: 120, windowMs: 5 * MINUTE };
  }

  if (pathname === '/api/image-proxy' && method === 'GET') {
    return { id: 'image-proxy', limit: 240, windowMs: MINUTE };
  }

  if (pathname === '/api/internal/dragon-pyramid/license-sync' && method === 'POST') {
    return { id: 'license-sync', limit: 120, windowMs: 5 * MINUTE };
  }

  return null;
}

function sweepExpiredBuckets(now: number) {
  const lastSweep = runtimeGlobal.__gymMasterRuntimeRateLimitLastSweep ?? 0;
  if (now - lastSweep < MINUTE && buckets.size < MAX_BUCKETS) return;

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }

  if (buckets.size > MAX_BUCKETS) {
    const oldestKeys = [...buckets.entries()]
      .sort((a, b) => a[1].resetAt - b[1].resetAt)
      .slice(0, buckets.size - MAX_BUCKETS)
      .map(([key]) => key);

    for (const key of oldestKeys) buckets.delete(key);
  }

  runtimeGlobal.__gymMasterRuntimeRateLimitLastSweep = now;
}

export function middleware(request: NextRequest) {
  const policy = getPolicy(request);
  if (!policy) return NextResponse.next();

  const now = Date.now();
  sweepExpiredBuckets(now);

  const key = `${policy.id}:${getClientAddress(request)}`;
  const current = buckets.get(key);
  const bucket = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + policy.windowMs }
    : current;

  if (bucket.count >= policy.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

    return NextResponse.json(
      {
        error: 'Demasiadas solicitudes. Intentá nuevamente más tarde.',
        error_code: 'RATE_LIMIT_EXCEEDED',
      },
      {
        status: 429,
        headers: {
          'Cache-Control': 'no-store',
          'Retry-After': String(retryAfterSeconds),
          'X-RateLimit-Limit': String(policy.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(bucket.resetAt / 1000)),
        },
      },
    );
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(policy.limit));
  response.headers.set('X-RateLimit-Remaining', String(Math.max(0, policy.limit - bucket.count)));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
  return response;
}

export const config = {
  matcher: [
    '/api/custom-login',
    '/api/auth/:path*',
    '/api/comercial/mobile-scanner/public/:path*',
    '/api/pagos/:id/verificar',
    '/api/image-proxy',
    '/api/internal/dragon-pyramid/license-sync',
  ],
};
