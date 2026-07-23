import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { clearSensitivePwaCaches } from "@/utils/pwaCacheSecurity";

interface JwtPayload {
  sub: string;
  id: string;
  email: string;
  rol: string;
  nombre?: string;
  permisos_menu?: string[] | null;
  must_change_password?: boolean;
  exp?: number;
}

const TOKEN_KEY = "token";
const TERMINAL_TOKEN_KEY = "terminal_token";
const TERMINAL_STORAGE_KEY = "terminal-session-token";
const AUTH_STORAGE_KEY = "auth-storage";

function getPersistedAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawAuthStorage = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawAuthStorage) {
      return null;
    }

    const parsedAuthStorage = JSON.parse(rawAuthStorage);
    const token = parsedAuthStorage?.state?.token;

    return typeof token === "string" && token.trim().length > 0
      ? token
      : null;
  } catch {
    return null;
  }
}

function getPersistedTerminalToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const token = window.localStorage.getItem(TERMINAL_STORAGE_KEY);

    return typeof token === "string" && token.trim().length > 0
      ? token
      : null;
  } catch {
    return null;
  }
}

function decodeJwtPayload(token?: string | null): JwtPayload | null {
  if (!token) return null;

  try {
    return jwtDecode<JwtPayload>(token);
  } catch {
    return null;
  }
}

function getTokenExpiration(token?: string | null): number | null {
  const decoded = decodeJwtPayload(token);
  return decoded?.exp ? decoded.exp * 1000 : null;
}

function isTokenExpired(token?: string | null): boolean {
  const expiration = getTokenExpiration(token);
  return Boolean(expiration && expiration <= Date.now());
}

function getTokenSortValue(token: string): number {
  return getTokenExpiration(token) ?? Number.MAX_SAFE_INTEGER;
}

function shouldUseSecureCookie(): boolean {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV === "production";
  }

  return window.location.protocol === "https:";
}

export function getSessionFromCookie() {
  const token = getToken();

  if (!token) {
    return null;
  }

  const decoded = decodeJwtPayload(token);

  if (!decoded) {
    logoutSession();
    return null;
  }

  if (decoded.exp && decoded.exp * 1000 < Date.now()) {
    logoutSession();
    return null;
  }

  return decoded;
}

export function loginSession(token: string) {
  const expiresAt = getTokenExpiration(token);

  Cookies.set(TOKEN_KEY, token, {
    sameSite: "strict",
    secure: shouldUseSecureCookie(),
    ...(expiresAt ? { expires: new Date(expiresAt) } : {}),
  });
}

export function logoutSession() {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(TERMINAL_TOKEN_KEY);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      window.localStorage.removeItem(TERMINAL_STORAGE_KEY);
    } catch {
      // No bloquear logout si localStorage no está disponible.
    }

    void clearSensitivePwaCaches();
  }
}

export function loginTerminalSession(token: string) {
  const expiresAt = getTokenExpiration(token);

  Cookies.set(TERMINAL_TOKEN_KEY, token, {
    sameSite: "strict",
    secure: shouldUseSecureCookie(),
    ...(expiresAt ? { expires: new Date(expiresAt) } : {}),
  });

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(TERMINAL_STORAGE_KEY, token);
    } catch {
      // La cookie terminal alcanza si localStorage no está disponible.
    }
  }
}

export function logoutTerminalSession() {
  Cookies.remove(TERMINAL_TOKEN_KEY);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(TERMINAL_STORAGE_KEY);
    } catch {
      // No bloquear limpieza si localStorage no está disponible.
    }

    void clearSensitivePwaCaches();
  }
}

export function getToken() {
  const cookieToken = Cookies.get(TOKEN_KEY) || null;
  const persistedToken = getPersistedAuthToken();
  const candidates = [cookieToken, persistedToken]
    .filter((token): token is string => Boolean(token && token.trim()))
    .filter((token, index, array) => array.indexOf(token) === index);

  const validCandidates = candidates.filter((token) => !isTokenExpired(token));

  if (validCandidates.length === 0) {
    if (cookieToken && isTokenExpired(cookieToken)) {
      Cookies.remove(TOKEN_KEY);
    }

    return null;
  }

  return validCandidates.sort(
    (a, b) => getTokenSortValue(b) - getTokenSortValue(a),
  )[0];
}

export function getTerminalToken() {
  const cookieToken = Cookies.get(TERMINAL_TOKEN_KEY) || null;
  const persistedToken = getPersistedTerminalToken();
  const candidates = [cookieToken, persistedToken]
    .filter((token): token is string => Boolean(token && token.trim()))
    .filter((token, index, array) => array.indexOf(token) === index);

  const validCandidates = candidates.filter((token) => !isTokenExpired(token));

  if (validCandidates.length === 0) {
    if (cookieToken && isTokenExpired(cookieToken)) {
      Cookies.remove(TERMINAL_TOKEN_KEY);
    }

    return null;
  }

  return validCandidates.sort(
    (a, b) => getTokenSortValue(b) - getTokenSortValue(a),
  )[0];
}

export function terminalAuthHeader(): Record<string, string> {
  const token = getTerminalToken() || getToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export function authHeader(): Record<string, string> {
  const token = getToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}
