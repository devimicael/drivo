"use client";
import { PageLoading } from "@/components/ui/PageLoading";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GarageHeader } from "@/components/garage/GarageHeader";
import { useSession } from "@/hooks/use-auth";
import { ProfileForm } from "@/features/profile/ProfileForm";
import { PasswordForm } from "@/features/profile/PasswordForm";
import { LogoutButton } from "@/features/auth/LogoutButton";

export default function PerfilPage() {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session.isError) router.replace("/login");
  }, [session.isError, router]);

  if (session.isPending || !session.data) {
    return <PageLoading />;
  }

  const user = session.data;
  const memberSince = new Date(user.createdAt).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return (
    <div className="min-h-screen bg-surface text-foreground">
      <GarageHeader />
      <main className="mx-auto w-full max-w-[1008px] px-6 pb-24 pt-12">
        <div className="flex items-center gap-6">
          <span
            aria-hidden="true"
            className="flex size-20 shrink-0 items-center justify-center rounded-full bg-[#635BFF] text-3xl font-medium text-white"
          >
            {user.name
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0]?.toLocaleUpperCase("pt-BR"))
              .join("")}
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-bright sm:text-[32px]">
              {user.name}
            </h1>
            <p className="mt-2 break-words text-xs leading-5 text-muted">
              {user.email} <span aria-hidden="true">·</span> Membro desde{" "}
              {memberSince}
            </p>
          </div>
        </div>
        <div className="mt-16 space-y-16">
          <section
            aria-labelledby="personal-title"
            className="grid items-start gap-6 md:grid-cols-[280px_minmax(0,1fr)] md:gap-12"
          >
            <div>
              <h2
                id="personal-title"
                className="text-lg font-semibold text-bright"
              >
                Informações pessoais
              </h2>
              <p className="mt-2 max-w-64 text-sm leading-5 text-muted">
                Seu nome aparece no app. O e-mail é usado para entrar e receber
                avisos.
              </p>
            </div>
            <ProfileForm name={user.name} email={user.email} />
          </section>
          <section
            aria-labelledby="password-title"
            className="grid items-start gap-6 md:grid-cols-[280px_minmax(0,1fr)] md:gap-12"
          >
            <div>
              <h2
                id="password-title"
                className="text-lg font-semibold text-bright"
              >
                Senha
              </h2>
              <p className="mt-2 max-w-64 text-sm leading-5 text-muted">
                Use ao menos 8 caracteres, combinando letras e números. Você
                continuará conectado neste dispositivo.
              </p>
            </div>
            <PasswordForm />
          </section>
          <section
            aria-labelledby="account-title"
            className="grid items-start gap-6 md:grid-cols-[280px_minmax(0,1fr)] md:gap-12"
          >
            <div>
              <h2
                id="account-title"
                className="text-lg font-semibold text-bright"
              >
                Conta
              </h2>
              <p className="mt-2 max-w-64 text-sm leading-5 text-muted">
                Encerre a sessão neste dispositivo.
              </p>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-raised px-6 py-4">
              <div>
                <h3 className="text-sm font-medium text-bright">
                  Sair da conta
                </h3>
                <p className="mt-1 text-xs text-muted">
                  Encerra a sessão neste dispositivo
                </p>
              </div>
              <LogoutButton compact />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
