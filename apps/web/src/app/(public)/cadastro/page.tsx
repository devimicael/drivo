import type { Metadata } from "next";
import Link from "next/link";
import { AuthHero } from "@/components/ui/AuthHero";
import { RegisterForm } from "@/features/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Criar conta — DRIVO",
};

export default function CadastroPage() {
  return (
    <main className="grid min-h-dvh w-full grid-cols-1 bg-surface scheme-dark lg:grid-cols-2">
      <AuthHero
        image="/img/cadastro.jpg"
        title={
          <>
            Cadastre uma vez.
            <br />O CRLV faz o resto.
          </>
        }
        subtitle="Importe o documento e os dados do veículo são preenchidos automaticamente."
      />

      <section className="relative flex min-h-dvh flex-col lg:min-h-0">
        <div className="flex flex-1 items-center justify-center px-6 py-12 lg:py-6">
          <RegisterForm />
        </div>

        <footer className="pb-16 text-center text-sm text-muted">
          Já tem uma conta?{" "}
          <Link
            href="/login"
            className="font-medium text-primary transition-colors hover:text-primary-hover"
          >
            Entrar
          </Link>
        </footer>
      </section>
    </main>
  );
}
