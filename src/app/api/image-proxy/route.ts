import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// AUTH POLICY: PUBLIC_CONTROLLED
// The proxy is intentionally public because browser-generated PDFs load images
// through <img>. Every destination and redirect is validated to prevent access
// to loopback, private, link-local and reserved network ranges.
const MAX_REDIRECTS = 3;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function isBlockedIpv4(address: string) {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return true;
  }

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && parts[2] === 2) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && parts[2] === 100) ||
    (a === 203 && b === 0 && parts[2] === 113) ||
    a >= 224
  );
}

function isBlockedIp(address: string) {
  const normalized = address.toLowerCase().split('%')[0];
  const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];

  if (mappedIpv4) return isBlockedIpv4(mappedIpv4);
  if (isIP(normalized) === 4) return isBlockedIpv4(normalized);
  if (isIP(normalized) !== 6) return true;

  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith('ff') ||
    normalized.startsWith('2001:db8')
  );
}

async function assertSafeImageUrl(value: string) {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error('URL de imagen inválida');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Protocolo de imagen no permitido');
  }

  if (parsed.username || parsed.password) {
    throw new Error('La URL de imagen no puede contener credenciales');
  }

  if (parsed.port && !['80', '443'].includes(parsed.port)) {
    throw new Error('Puerto de imagen no permitido');
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (
    !hostname ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new Error('Host de imagen no permitido');
  }

  if (isIP(hostname)) {
    if (isBlockedIp(hostname)) {
      throw new Error('Red de imagen no permitida');
    }
    return parsed;
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }: { address: string }) => isBlockedIp(address))) {
    throw new Error('El host de imagen resuelve a una red no permitida');
  }

  return parsed;
}

async function fetchSafeImage(initialUrl: string) {
  let currentUrl = await assertSafeImageUrl(initialUrl);

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const response = await fetch(currentUrl, {
      cache: 'force-cache',
      redirect: 'manual',
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'User-Agent': 'GymMaster-PDF-Image-Proxy/1.0',
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location || redirect === MAX_REDIRECTS) {
        throw new Error('Redirección de imagen inválida');
      }

      currentUrl = await assertSafeImageUrl(
        new URL(location, currentUrl).toString(),
      );
      continue;
    }

    return response;
  }

  throw new Error('Demasiadas redirecciones de imagen');
}

export async function GET(request: Request) {
  const imageUrl = new URL(request.url).searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json(
      { message: 'URL de imagen inválida' },
      { status: 400 },
    );
  }

  try {
    const response = await fetchSafeImage(imageUrl);

    if (!response.ok) {
      return NextResponse.json(
        { message: 'No se pudo obtener la imagen' },
        { status: response.status },
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('image/')) {
      return NextResponse.json(
        { message: 'El recurso no es una imagen' },
        { status: 415 },
      );
    }

    const declaredLength = Number(response.headers.get('content-length') || 0);
    if (declaredLength > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { message: 'La imagen supera el tamaño permitido' },
        { status: 413 },
      );
    }

    const imageBuffer = await response.arrayBuffer();
    if (imageBuffer.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { message: 'La imagen supera el tamaño permitido' },
        { status: 413 },
      );
    }

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error al obtener la imagen';
    const isPolicyError = /no permitid|inválid|credenciales|redirecci/i.test(
      message,
    );

    console.error('Error en image-proxy:', message);
    return NextResponse.json(
      { message: isPolicyError ? message : 'Error al obtener la imagen' },
      { status: isPolicyError ? 400 : 502 },
    );
  }
}
