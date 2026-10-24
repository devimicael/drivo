// Operações de autenticação — T034. Sem `fetch` direto fora de lib/api.ts.
import { apiFetch } from "@/lib/api";
import type { LoginFormValues, RegisterFormValues } from "@/schemas/auth.schema";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  data: User;
  session: { expiresAt: string };
}

export const authService = {
  register(input: RegisterFormValues): Promise<AuthResponse> {
    return apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        ...input,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
      }),
    });
  },

  login(input: LoginFormValues): Promise<AuthResponse> {
    return apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        ...input,
        email: input.email.trim().toLowerCase(),
      }),
    });
  },

  me(): Promise<User> {
    return apiFetch<User>("/auth/me");
  },

  logout(): Promise<void> {
    return apiFetch<void>("/auth/logout", { method: "POST" });
  },
};
