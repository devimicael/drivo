import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthHero } from "@/components/ui/AuthHero";
import { LoginForm } from "@/features/auth/LoginForm";

export const metadata: Metadata = {
  title: "Entrar — DRIVO",
};

async function LoginCard({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { expirada } = await searchParams;
  const sessionExpired = expirada === "1" || (Array.isArray(expirada) && expirada.includes("1"));

  return <LoginForm sessionExpired={sessionExpired} />;
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="grid w-full min-h-dvh grid-cols-1 bg-surface scheme-dark lg:grid-cols-2">
      <AuthHero
        image="/img/login.jpg"
        title={
          <>
            Sua garagem,
            <br />
            sempre à mão.
          </>
        }
        subtitle="Placa, Renavam e licenciamento de todos os seus veículos em um só lugar."
      />

      {/* Coluna direita: formulário centralizado + link de cadastro fixo no rodapé. */}
      <section className="flex min-h-dvh flex-col lg:min-h-0">
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <Suspense
            fallback={
              <p aria-live="polite" className="text-sm text-muted">
                Carregando…
              </p>
            }
          >
            {/* searchParams é dinâmico: sob PPR precisa ficar dentro de <Suspense>. */}
            <LoginCard searchParams={searchParams} />
          </Suspense>
        </div>

        <footer className="pb-7 text-center text-sm text-muted">
          Ainda não tem conta?{" "}
          <Link
            href="/cadastro"
            className="font-medium text-primary transition-colors hover:text-primary-hover"
          >
            Criar conta
          </Link>
        </footer>
      </section>
    </main>
  );
}
