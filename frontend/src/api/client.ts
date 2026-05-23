import { storage } from "@/src/utils/storage";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;
const TOKEN_KEY = "gg_token";

export type ApiError = { status: number; message: string };

async function tokenHeader(): Promise<Record<string, string>> {
  const t = await storage.secureGet(TOKEN_KEY, "");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function handle(res: Response) {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      detail = j.detail || JSON.stringify(j);
    } catch {
      try {
        detail = await res.text();
      } catch {
        /* ignore */
      }
    }
    const err: ApiError = { status: res.status, message: detail };
    throw err;
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

export const api = {
  base: BASE,
  setToken: (t: string) => storage.secureSet(TOKEN_KEY, t),
  clearToken: () => storage.secureRemove(TOKEN_KEY),
  getToken: () => storage.secureGet(TOKEN_KEY, ""),

  async get(path: string) {
    const headers = { ...(await tokenHeader()) };
    return handle(await fetch(`${BASE}/api${path}`, { headers }));
  },
  async post(path: string, body?: any) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(await tokenHeader()),
    };
    return handle(
      await fetch(`${BASE}/api${path}`, {
        method: "POST",
        headers,
        body: body ? JSON.stringify(body) : undefined,
      }),
    );
  },
  async delete(path: string) {
    const headers = { ...(await tokenHeader()) };
    return handle(await fetch(`${BASE}/api${path}`, { method: "DELETE", headers }));
  },
};
