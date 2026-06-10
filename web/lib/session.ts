"use client";

const SESSION_KEY = "vendor_session";

export type VendorSession = {
  user_id?: string | null;
  vendor_id?: string | null;
  role: "vendor" | "buyer";
  full_name: string;
  email: string;
  business_name?: string;
  expires_at: number;
};

function serializeCookie(value: string, expiresAt: number): string {
  const encoded = encodeURIComponent(value);
  const expires = new Date(expiresAt).toUTCString();
  return `${SESSION_KEY}=${encoded}; path=/; expires=${expires}; SameSite=Lax`;
}

function parseCookies(): Record<string, string> {
  const result: Record<string, string> = {};
  if (typeof document === "undefined") return result;
  for (const cookie of document.cookie.split("; ")) {
    const idx = cookie.indexOf("=");
    if (idx === -1) continue;
    const key = cookie.slice(0, idx).trim();
    const value = cookie.slice(idx + 1).trim();
    result[key] = value;
  }
  return result;
}

export function setSession(data: {
  user_id?: string | null;
  vendor_id?: string | null;
  role?: "vendor" | "buyer";
  full_name: string;
  email: string;
  business_name?: string;
}): void {
  const session: VendorSession = {
    user_id: data.user_id,
    vendor_id: data.vendor_id,
    role: data.role || "vendor",
    full_name: data.full_name,
    email: data.email,
    business_name: data.business_name || "",
    expires_at: Date.now() + 24 * 60 * 60 * 1000,
  };
  document.cookie = serializeCookie(JSON.stringify(session), session.expires_at);
}

export function getSession(): VendorSession | null {
  const cookies = parseCookies();
  const raw = cookies[SESSION_KEY];
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as VendorSession;
  } catch {
    return null;
  }
}

export function getVendorId(): string | null {
  return getSession()?.vendor_id ?? null;
}

export function clearSession(): void {
  document.cookie = `${SESSION_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export function isSessionExpired(): boolean {
  const session = getSession();
  if (!session) return true;
  return Date.now() >= session.expires_at;
}

export function isAuthenticated(): boolean {
  return !isSessionExpired();
}

let _sessionCache: VendorSession | null = null;
let _vendorIdCache: string | null = null;

export function getCachedSession(): VendorSession | null {
  const next = getSession();
  if (JSON.stringify(next) !== JSON.stringify(_sessionCache)) {
    _sessionCache = next;
  }
  return _sessionCache;
}

export function getCachedVendorId(): string | null {
  const next = getVendorId();
  if (next !== _vendorIdCache) {
    _vendorIdCache = next;
  }
  return _vendorIdCache;
}
