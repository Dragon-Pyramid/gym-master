import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

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

export function getSessionFromCookie() {
  const token = getToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      logoutSession();
      return null;
    }
    return decoded;
  } catch {
    logoutSession();
    return null;
  }
}

const TOKEN_KEY = "token";
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

export function loginSession(token: string) {
  Cookies.set(TOKEN_KEY, token, { sameSite: "strict", secure: true });
}

export function logoutSession() {
  Cookies.remove(TOKEN_KEY);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // No bloquear logout si localStorage no está disponible.
    }
  }
}

export function getToken() {
  return Cookies.get(TOKEN_KEY) || getPersistedAuthToken();
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
