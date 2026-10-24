"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useLogout, useSession } from "@/hooks/use-auth";

export default function GaragemPage() {
  const router = useRouter();
  const session = useSession();
  const logout = useLogout();

  // Sessão inválida/expirada volta para a entrada (o proxy cuida do caso sem cookie).
  useEffect(() => {
    if (session.isError) {
      router.replace("/login");
    }
  }, [session.isError, router]);

  async function handleLogout(): Promise<void> {
    try {
      await logout.mutateAsync();
    } finally {
      router.replace("/login");
    }
  }

  if (session.isPending) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <p aria-live="polite" className="text-sm text-zinc-600 dark:text-zinc-400">
          Carregando sua garagem…
        </p>
      </main>
    );
  }

  if (!session.data) {
    return <main className="flex flex-1" />;
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Olá, {session.data.name}</p>
          <h1 className="text-3xl font-semibold tracking-tight">Minha garagem</h1>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={logout.isPending}
          className="h-10 rounded-lg border border-black/15 px-4 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
        >
          {logout.isPending ? "Saindo…" : "Sair"}
        </button>
      </header>

      <section className="rounded-2xl border border-dashed border-black/15 px-6 py-16 text-center dark:border-white/20">
        <h2 className="text-lg font-medium">Sua garagem está vazia</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Você ainda não cadastrou nenhum veículo. O cadastro e a importação do CRLV chegam na
          próxima etapa.
        </p>
      </section>
    </main>
  );
}
