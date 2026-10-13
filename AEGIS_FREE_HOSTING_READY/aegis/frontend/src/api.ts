export type Persona =
  "admin" | "manager" | "auditor" | "user" | "recipient" | "org2admin";
export type Body = {
  status: string;
  roles?: string[];
  owner?: string;
  issuer?: string;
  metadata_hash?: string;
  history?: { action: string; actor: string; owner: string; time: string }[];
};
export type RecordItem = {
  id: string;
  org: string;
  body: Body;
  version: number;
};
export type AuditEvent = {
  sequence: number;
  action: string;
  actor: string;
  subject: string;
  outcome: string;
  time: string;
  source: string;
};
export type Me = { id: string; org: string; roles: string[]; mode: string };
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
// Local development uses Vite's proxy. Hosted deployments set VITE_API_BASE_URL.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\\/$/, "");
let accessToken = "";
export async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      detail =
        typeof data.detail === "string"
          ? data.detail
          : JSON.stringify(data.detail);
    } catch {
      /* Non-JSON errors retain HTTP status. */
    }
    throw new ApiError(detail, response.status);
  }
  return response.json() as Promise<T>;
}
export async function login(persona: Persona) {
  const data = await request<{ access_token: string }>("/api/demo/session", {
    method: "POST",
    body: JSON.stringify({ persona }),
  });
  accessToken = data.access_token;
  return request<Me>("/api/me");
}
export const command = (action: string, subject: string, extra: object = {}) =>
  request<RecordItem>("/api/commands", {
    method: "POST",
    headers: {
      "Idempotency-Key":
        globalThis.crypto.randomUUID?.() ??
        Array.from(
          globalThis.crypto.getRandomValues(new Uint8Array(16)),
          (byte) => byte.toString(16).padStart(2, "0"),
        ).join(""),
    },
    body: JSON.stringify({ action, subject, ...extra }),
  });
export function logout() {
  accessToken = "";
}
