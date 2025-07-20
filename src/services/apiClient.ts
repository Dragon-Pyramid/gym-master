import { getToken, loginSession, logoutSession } from "./storageService";

export async function login({
  email,
  password,
  rol,
  dbName,
}: {
  email: string;
  password: string;
  rol: string;
  dbName: string;
}) {
  const res = await fetch("/api/custom-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, rol, dbName }),
  });
  const data = await res.json();
  if (res.ok && data.token) {
    loginSession(data.token);
  }
  return { ok: res.ok, ...data };
}

export async function pagarCuotaConStripe() {
  const token = getToken();
  const res = await fetch("/api/pagar-cuota", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export function logout() {
  logoutSession();
}
