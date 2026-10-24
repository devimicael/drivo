// Cliente HTTP centralizado — T022. Cookies sempre incluídos e CSRF ecoado.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const CSRF_COOKIE_NAMES = ["drivo_csrf", "__Host-drivo_csrf"];
const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

export interface FieldIssue {
  path: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: FieldIssue[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function readCsrfToken(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  for (const name of CSRF_COOKIE_NAMES) {
    const entry = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(`${name}=`));

    if (entry) {
      return decodeURIComponent(entry.slice(name.length + 1));
    }
  }

  return null;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (MUTATING_METHODS.has(method)) {
    const csrfToken = readCsrfToken();
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    method,
    headers,
    credentials: "include",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => null)) as
    | { error?: { code?: string; message?: string; details?: FieldIssue[] } }
    | T
    | null;

  if (!response.ok) {
    const body = payload as { error?: { code?: string; message?: string; details?: FieldIssue[] } } | null;
    const error = new ApiError(
      response.status,
      body?.error?.code ?? "REQUEST_FAILED",
      body?.error?.message ?? "Não foi possível concluir a operação.",
      body?.error?.details,
    );

    // 401 global: limpa o estado e leva à entrada com aviso (AC-03.2 / T071).
    if (response.status === 401 && shouldRedirectOnUnauthorized(path)) {
      redirectToLogin();
    }

    throw error;
  }

  return payload as T;
}

function shouldRedirectOnUnauthorized(path: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  if (path.startsWith("/auth/")) {
    return false;
  }
  return window.location.pathname !== "/login" && window.location.pathname !== "/cadastro";
}

function redirectToLogin(): void {
  // Fora de um handler React não há `useRouter()`; a navegação dura troca a árvore.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign("/login?expirada=1");
}
