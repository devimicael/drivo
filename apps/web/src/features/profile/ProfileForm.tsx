"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useUpdateProfile } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import {
  profileDetailsSchema,
  type ProfileUpdateInput,
} from "@/schemas/profile.schema";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const update = useUpdateProfile();
  const [saved, setSaved] = useState(false);
  const [firstName = "", ...lastName] = name.trim().split(/\s+/);
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<
    z.input<typeof profileDetailsSchema>,
    unknown,
    ProfileUpdateInput
  >({
    resolver: zodResolver(profileDetailsSchema),
    defaultValues: { firstName, lastName: lastName.join(" ") },
  });
  const serverError =
    update.error instanceof ApiError
      ? update.error.message
      : update.error
        ? "Não foi possível atualizar seu perfil."
        : null;

  async function submit(values: ProfileUpdateInput) {
    setSaved(false);
    try {
      await update.mutateAsync(values);
      reset(getValues());
      setSaved(true);
    } catch {
      /* Erro da API é apresentado junto ao campo. */
    }
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="overflow-hidden rounded-2xl bg-raised"
    >
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <Input
          label="Nome"
          autoComplete="given-name"
          maxLength={120}
          error={errors.firstName?.message}
          {...register("firstName")}
        />
        <Input
          label="Sobrenome"
          autoComplete="family-name"
          maxLength={120}
          error={errors.lastName?.message}
          {...register("lastName")}
        />
        <div className="sm:col-span-2">
          <Input
            label="E-mail"
            type="email"
            value={email}
            readOnly
            aria-describedby="profile-email-note"
          />
          <p id="profile-email-note" className="sr-only">
            O e-mail não pode ser alterado nesta versão.
          </p>
        </div>
        {serverError ? (
          <p role="alert" className="text-sm text-danger sm:col-span-2">
            {serverError}
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-separator px-6 py-4">
        <p
          role="status"
          className={`text-xs ${saved ? "text-success" : "text-tertiary"}`}
        >
          {saved
            ? "Perfil atualizado com sucesso."
            : "Alterações salvas ficam visíveis na hora."}
        </p>
        <Button
          size="compact"
          type="submit"
          loading={update.isPending || isSubmitting}
          disabled={!isDirty}
        >
          Salvar
        </Button>
      </div>
    </form>
  );
}
