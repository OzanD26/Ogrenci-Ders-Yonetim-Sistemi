// frontend/src/lib/auth.ts
export type Role = "ADMIN" | "STUDENT";

export function saveAuth(token: string) {
  localStorage.setItem("token", token);
  const payload = parseJwt(token);
  const role: Role | undefined =
    (payload?.role as Role) ||
    (Array.isArray(payload?.roles) ? payload?.roles[0] : payload?.roles) ||
    (payload?.["https://example.com/role"] as Role);
  if (role) localStorage.setItem("role", role);
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
}

export function getRole(): Role | null {
  return (localStorage.getItem("role") as Role) ?? null;
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

/** Kullanıcı giriş yapmış mı? */
export function isAuthed(): boolean {
  return !!localStorage.getItem("token");
}

/** Çıkış yaptırır */
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
}

function parseJwt(token?: string): any | null {
  if (!token) return null;
  try {
    const base = token.split(".")[1];
    const json = atob(base.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}
