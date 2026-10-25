"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth";
import type { LoginFormValues, RegisterFormValues } from "@/schemas/auth.schema";
import { usersService } from "@/services/users";
import type { ProfileUpdateInput } from "@/schemas/profile.schema";

const SESSION_QUERY_KEY = ["auth", "me"] as const;

export function useSession() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: authService.me,
    staleTime: 5 * 60_000,
    // 401 em /auth/me é "não autenticado", não uma falha passageira.
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginFormValues) => authService.login(input),
    onSuccess: ({ data }) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, data);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterFormValues) => authService.register(input),
    onSuccess: ({ data }) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, data);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileUpdateInput) => usersService.updateProfile(input),
    onSuccess: async (user) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, user);
      await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    },
  });
}
