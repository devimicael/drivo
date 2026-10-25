"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { useRegister } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import { registerFormSchema, type RegisterFormValues } from "@/schemas/auth.schema";

export function RegisterForm() {
  const router = useRouter();
  const registration = useRegister();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
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
    <div className="w-full max-w-[360px]">
      <header className="flex flex-col items-center text-center">
        <Logo width={80} />
        <h1 className="mt-8 text-[32px] leading-[1.15] font-bold tracking-[-0.8px] text-foreground">
          Criar sua conta
        </h1>
        <p className="mt-2 max-w-[320px] text-[15px] leading-[1.45] text-muted">
          Leva menos de um minuto. Depois é só adicionar seus veículos.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 flex flex-col gap-3">
        <Input
          id="name"
          label="Nome completo"
          type="text"
          autoComplete="name"
          placeholder="Mariana Costa"
          error={errors.name?.message}
          {...register("name")}
        />

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
          autoComplete="new-password"
          placeholder="••••••••••••"
          error={errors.password?.message}
          {...register("password")}
        />

        <Input
          id="confirmPassword"
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••••"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {serverError ? (
          <p aria-live="polite" className="text-center text-sm text-danger">
            {serverError}
          </p>
        ) : null}

        <Button type="submit" loading={isBusy} className="mt-4">
          Criar conta
        </Button>
      </form>
    </div>
  );
}
