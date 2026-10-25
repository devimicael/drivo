"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api";
import { passwordSchema } from "@/schemas/profile.schema";
import { usersService } from "@/services/users";

type Values = z.infer<typeof passwordSchema>;
export function PasswordForm() {
  const [saved, setSaved] = useState(false);
  const mutation = useMutation({
    mutationFn: usersService.updatePassword,
    retry: false,
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  async function submit({ currentPassword, newPassword }: Values) {
    setSaved(false);
    try {
      await mutation.mutateAsync({ currentPassword, newPassword });
      reset();
      setSaved(true);
    } catch {
      /* Erro visível abaixo dos campos. */
    }
  }
  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="overflow-hidden rounded-2xl bg-raised"
    >
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            label="Senha atual"
            type="password"
            autoComplete="current-password"
            maxLength={128}
            error={errors.currentPassword?.message}
            {...register("currentPassword")}
          />
        </div>
        <Input
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          maxLength={128}
          placeholder="Mínimo de 8 caracteres"
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        <Input
          label="Confirmar nova senha"
          type="password"
          autoComplete="new-password"
          maxLength={128}
          placeholder="Repita a nova senha"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        {mutation.error ? (
          <p role="alert" className="text-sm text-danger sm:col-span-2">
            {mutation.error instanceof ApiError
              ? mutation.error.message
              : "Não foi possível alterar a senha. Tente novamente."}
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-separator px-6 py-4">
        <p
          role="status"
          className={`text-xs ${saved ? "text-success" : "text-tertiary"}`}
        >
          {saved
            ? "Senha alterada com sucesso."
            : "Altere sua senha com segurança."}
        </p>
        <Button
          size="compact"
          variant="secondary"
          type="submit"
          loading={mutation.isPending}
          disabled={!isDirty}
        >
          Alterar senha
        </Button>
      </div>
    </form>
  );
}
