import { apiFetch } from "@/lib/api";
import type { ProfileUpdateInput } from "@/schemas/profile.schema";
import type { User } from "@/services/auth";

export const usersService = {
  updateProfile(input: ProfileUpdateInput): Promise<User> {
    return apiFetch("/users/me", { method: "PATCH", body: JSON.stringify(input) });
  },
  updatePassword(input: { currentPassword: string; newPassword: string }): Promise<void> {
    return apiFetch("/users/me/password", { method: "PATCH", body: JSON.stringify(input) });
  },
};
