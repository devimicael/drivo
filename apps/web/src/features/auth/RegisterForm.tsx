"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useRegister } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import { registerSchema, type RegisterFormValues } from "@/schemas/auth.schema";

export function RegisterForm() {
  const router = useRouter();
  const registration = useRegister();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const serverError =
    registration.error instanceof ApiError && registration.error.code === "EMAIL_ALREADY_IN_USE"
      ? registration.error.message
      : registration.error
        ? "Não foi possível criar a conta. Tente novamente."
        : null;

  const isBusy = isSubmitting || registration.isPending;

  async function onSubmit(values: RegisterFormValues): Promise<void> {
    try {
      await registration.mutateAsync(values);
      router.replace("/garagem");
    } catch (error) {
      // Erro de e-mail duplicado também fica marcado no campo (AC-01.2).
      if (error instanceof ApiError && error.code === "EMAIL_ALREADY_IN_USE") {
        setError("email", { message: error.message });
      }
    }
  }

  return (
    <section className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <h1 className="text-2xl font-semibold tracking-tight">Criar conta</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Cadastre-se para começar a organizar sua garagem.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Nome
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className="h-11 rounded-lg border border-black/15 bg-transparent px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-white/20 dark:focus-visible:ring-zinc-100"
            {...register("name")}
          />
          {errors.name ? (
            <p id="name-error" className="text-sm text-red-600 dark:text-red-400">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="h-11 rounded-lg border border-black/15 bg-transparent px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-white/20 dark:focus-visible:ring-zinc-100"
            {...register("email")}
          />
          {errors.email ? (
            <p id="email-error" className="text-sm text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Senha
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : "password-hint"}
            className="h-11 rounded-lg border border-black/15 bg-transparent px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-white/20 dark:focus-visible:ring-zinc-100"
            {...register("password")}
          />
          {errors.password ? (
            <p id="password-error" className="text-sm text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          ) : (
            <p id="password-hint" className="text-sm text-zinc-500 dark:text-zinc-400">
              Mínimo de 8 caracteres.
            </p>
          )}
        </div>

        <div aria-live="polite">
          {serverError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isBusy}
          className="h-11 rounded-lg bg-foreground text-background font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? "Criando conta…" : "Criar conta"}
        </button>
      </form>

      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </section>
  );
}
