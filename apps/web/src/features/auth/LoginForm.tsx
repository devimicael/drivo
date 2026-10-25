"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { useLogin } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import { loginSchema, type LoginFormValues } from "@/schemas/auth.schema";

export function LoginForm({ sessionExpired = false }: { sessionExpired?: boolean }) {
  const router = useRouter();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Mensagem genérica em 401 — nunca revela se o e-mail existe (RN-11).
  const serverError =
    login.error instanceof ApiError
      ? login.error.message
      : login.error
        ? "Não foi possível entrar. Tente novamente."
        : null;

  const isBusy = isSubmitting || login.isPending;

  async function onSubmit(values: LoginFormValues): Promise<void> {
    try {
      await login.mutateAsync(values);
      router.replace("/garagem");
    } catch {
      // O erro é lido de `login.error` e anunciado acima do botão.
    }
  }

  return (
    <div className="w-full max-w-[360px]">
      <header className="flex flex-col items-center text-center">
        <Logo width={80} />
        <h1 className="mt-8 text-[32px] leading-[1.15] font-bold tracking-[-0.8px] text-foreground">
          Entrar no Drivo
        </h1>
        <p className="mt-2 max-w-[320px] text-[15px] leading-[1.45] text-muted">
          Seus veículos, documentos e dados em um só lugar.
        </p>
      </header>

      {sessionExpired ? (
        <p className="mt-6 rounded-lg bg-field px-3 py-2 text-center text-sm text-bright" role="status">
          Sua sessão expirou. Entre novamente.
        </p>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 flex flex-col gap-4">
        <Input
          id="email"
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="mariana.costa@email.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          id="password"
          label="Senha"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />

        {/* Erro da API (401) — anunciado sem recarregar a página. */}
        {serverError ? (
          <p aria-live="polite" className="text-center text-sm text-danger">
            {serverError}
          </p>
        ) : null}

        <Button type="submit" loading={isBusy} className="mt-4 lg:mt-6">
          Entrar
        </Button>
      </form>
    </div>
  );
}
