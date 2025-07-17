
export async function login({ email, password, rol, dbName }: { email: string; password: string; rol: string; dbName: string }) {
  const res = await fetch("/api/custom-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, rol, dbName }),
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}
