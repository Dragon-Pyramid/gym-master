import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { NextResponse } from 'next/server';

import { noStoreJson } from '@/lib/security/httpRuntimeSecurity';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// AUTH POLICY: PUBLIC_CONTROLLED
// The proxy is intentionally public because browser-generated PDFs load images
// through <img>. Every destination and redirect is validated to prevent access
// to loopback, private, link-local and reserved network ranges.
const MAX_REDIRECTS = 3;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_URL_LENGTH = 4096;
const IMAGE_FETCH_TIMEOUT_MS = 8000;

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
  if (!value || value.length > MAX_IMAGE_URL_LENGTH) {
    throw new Error('URL de imagen inválida');
  }

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
  if (
    addresses.length === 0 ||
    addresses.some(({ address }: { address: string }) => isBlockedIp(address))
  ) {
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
      signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS),
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/png,image/jpeg,image/gif,image/*;q=0.8',
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

async function readImageBodyWithinLimit(response: Response) {
  if (!response.body) {
    const body = new Uint8Array(await response.arrayBuffer());
    if (body.byteLength > MAX_IMAGE_BYTES) {
      throw new Error('La imagen supera el tamaño permitido');
    }
    return body;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;
    if (totalBytes > MAX_IMAGE_BYTES) {
      try {
        await reader.cancel('Image body exceeds configured limit');
      } catch {
        // La respuesta ya excedió el límite; ignorar errores del cierre del stream.
      }
      throw new Error('La imagen supera el tamaño permitido');
    }

    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return body;
}

export async function GET(request: Request) {
  const imageUrl = new URL(request.url).searchParams.get('url')?.trim() ?? '';

  if (!imageUrl || imageUrl.length > MAX_IMAGE_URL_LENGTH) {
    return noStoreJson(
      { message: 'URL de imagen inválida' },
      400,
    );
  }

  try {
    const response = await fetchSafeImage(imageUrl);

    if (!response.ok) {
      return noStoreJson(
        { message: 'No se pudo obtener la imagen' },
        502,
      );
    }

    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? '';
    if (!contentType.startsWith('image/') || contentType === 'image/svg+xml') {
      return noStoreJson(
        { message: 'El recurso no es una imagen permitida' },
        415,
      );
    }

    const declaredLength = Number(response.headers.get('content-length') || 0);
    if (declaredLength > MAX_IMAGE_BYTES) {
      return noStoreJson(
        { message: 'La imagen supera el tamaño permitido' },
        413,
      );
    }

    const imageBuffer = await readImageBodyWithinLimit(response);

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const isPolicyError = /no permitid|inválid|credenciales|redirecci|red de imagen/i.test(message);
    const isTooLarge = /tamaño permitido/i.test(message);
    const isTimeout = error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name);

    if (!isPolicyError && !isTooLarge && !isTimeout) {
      console.error('Error en image-proxy:', {
        name: error instanceof Error ? error.name : 'UnknownError',
      });
    }

    return noStoreJson(
      {
        message: isPolicyError
          ? message
          : isTooLarge
            ? 'La imagen supera el tamaño permitido'
            : isTimeout
              ? 'La descarga de la imagen excedió el tiempo permitido'
              : 'Error al obtener la imagen',
      },
      isPolicyError ? 400 : isTooLarge ? 413 : isTimeout ? 504 : 502,
    );
  }
}
