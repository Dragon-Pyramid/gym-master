import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

interface JwtPayload {
  sub: string;
  id: string;
  email: string;
  rol: string;
  nombre?: string;
  permisos_menu?: string[] | null;
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

export function loginSession(token: string) {
  Cookies.set(TOKEN_KEY, token, { sameSite: "strict", secure: true });
}

export function logoutSession() {
  Cookies.remove(TOKEN_KEY);
}

export function getToken() {
  return Cookies.get(TOKEN_KEY) || null;
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
